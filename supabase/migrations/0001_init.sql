-- ============================================================================
-- The VI Wall — Phase One schema
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or via the Supabase CLI) before
-- 0002_seed_tiles.sql. All writes happen through server-side API routes using
-- the service-role key, which bypasses RLS. RLS is enabled with no public
-- policies so the anon/public key cannot read or write tables directly — this
-- keeps participant emails off the client entirely.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- countries
-- ---------------------------------------------------------------------------
create table if not exists countries (
  id          serial primary key,
  iso_code    text not null unique,
  name        text not null,
  flag_emoji  text not null default '🏳️',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
-- status lifecycle:
--   pending_verification -> (email verified) -> verified -> approved
--   any state -> rejected / removed / suspended (frees the tile)
create table if not exists participants (
  id                   uuid primary key default gen_random_uuid(),
  username             text not null,
  username_normalized  text not null unique,
  email                text not null,
  email_normalized     text not null unique,
  email_verified       boolean not null default false,
  verification_token   text,
  verification_sent_at timestamptz,
  country_id           integer not null references countries(id),
  avatar               text not null default 'violet-orb',
  avatar_url           text,
  message              text,
  social_url           text,
  status               text not null default 'pending_verification'
                         check (status in ('pending_verification','verified',
                                           'approved','rejected','removed','suspended')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists participants_status_idx on participants(status);
create index if not exists participants_country_idx on participants(country_id);
create index if not exists participants_token_idx on participants(verification_token);

-- ---------------------------------------------------------------------------
-- wall_tiles  (pre-seeded; one row per position in the VI silhouette)
-- ---------------------------------------------------------------------------
create table if not exists wall_tiles (
  id               uuid primary key default gen_random_uuid(),
  tile_index       integer not null unique,
  x_position       integer not null,
  y_position       integer not null,
  allocation_order integer not null unique,
  participant_id   uuid unique references participants(id) on delete set null,
  country_id       integer references countries(id),
  status           text not null default 'available'
                     check (status in ('available','occupied')),
  claimed_at       timestamptz
);

create index if not exists wall_tiles_available_idx
  on wall_tiles(allocation_order) where status = 'available';
create index if not exists wall_tiles_participant_idx on wall_tiles(participant_id);
create index if not exists wall_tiles_country_idx on wall_tiles(country_id);

-- ---------------------------------------------------------------------------
-- activity_events  (real events only — never fabricated)
-- ---------------------------------------------------------------------------
create table if not exists activity_events (
  id             bigserial primary key,
  event_type     text not null,
  participant_id uuid references participants(id) on delete set null,
  country_id     integer references countries(id),
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists activity_events_created_idx on activity_events(created_at desc);

-- ---------------------------------------------------------------------------
-- admin_users + admin_actions (audit trail)
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  identifier   text not null unique,
  role         text not null default 'moderator'
                 check (role in ('moderator','admin')),
  created_at   timestamptz not null default now()
);

create table if not exists admin_actions (
  id                bigserial primary key,
  action            text not null,
  admin_identifier  text not null,
  target_participant_id uuid references participants(id) on delete set null,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists admin_actions_created_idx on admin_actions(created_at desc);

-- ---------------------------------------------------------------------------
-- country_stats view — leaderboard source of truth.
-- Counts only tiles whose participant is APPROVED, so rejected/removed
-- participants stop contributing automatically.
-- ---------------------------------------------------------------------------
create or replace view country_stats as
select
  c.id   as country_id,
  c.iso_code,
  c.name,
  c.flag_emoji,
  count(wt.id) filter (where p.status = 'approved') as tiles
from countries c
left join wall_tiles wt on wt.country_id = c.id and wt.status = 'occupied'
left join participants p on p.id = wt.participant_id
group by c.id, c.iso_code, c.name, c.flag_emoji;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists participants_updated_at on participants;
create trigger participants_updated_at
  before update on participants
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- verify_and_allocate: atomically verify an email and assign one free tile.
-- This is the heart of the claim flow and the concurrency guarantee:
--   * SELECT ... FOR UPDATE SKIP LOCKED + LIMIT 1 hands each concurrent
--     caller a different free tile.
--   * when only one tile remains, exactly one caller wins; the rest raise
--     'wall_full'.
--   * the UNIQUE constraint on wall_tiles.participant_id means a tile can
--     never be allocated to the same participant twice.
-- Returns one row with the participant + assigned tile.
-- ---------------------------------------------------------------------------
create or replace function verify_and_allocate(
  p_token text,
  p_auto_approve boolean default true
)
returns table (
  out_participant_id uuid,
  out_username text,
  out_status text,
  out_tile_index integer,
  out_x integer,
  out_y integer,
  out_country_iso text
) as $$
declare
  v_participant participants%rowtype;
  v_tile_id uuid;
  v_tile wall_tiles%rowtype;
  v_new_status text;
  v_iso text;
  v_count integer;
begin
  select * into v_participant
  from participants
  where participants.verification_token = p_token
  for update;

  if not found then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if v_participant.email_verified and v_participant.status <> 'pending_verification' then
    raise exception 'already_verified' using errcode = 'P0002';
  end if;

  -- grab the next free tile
  select wall_tiles.id into v_tile_id
  from wall_tiles
  where wall_tiles.status = 'available'
  order by wall_tiles.allocation_order
  for update skip locked
  limit 1;

  if v_tile_id is null then
    raise exception 'wall_full' using errcode = 'P0003';
  end if;

  v_new_status := case when p_auto_approve then 'approved' else 'verified' end;

  update participants
  set email_verified = true,
      verification_token = null,
      status = v_new_status
  where participants.id = v_participant.id;

  update wall_tiles
  set participant_id = v_participant.id,
      country_id = v_participant.country_id,
      status = 'occupied',
      claimed_at = now()
  where wall_tiles.id = v_tile_id
  returning * into v_tile;

  select countries.iso_code into v_iso
  from countries where countries.id = v_participant.country_id;

  insert into activity_events(event_type, participant_id, country_id, metadata)
  values ('player_joined', v_participant.id, v_participant.country_id,
          jsonb_build_object('username', v_participant.username, 'country_iso', v_iso));

  -- milestone events (real counts only)
  if p_auto_approve then
    select count(*) into v_count
    from wall_tiles wt
    join participants pp on pp.id = wt.participant_id
    where wt.country_id = v_participant.country_id and pp.status = 'approved';

    if v_count > 0 and v_count % 500 = 0 then
      insert into activity_events(event_type, country_id, metadata)
      values ('country_milestone', v_participant.country_id,
              jsonb_build_object('country_iso', v_iso, 'tiles', v_count));
    end if;
  end if;

  return query
  select v_participant.id, v_participant.username, v_new_status,
         v_tile.tile_index, v_tile.x_position, v_tile.y_position, v_iso;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- release_participant_tile: free a tile when a participant is rejected/removed.
-- ---------------------------------------------------------------------------
create or replace function release_participant_tile(p_participant uuid)
returns void as $$
begin
  update wall_tiles
  set participant_id = null,
      country_id = null,
      status = 'available',
      claimed_at = null
  where participant_id = p_participant;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Row Level Security: lock everything down. The service-role key used by the
-- server bypasses RLS; the anon key is never used for table access.
-- ---------------------------------------------------------------------------
alter table countries       enable row level security;
alter table participants    enable row level security;
alter table wall_tiles      enable row level security;
alter table activity_events enable row level security;
alter table admin_users     enable row level security;
alter table admin_actions   enable row level security;

-- ---------------------------------------------------------------------------
-- Seed countries
-- ---------------------------------------------------------------------------
insert into countries (iso_code, name, flag_emoji) values
  ('IN','India','🇮🇳'),('US','United States','🇺🇸'),('GB','United Kingdom','🇬🇧'),
  ('BR','Brazil','🇧🇷'),('DE','Germany','🇩🇪'),('FR','France','🇫🇷'),
  ('CA','Canada','🇨🇦'),('AU','Australia','🇦🇺'),('JP','Japan','🇯🇵'),
  ('KR','South Korea','🇰🇷'),('MX','Mexico','🇲🇽'),('IT','Italy','🇮🇹'),
  ('ES','Spain','🇪🇸'),('NL','Netherlands','🇳🇱'),('SE','Sweden','🇸🇪'),
  ('PL','Poland','🇵🇱'),('RU','Russia','🇷🇺'),('TR','Turkey','🇹🇷'),
  ('AR','Argentina','🇦🇷'),('ID','Indonesia','🇮🇩'),('PH','Philippines','🇵🇭'),
  ('ZA','South Africa','🇿🇦'),('EG','Egypt','🇪🇬'),('NG','Nigeria','🇳🇬'),
  ('SA','Saudi Arabia','🇸🇦'),('AE','United Arab Emirates','🇦🇪'),('PK','Pakistan','🇵🇰'),
  ('BD','Bangladesh','🇧🇩'),('VN','Vietnam','🇻🇳'),('TH','Thailand','🇹🇭'),
  ('MY','Malaysia','🇲🇾'),('SG','Singapore','🇸🇬'),('UA','Ukraine','🇺🇦'),
  ('PT','Portugal','🇵🇹'),('GR','Greece','🇬🇷'),('IE','Ireland','🇮🇪'),
  ('NO','Norway','🇳🇴'),('FI','Finland','🇫🇮'),('DK','Denmark','🇩🇰'),
  ('BE','Belgium','🇧🇪'),('CH','Switzerland','🇨🇭'),('AT','Austria','🇦🇹'),
  ('CZ','Czechia','🇨🇿'),('NZ','New Zealand','🇳🇿'),('CL','Chile','🇨🇱'),
  ('CO','Colombia','🇨🇴'),('PE','Peru','🇵🇪'),('RO','Romania','🇷🇴'),
  ('HU','Hungary','🇭🇺'),('IL','Israel','🇮🇱')
on conflict (iso_code) do nothing;
