-- ServiLink v3: migracao NAO destrutiva (nao apaga tabelas nem dados).
-- Correr no SQL Editor do Supabase depois do schema.sql (base nova) ou diretamente (base ja existente).
-- Pode ser corrida mais de uma vez.

-- ---------------------------------------------------------------
-- 1. Utilizadores: codigo admin, cidade, bairros de atendimento, preco base, estado "suspenso"
-- ---------------------------------------------------------------
alter table public.users add column if not exists admin_code text;
alter table public.users add column if not exists cidade text;
alter table public.users add column if not exists bairros_atendimento text[] not null default '{}';
alter table public.users add column if not exists preco_base integer check (preco_base is null or preco_base between 0 and 100000000);
create unique index if not exists users_admin_code_unico on public.users (lower(admin_code)) where admin_code is not null;

alter table public.users drop constraint if exists users_status_check;
alter table public.users add constraint users_status_check
  check (status in ('pendente', 'aprovado', 'rejeitado', 'suspenso', 'banido'));

alter table public.users drop constraint if exists users_plano_codigo_check;
alter table public.users add constraint users_plano_codigo_check
  check (plano_codigo is null or plano_codigo in ('essencial', 'pro', 'destaque', 'anual'));

-- ---------------------------------------------------------------
-- 2. Planos (preco e duracao controlados na base de dados, nunca pelo navegador)
-- ---------------------------------------------------------------
create table if not exists public.planos (
  codigo text primary key check (codigo in ('essencial', 'pro')),
  nome text not null,
  descricao text,
  preco integer not null check (preco >= 0),
  moeda text not null default 'MZN',
  dias integer not null check (dias >= 0),
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
insert into public.planos (codigo, nome, descricao, preco, moeda, dias, ativo) values
  ('essencial', 'Essencial', 'Plano gratuito: perfil visivel aos clientes.', 0, 'MZN', 0, true),
  ('pro', 'PRO', 'Destaque nos resultados, borda dourada, selo PRO e fotos de trabalhos.', 599, 'MZN', 90, true)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------
-- 3. Pagamentos (reaproveita pagamentos_plano; "referencia" = order_id da SkyWallet)
-- ---------------------------------------------------------------
alter table public.pagamentos_plano drop constraint if exists pagamentos_plano_plano_codigo_check;
alter table public.pagamentos_plano add constraint pagamentos_plano_plano_codigo_check
  check (plano_codigo in ('essencial', 'pro', 'destaque', 'anual'));
alter table public.pagamentos_plano add column if not exists provider text not null default 'skywallet';
alter table public.pagamentos_plano add column if not exists moeda text not null default 'MZN';
alter table public.pagamentos_plano add column if not exists erro_mensagem text;
alter table public.pagamentos_plano add column if not exists atualizado_em timestamptz not null default now();
alter table public.pagamentos_plano alter column modo set default 'real';
alter table public.pagamentos_plano drop constraint if exists pagamentos_plano_referencia_len;
alter table public.pagamentos_plano add constraint pagamentos_plano_referencia_len
  check (referencia ~ '^[A-Za-z0-9]{1,20}$') not valid;  -- order_id: so alfanumerico, max 20
create index if not exists pagamentos_user_idx on public.pagamentos_plano (user_id, created_at desc);
create index if not exists pagamentos_status_idx on public.pagamentos_plano (status, created_at desc);

-- Subscricoes (uma por pagamento confirmado)
create table if not exists public.subscricoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plano_codigo text not null,
  pagamento_id uuid not null unique references public.pagamentos_plano (id),
  status text not null default 'ativa' check (status in ('ativa', 'expirada')),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists subscricoes_user_idx on public.subscricoes (user_id, expires_at desc);

-- Registo de notificacoes recebidas do fornecedor (auditoria e idempotencia)
create table if not exists public.eventos_pagamento (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  origem text not null,                 -- webhook | consulta
  estado text,
  resultado text not null,              -- ativado | duplicado | ignorado | rejeitado | falhou
  detalhe text,
  created_at timestamptz not null default now()
);
create index if not exists eventos_pagamento_order_idx on public.eventos_pagamento (order_id, created_at desc);

-- Ativacao atomica e idempotente do PRO (duracao lida da tabela planos)
create or replace function public.ativar_pagamento_plano(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pg public.pagamentos_plano%rowtype;
  u public.users%rowtype;
  dias_plano integer;
  inicio timestamptz;
  fim timestamptz;
begin
  select * into pg from public.pagamentos_plano where id = p_id for update;
  if not found or pg.status = 'confirmado' or pg.user_id is null then
    return false;
  end if;

  select * into u from public.users where id = pg.user_id for update;
  if not found or u.role <> 'profissional' or u.status <> 'aprovado' then
    return false;
  end if;

  select dias into dias_plano from public.planos where codigo = 'pro';
  if dias_plano is null or dias_plano <= 0 then
    dias_plano := 90;
  end if;

  -- Renovacao: nao perde os dias que ainda tem.
  inicio := greatest(now(), coalesce(u.pago_ate, now()));
  fim := inicio + make_interval(days => dias_plano);

  update public.users set pago_ate = fim, plano_codigo = 'pro' where id = u.id;

  update public.pagamentos_plano
     set status = 'confirmado', confirmado_em = now(), atualizado_em = now(),
         periodo_inicio = inicio, periodo_fim = fim, erro_mensagem = null
   where id = pg.id;

  insert into public.subscricoes (user_id, plano_codigo, pagamento_id, status, starts_at, expires_at)
  values (u.id, 'pro', pg.id, 'ativa', inicio, fim);
  return true;
end;
$$;
revoke all on function public.ativar_pagamento_plano(uuid) from public, anon, authenticated;
grant execute on function public.ativar_pagamento_plano(uuid) to service_role;

-- ---------------------------------------------------------------
-- 4. Auditoria administrativa, reclamacoes, metricas
-- ---------------------------------------------------------------
create table if not exists public.auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users (id) on delete set null,
  acao text not null,
  alvo_id uuid,
  alvo_nome text,
  motivo text,
  created_at timestamptz not null default now()
);
create index if not exists auditoria_data_idx on public.auditoria_admin (created_at desc);

create table if not exists public.reclamacoes (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.users (id) on delete set null,
  nome_interno text,                       -- so a equipa ServiLink ve
  contacto_interno text,                   -- so a equipa ServiLink ve
  texto text not null check (char_length(texto) between 10 and 1000),
  status text not null default 'nova' check (status in ('nova', 'em_analise', 'resolvida', 'arquivada')),
  publica boolean not null default false,  -- a equipa decide se aparece (como SIGILO)
  resposta text,
  created_at timestamptz not null default now()
);
create index if not exists reclamacoes_status_idx on public.reclamacoes (status, created_at desc);

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('visita', 'pesquisa', 'perfil')),
  categoria text,
  cidade text,
  bairro text,
  dispositivo_hash text,
  created_at timestamptz not null default now()
);
alter table public.eventos add column if not exists ref text;
create index if not exists eventos_tipo_idx on public.eventos (tipo, created_at desc);

