-- ServiLink: esquema completo (versao nova). Correr no SQL Editor do Supabase.
-- Em base ja usada pela versao antiga, corra primeiro o 00-limpar-tudo.sql.
--
-- SEGURANCA: o site so acede a base de dados no SERVIDOR, com a chave service_role.
-- Por isso retiramos todas as permissoes a anon/authenticated (o browser nunca le
-- tabelas diretamente) e ativamos RLS em todas as tabelas como segunda barreira.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Utilizadores (clientes, profissionais, admin)
-- ---------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('cliente', 'profissional', 'admin')),
  status text not null default 'aprovado'
    check (status in ('pendente', 'aprovado', 'rejeitado', 'banido')),
  nome text not null check (char_length(nome) between 2 and 80),
  bairro text check (bairro is null or char_length(bairro) <= 80),
  -- WhatsApp: cifrado (AES-256-GCM) + hash HMAC para unicidade e login. Nunca em claro.
  whatsapp_enc text,
  whatsapp_hash text,
  -- So profissionais
  grupo text check (grupo in ('digital', 'domicilio')),
  categoria text,
  descricao text check (descricao is null or char_length(descricao) <= 300),
  foto_url text,
  galeria text[] not null default '{}',
  verificado boolean not null default false,
  oculto_manual boolean not null default false,
  aprovado_em timestamptz,
  trial_fim timestamptz,          -- fim dos 2 meses gratis
  pago_ate timestamptz,           -- fim da cobertura paga (ja inclui pagamento antecipado)
  plano_codigo text check (plano_codigo in ('essencial', 'destaque', 'anual')),
  home_destaque_mes text,         -- 'AAAA-MM' do mes em que esteve em destaque na inicial (PRO)
  -- Anti-duplicados
  dispositivo_hash text,
  duplicado_de uuid,
  motivo_rejeicao text,
  created_at timestamptz not null default now(),
  constraint pro_tem_grupo check (role <> 'profissional' or (grupo is not null and categoria is not null))
);
-- 1 numero WhatsApp = 1 conta por tipo (cliente / profissional).
create unique index users_whatsapp_unico on public.users (role, whatsapp_hash) where whatsapp_hash is not null;
create index users_pro_idx on public.users (role, status, grupo, categoria);
create index users_dispositivo_idx on public.users (dispositivo_hash) where dispositivo_hash is not null;

-- Historico ligado ao numero: sobrevive mesmo que a conta seja apagada.
create table public.contas_historico (
  whatsapp_hash text not null,
  role text not null,
  primeiro_registo timestamptz not null default now(),
  trial_concedido boolean not null default false,
  primary key (whatsapp_hash, role)
);

-- ---------------------------------------------------------------
-- Cliques no botao "Falar no WhatsApp" (so o admin ve)
-- ---------------------------------------------------------------
create table public.cliques_whatsapp (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid references public.users (id) on delete set null,
  profissional_hash text,
  cliente_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index cliques_pro_idx on public.cliques_whatsapp (profissional_id, created_at desc);
create index cliques_cliente_idx on public.cliques_whatsapp (cliente_id, created_at desc);

-- ---------------------------------------------------------------
-- Avaliacoes (so quem clicou em "Falar no WhatsApp" pode avaliar)
-- ---------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references public.users (id) on delete cascade,
  cliente_id uuid not null references public.users (id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text check (comentario is null or char_length(comentario) <= 200),
  created_at timestamptz not null default now(),
  unique (profissional_id, cliente_id)
);

-- ---------------------------------------------------------------
-- Avisos do admin (vermelho fixo / verde que o profissional pode fechar)
-- ---------------------------------------------------------------
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  cor text not null check (cor in ('vermelho', 'verde')),
  texto text not null check (char_length(texto) between 3 and 500),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index avisos_user_idx on public.avisos (user_id, ativo);

-- ---------------------------------------------------------------
-- Denuncias de perfil falso
-- ---------------------------------------------------------------
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.users (id) on delete set null,
  alvo_id uuid references public.users (id) on delete cascade,
  motivo text not null check (char_length(motivo) between 5 and 500),
  status text not null default 'aberta' check (status in ('aberta', 'resolvida', 'arquivada')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Pagamentos dos planos (M-Pesa / e-Mola). Nunca guarda o numero completo.
-- ---------------------------------------------------------------
create table public.pagamentos_plano (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  whatsapp_hash text,
  plano_codigo text not null check (plano_codigo in ('essencial', 'destaque', 'anual')),
  valor int not null check (valor > 0),
  metodo text not null check (metodo in ('mpesa', 'emola')),
  numero_mascarado text,
  referencia text not null unique,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'falhou', 'indeterminado')),
  modo text not null default 'real' check (modo in ('real', 'teste')),
  codigo_resposta text,
  transaction_id text,
  conversation_id text,
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  created_at timestamptz not null default now(),
  confirmado_em timestamptz
);
-- Evita cobrar duas vezes ao mesmo tempo: so um pagamento em curso por profissional.
create unique index pagamento_em_curso_unico on public.pagamentos_plano (user_id)
  where status in ('pendente', 'indeterminado');
