-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('member', 'admin', 'super_admin');
create type post_type as enum ('need', 'offer');
create type post_status as enum ('active', 'matched', 'completed', 'abandoned', 'flagged');
create type match_type as enum ('direct', 'loop');
create type match_status as enum ('pending_review', 'approved', 'rejected', 'completed', 'abandoned');
create type ai_value_action as enum ('accepted', 'edited', 'ignored', 'flagged');
create type flag_type as enum ('spam', 'suspicious_pricing', 'repeated_failure', 'invite_abuse', 'poor_ai_match', 'user_report', 'unusual_activity');

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ValueLooper',
  avatar_url text,
  bio text,
  location text,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  invited_by uuid references profiles(id),
  role user_role not null default 'member',
  onboarding_complete boolean not null default false,
  trust_score int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invite links
create table invite_links (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  click_count int not null default 0,
  signup_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Posts
create table posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type post_type not null,
  title text not null,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  location text,
  remote_ok boolean not null default true,
  estimated_value numeric(10,2),
  ai_value_min numeric(10,2),
  ai_value_max numeric(10,2),
  ai_value_accepted ai_value_action,
  cash_price numeric(10,2),
  stripe_link text,
  status post_status not null default 'active',
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Matches
create table matches (
  id uuid primary key default uuid_generate_v4(),
  type match_type not null default 'direct',
  status match_status not null default 'pending_review',
  match_score int not null default 0,
  ai_explanation text not null default '',
  ai_model text not null default '',
  admin_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Match participants
create table match_participants (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  role text not null default 'giver'
);

-- Chat threads
create table chat_threads (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Chat messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Exchanges
create table exchanges (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  status text not null default 'in_progress',
  cash_used boolean not null default false,
  stripe_payment_id text,
  completed_at timestamptz,
  outcome_notes text,
  ai_suggestion_useful boolean,
  created_at timestamptz not null default now()
);

-- AI recommendation log
create table ai_recommendation_log (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  input_snapshot jsonb,
  output_snapshot jsonb,
  model text,
  user_action ai_value_action,
  outcome text,
  created_at timestamptz not null default now()
);

-- Activity flags
create table activity_flags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type flag_type not null,
  description text,
  resolved boolean not null default false,
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Indexes
create index posts_user_id_idx on posts(user_id);
create index posts_type_status_idx on posts(type, status);
create index posts_category_idx on posts(category);
create index matches_status_idx on matches(status);
create index match_participants_user_id_idx on match_participants(user_id);
create index chat_messages_thread_id_idx on chat_messages(thread_id);
create index activity_flags_user_id_idx on activity_flags(user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  _invite_code text := substr(md5(new.id::text || random()::text), 1, 8);
  _name text := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, display_name, invite_code)
  values (new.id, _name, _invite_code);
  insert into public.invite_links (owner_id, slug)
  values (new.id, _invite_code);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create chat thread when match is approved
create or replace function public.handle_match_approved()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    insert into public.chat_threads (match_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_match_approved
  after update on matches
  for each row execute procedure public.handle_match_approved();

-- RLS
alter table profiles enable row level security;
alter table posts enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table exchanges enable row level security;
alter table activity_flags enable row level security;
alter table invite_links enable row level security;

-- Profiles policies
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts policies
create policy "Active posts are viewable" on posts for select using (status = 'active' or user_id = auth.uid());
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- Matches policies
create policy "Participants can view their matches" on matches for select
  using (exists (select 1 from match_participants where match_id = matches.id and user_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));

-- Match participants policies
create policy "Participants can view participants" on match_participants for select
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));

-- Chat policies
create policy "Thread participants can view threads" on chat_threads for select
  using (exists (select 1 from match_participants mp join matches m on m.id = mp.match_id where m.id = chat_threads.match_id and mp.user_id = auth.uid()));
create policy "Thread participants can view messages" on chat_messages for select
  using (exists (select 1 from chat_threads ct join matches m on m.id = ct.match_id join match_participants mp on mp.match_id = m.id where ct.id = chat_messages.thread_id and mp.user_id = auth.uid()));
create policy "Thread participants can insert messages" on chat_messages for insert
  with check (auth.uid() = user_id and exists (select 1 from chat_threads ct join matches m on m.id = ct.match_id join match_participants mp on mp.match_id = m.id where ct.id = thread_id and mp.user_id = auth.uid()));

-- Activity flags: admins only
create policy "Admins can view flags" on activity_flags for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));
create policy "Admins can manage flags" on activity_flags for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin')));

-- Invite links
create policy "Anyone can view active invite links" on invite_links for select using (is_active = true);
create policy "Owners can manage their invite links" on invite_links for all using (owner_id = auth.uid());