-- Denuncias com tipo
alter table public.denuncias add column if not exists tipo text
  check (tipo is null or tipo in ('perfil_falso', 'contacto_invalido', 'informacao_enganosa', 'comportamento', 'fraude', 'outro'));

-- WhatsApp: tambem conta visitantes sem conta (limite de 1 clique por dia por dispositivo)
alter table public.cliques_whatsapp add column if not exists dispositivo_hash text;
create index if not exists cliques_dispositivo_idx on public.cliques_whatsapp (dispositivo_hash, created_at desc);

-- ---------------------------------------------------------------
-- 5. Vista publica dos profissionais (aprovados e nao escondidos)
-- ---------------------------------------------------------------
drop view if exists public.v_profissionais;
create view public.v_profissionais as
select
  u.id, u.nome, u.bairro, u.cidade, u.bairros_atendimento, u.preco_base,
  u.grupo, u.categoria, u.descricao, u.foto_url, u.galeria,
  u.verificado, u.created_at, u.home_destaque_mes,
  case when u.pago_ate > now() and u.plano_codigo in ('pro', 'destaque', 'anual')
       then 'pro' else 'essencial' end as plano_ativo,
  case when u.pago_ate > now() and u.plano_codigo in ('pro', 'destaque', 'anual')
       then 3 else 1 end as prioridade,
  coalesce(r.media, 0)::numeric(3,2) as nota_media,
  coalesce(r.total, 0)::int as total_avaliacoes
from public.users u
left join (
  select profissional_id, avg(nota) as media, count(*) as total
  from public.reviews group by profissional_id
) r on r.profissional_id = u.id
where u.role = 'profissional'
  and u.status = 'aprovado'
  and not u.oculto_manual;

-- ---------------------------------------------------------------
-- 6. Seguranca: RLS ligado e nenhuma permissao para anon/authenticated
-- ---------------------------------------------------------------
alter table public.planos enable row level security;
alter table public.subscricoes enable row level security;
alter table public.eventos_pagamento enable row level security;
alter table public.auditoria_admin enable row level security;
alter table public.reclamacoes enable row level security;
alter table public.eventos enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
