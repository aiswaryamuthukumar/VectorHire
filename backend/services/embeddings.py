from sentence_transformers import SentenceTransformer

model = None


def get_embedding_model():

    global model

    if model is None:
        model = SentenceTransformer(
            'all-MiniLM-L6-v2'
        )

    return model


def generate_embeddings(chunks):

    embeddings = get_embedding_model().encode(

        chunks,

        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True

    )

    return embeddings.tolist()
