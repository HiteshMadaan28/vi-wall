-- ============================================================================
-- The VI Wall — service_role grants
-- ----------------------------------------------------------------------------
-- The app does ALL database access server-side as `service_role` (which
-- bypasses RLS). When the project's "Automatically expose new tables" setting
-- is off, service_role is not granted table privileges automatically, so this
-- script grants them explicitly. Safe to run multiple times.
--
-- Note: only service_role is granted access. The public `anon` role is
-- deliberately NOT granted anything, so the browser key can never read tables
-- directly and participant emails stay private.
-- ============================================================================

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- make the grants apply to anything created later as well
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;