create index pagamentos_data_idx on public.pagamentos_plano (created_at desc);

-- ---------------------------------------------------------------
-- Limite de tentativas (login, registo): 5 erradas = bloqueio de 15 min
-- ---------------------------------------------------------------
create table public.login_tentativas (
  chave text primary key,
  tentativas int not null default 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Ativacao de plano: atomica e idempotente (callback, resposta direta e
-- reconciliacao podem chamar em simultaneo sem ativar duas vezes).
-- Regra: o periodo pago comeca no fim do periodo gratis/pago que ja existe.
-- ---------------------------------------------------------------
create or replace function public.ativar_pagamento_plano(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pg public.pagamentos_plano%rowtype;
  u public.users%rowtype;
  inicio timestamptz;
  fim timestamptz;
begin
  select * into pg from public.pagamentos_plano where id = p_id for update;
  if not found or pg.status = 'confirmado' then
    return false;
  end if;
  if pg.user_id is null then
    return false;
  end if;

  select * into u from public.users where id = pg.user_id for update;
  if not found or u.role <> 'profissional' or u.status <> 'aprovado' then
    return false;
  end if;

  inicio := greatest(now(), coalesce(u.pago_ate, now()), coalesce(u.trial_fim, now()));
  if pg.plano_codigo = 'anual' then
    fim := inicio + interval '12 months';
  else
    fim := inicio + interval '1 month';
  end if;

  update public.users
     set pago_ate = fim, plano_codigo = pg.plano_codigo
   where id = u.id;

  update public.pagamentos_plano
     set status = 'confirmado', confirmado_em = now(),
         periodo_inicio = inicio, periodo_fim = fim
   where id = pg.id;
  return true;
end;
$$;
revoke all on function public.ativar_pagamento_plano(uuid) from public, anon, authenticated;
grant execute on function public.ativar_pagamento_plano(uuid) to service_role;

-- ---------------------------------------------------------------
-- Vistas (so o servidor le)
-- ---------------------------------------------------------------
-- Profissionais visiveis ao publico: todos os aprovados e nao escondidos (plano Essencial
-- gratis, sem prazo). Destaque/Anual so contam enquanto pago_ate estiver no futuro.
create or replace view public.v_profissionais as
select
  u.id, u.nome, u.bairro, u.grupo, u.categoria, u.descricao, u.foto_url, u.galeria,
  u.verificado, u.created_at, u.home_destaque_mes,
  case when u.pago_ate > now() and u.plano_codigo in ('destaque', 'anual')
       then u.plano_codigo else 'essencial' end as plano_ativo,
  case when u.pago_ate > now() and u.plano_codigo = 'anual' then 3
       when u.pago_ate > now() and u.plano_codigo = 'destaque' then 2
       else 1 end as prioridade,
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

create or replace view public.v_cliques as
select profissional_id,
       count(*)::int as total,
       count(*) filter (where created_at > now() - interval '7 days')::int as ultimos_7_dias
from public.cliques_whatsapp
where profissional_id is not null
group by profissional_id;

-- ---------------------------------------------------------------
-- Permissoes: nada para anon/authenticated; tudo para o servidor.
-- ---------------------------------------------------------------
alter table public.users enable row level security;
alter table public.contas_historico enable row level security;
alter table public.cliques_whatsapp enable row level security;
alter table public.reviews enable row level security;
alter table public.avisos enable row level security;
alter table public.denuncias enable row level security;
alter table public.pagamentos_plano enable row level security;
alter table public.login_tentativas enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------
-- Storage: bucket publico so de fotos. Uploads so pelo servidor (sem policies).
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
