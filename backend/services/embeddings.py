import gc
import hashlib
import os
import math
from threading import Lock


model = None
model_lock = Lock()


def _env_int(name, default):
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _env_bool(name, default=False):
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def _local_embeddings_enabled():
    return _env_bool("ENABLE_LOCAL_EMBEDDINGS", False)


def _hash_embedding(text, dimension=384):
    vector = [0.0] * dimension
    tokens = (text or "").lower().split()

    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % dimension
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    magnitude = math.sqrt(sum(value * value for value in vector))

    if magnitude == 0:
        return vector

    return [
        value / magnitude
        for value in vector
    ]


def _hash_embeddings(chunks):
    dimension = _env_int("EMBEDDING_DIMENSION", 384)

    return [
        _hash_embedding(chunk, dimension)
        for chunk in chunks
    ]


def get_embedding_model():
    global model

    if not _local_embeddings_enabled():
        raise RuntimeError(
            "Local sentence-transformers embeddings are disabled. "
            "Set ENABLE_LOCAL_EMBEDDINGS=true to load the model."
        )

    if model is not None:
        return model

    with model_lock:
        if model is None:
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer(
                os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2"),
                device=os.getenv("EMBEDDING_DEVICE", "cpu")
            )

    return model


def generate_embeddings(chunks):
    if not chunks:
        return []

    if not _local_embeddings_enabled():
        return _hash_embeddings(chunks)

    batch_size = max(1, _env_int("EMBEDDING_BATCH_SIZE", 4))
    embedding_model = get_embedding_model()
    all_embeddings = []

    try:
        for start in range(0, len(chunks), batch_size):
            batch = chunks[start:start + batch_size]
            embeddings = embedding_model.encode(
                batch,
                batch_size=batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )

            all_embeddings.extend(embeddings.tolist())

        return all_embeddings

    except Exception as exc:
        raise RuntimeError(f"Embedding model failed to load or encode text: {exc}") from exc

    finally:
        gc.collect()
