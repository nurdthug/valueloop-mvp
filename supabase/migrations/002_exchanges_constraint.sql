-- Unique constraint on exchanges.match_id so chat page can upsert
alter table exchanges add constraint exchanges_match_id_key unique (match_id);

-- Ensure activity_flags has resolved columns (add if missing)
alter table activity_flags
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_by uuid references profiles(id),
  add column if not exists description text,
  add column if not exists metadata jsonb;

create index if not exists activity_flags_resolved_idx on activity_flags(resolved);
create index if not exists exchanges_match_id_idx on exchanges(match_id);
