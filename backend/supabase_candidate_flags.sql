alter table applicants
add column if not exists resume_hash text,
add column if not exists mobile_number text,
add column if not exists duplicate_email boolean not null default false,
add column if not exists duplicate_resume boolean not null default false,
add column if not exists role_mismatch boolean not null default false,
add column if not exists suspicious_resume boolean not null default false,
add column if not exists fraud_flags jsonb not null default '[]'::jsonb,
add column if not exists email_verified boolean not null default false,
add column if not exists mobile_verified boolean not null default false,
add column if not exists email_verification_token text,
add column if not exists email_verified_at timestamptz;

create index if not exists applicants_email_idx
on applicants (email);

create index if not exists applicants_resume_hash_idx
on applicants (resume_hash);
