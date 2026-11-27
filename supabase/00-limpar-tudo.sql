-- ATENCAO: APAGA TUDO (tabelas do ServiLink antigo e todas as contas).
-- Use so uma vez, antes do schema.sql novo, quando a base so tem dados de teste.
-- Depois de correr este ficheiro, corra o supabase/schema.sql.

drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;

delete from auth.users;
