-- ============================================================================
-- The VI Wall — Phase Two: tile reservations + completion state
-- ----------------------------------------------------------------------------
-- ADDITIVE migration. It preserves every existing participant and tile:
--   * existing 'available'/'occupied' tiles keep their status and data;
--   * new nullable columns default to NULL;
--   * no rows are deleted and no tile_index changes.
-- Run after 0001–0004. Safe to run once on the live database.
-- ============================================================================

-- 1) allow a third tile status: 'reserved'
alter table wall_tiles drop constraint if exists wall_tiles_status_check;
alter table wall_tiles
  add constraint wall_tiles_status_check
  check (status in ('available','reserved','occupied'));

-- 2) reservation columns on wall_tiles
alter table wall_tiles add column if not exists reserved_until     timestamptz;
alter table wall_tiles add column if not exists reservation_token  text;

create index if not exists wall_tiles_reserved_idx
  on wall_tiles(reserved_until) where status = 'reserved';

-- 3) link a participant to the specific tile they chose
alter table participants add column if not exists reservation_token   text;
alter table participants add column if not exists reserved_tile_index integer;

-- 4) singleton completion-state row (the one-time completion flag)
create table if not exists wall_state (
  id           integer primary key default 1 check (id = 1),
  completed_at timestamptz
);
insert into wall_state (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- release_expired_reservations: free any reservations past their expiry.
-- Called opportunistically (before reserving, and when reading wall/stats) so
-- no external cron is required for Phase Two.
-- ---------------------------------------------------------------------------
create or replace function release_expired_reservations()
returns void as $$
begin
  update wall_tiles
  set status = 'available', reserved_until = null, reservation_token = null
  where status = 'reserved' and reserved_until < now();
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- reserve_tile: atomically reserve a specific available tile.
--   * Expired reservations are released first.
--   * The single conditional UPDATE is atomic: if two callers race for the
--     same tile, only one row is updated; the other gets 'tile_unavailable'.
-- Returns the reservation expiry timestamp.
-- ---------------------------------------------------------------------------
create or replace function reserve_tile(
  p_tile_index integer,
  p_token text,
  p_minutes integer default 10
)
returns timestamptz as $$
declare
  v_until timestamptz;
begin
  perform release_expired_reservations();

  update wall_tiles
  set status = 'reserved',
      reservation_token = p_token,
      reserved_until = now() + make_interval(mins => p_minutes)
  where wall_tiles.tile_index = p_tile_index
    and wall_tiles.status = 'available'
  returning wall_tiles.reserved_until into v_until;

  if v_until is null then
    raise exception 'tile_unavailable' using errcode = 'P0010';
  end if;

  return v_until;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- verify_and_occupy: verify an email and permanently occupy the participant's
-- RESERVED tile (replaces the old auto-allocation for the manual-select flow).
--   * Confirms the reservation is still valid and unexpired.
--   * Atomically flips the tile to 'occupied'.
--   * Checks for wall completion exactly once.
-- ---------------------------------------------------------------------------
create or replace function verify_and_occupy(
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
  out_country_iso text,
  out_completed boolean
) as $$
declare
  v_participant participants%rowtype;
  v_tile wall_tiles%rowtype;
  v_new_status text;
  v_iso text;
  v_count integer;
  v_total integer;
  v_completed boolean := false;
begin
  perform release_expired_reservations();

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

  if v_participant.reserved_tile_index is null then
    raise exception 'no_reservation' using errcode = 'P0011';
  end if;

  -- the reserved tile must still be reserved by THIS participant and unexpired
  select * into v_tile
  from wall_tiles
  where wall_tiles.tile_index = v_participant.reserved_tile_index
    and wall_tiles.reservation_token = v_participant.reservation_token
    and wall_tiles.status = 'reserved'
    and wall_tiles.reserved_until > now()
  for update;

  if not found then
    raise exception 'reservation_expired' using errcode = 'P0012';
  end if;

  v_new_status := case when p_auto_approve then 'approved' else 'verified' end;

  update participants
  set email_verified = true,
      verification_token = null,
      reservation_token = null,
      status = v_new_status
  where participants.id = v_participant.id;

  update wall_tiles
  set participant_id = v_participant.id,
      country_id = v_participant.country_id,
      status = 'occupied',
      reservation_token = null,
      reserved_until = null,
      claimed_at = now()
  where wall_tiles.id = v_tile.id
  returning * into v_tile;

  select countries.iso_code into v_iso
  from countries where countries.id = v_participant.country_id;

  insert into activity_events(event_type, participant_id, country_id, metadata)
  values ('player_joined', v_participant.id, v_participant.country_id,
          jsonb_build_object('username', v_participant.username,
                             'country_iso', v_iso,
                             'tile_index', v_tile.tile_index));

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

    -- completion check (exactly once via the WHERE completed_at IS NULL guard)
    select count(*) into v_count
    from wall_tiles wt
    join participants pp on pp.id = wt.participant_id
    where wt.status = 'occupied' and pp.status = 'approved';

    select count(*) into v_total from wall_tiles;

    if v_count >= v_total then
      update wall_state set completed_at = now()
      where id = 1 and completed_at is null;
      if found then
        v_completed := true;
        insert into activity_events(event_type, metadata)
        values ('wall_completed', jsonb_build_object('tiles', v_total));
      end if;
    end if;
  end if;

  return query
  select v_participant.id, v_participant.username, v_new_status,
         v_tile.tile_index, v_tile.x_position, v_tile.y_position, v_iso, v_completed;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- release_participant_tile: extend to also clear reservation columns.
-- ---------------------------------------------------------------------------
create or replace function release_participant_tile(p_participant uuid)
returns void as $$
begin
  update wall_tiles
  set participant_id = null,
      country_id = null,
      status = 'available',
      reservation_token = null,
      reserved_until = null,
      claimed_at = null
  where participant_id = p_participant;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- grants for the new objects (service_role only)
-- ---------------------------------------------------------------------------
grant all privileges on wall_state to service_role;
grant execute on function release_expired_reservations() to service_role;
grant execute on function reserve_tile(integer, text, integer) to service_role;
grant execute on function verify_and_occupy(text, boolean) to service_role;
