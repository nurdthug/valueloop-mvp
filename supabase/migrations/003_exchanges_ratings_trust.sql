-- ============================================================================
-- 003: Fix exchange RLS, allow participants to close matches, add trust ratings
-- Run this in the Supabase SQL editor (dashboard) against the ValueLoop project.
-- Safe to re-run: uses drop-if-exists / if-not-exists throughout.
-- ============================================================================

-- ── Helper: is the current user a participant in a given match? ──────────────
create or replace function public.is_match_participant(_match_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from match_participants
    where match_id = _match_id and user_id = auth.uid()
  );
$$;

-- ── Exchanges RLS (previously enabled with NO policies = deny all) ───────────
drop policy if exists "Participants view exchanges" on exchanges;
create policy "Participants view exchanges" on exchanges for select
  using (public.is_match_participant(match_id)
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));

drop policy if exists "Participants create exchanges" on exchanges;
create policy "Participants create exchanges" on exchanges for insert
  with check (public.is_match_participant(match_id));

drop policy if exists "Participants update exchanges" on exchanges;
create policy "Participants update exchanges" on exchanges for update
  using (public.is_match_participant(match_id));

-- ── Let participants close out their own match (complete / abandon) ──────────
drop policy if exists "Participants update match status" on matches;
create policy "Participants update match status" on matches for update
  using (public.is_match_participant(id));

-- ── Ratings ─────────────────────────────────────────────────────────────────
create table if not exists ratings (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  rater_id uuid not null references profiles(id) on delete cascade,
  ratee_id uuid not null references profiles(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (match_id, rater_id, ratee_id)
);

create index if not exists ratings_ratee_idx on ratings(ratee_id);
create index if not exists ratings_match_idx on ratings(match_id);

alter table ratings enable row level security;

drop policy if exists "View ratings you gave, received, or admin" on ratings;
create policy "View ratings you gave, received, or admin" on ratings for select
  using (rater_id = auth.uid() or ratee_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));

drop policy if exists "Rate people you exchanged with" on ratings;
create policy "Rate people you exchanged with" on ratings for insert
  with check (
    rater_id = auth.uid()
    and rater_id <> ratee_id
    and public.is_match_participant(match_id)
    and exists (select 1 from match_participants where match_id = ratings.match_id and user_id = ratee_id)
  );

-- ── Recompute trust_score from ratings on every new/changed rating ───────────
-- Maps average stars (1–5) onto a 20–100 trust scale. Unrated users stay at 50.
create or replace function public.recompute_trust_score()
returns trigger language plpgsql security definer as $$
declare
  _avg numeric;
begin
  select avg(stars) into _avg from ratings where ratee_id = new.ratee_id;
  update profiles
    set trust_score = greatest(0, least(100, round(coalesce(_avg, 2.5) * 20)::int)),
        updated_at = now()
  where id = new.ratee_id;
  return new;
end;
$$;

drop trigger if exists on_rating_change on ratings;
create trigger on_rating_change
  after insert or update on ratings
  for each row execute procedure public.recompute_trust_score();
