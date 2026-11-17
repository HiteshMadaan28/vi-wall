-- ============================================================================
-- The VI Wall — fix verify_and_allocate column ambiguity
-- ----------------------------------------------------------------------------
-- The previous definition used RETURNS TABLE columns named `status`,
-- `tile_index`, etc. Those become PL/pgSQL variables that collide with real
-- table columns, so `where status = 'available'` was ambiguous (SQLSTATE
-- 42702). This version renames the output columns with an `out_` prefix and
-- fully qualifies table columns. Safe to run on top of 0001.
--
-- The return type (OUT columns) changed, so the old function must be dropped
-- before recreating it.
-- ============================================================================

drop function if exists verify_and_allocate(text, boolean);

create function verify_and_allocate(
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

  -- grab the next free tile (atomic: concurrent callers each get a distinct row)
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
