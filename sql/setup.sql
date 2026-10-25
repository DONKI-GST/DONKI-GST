-- DONKI-GST-DB: execute no Supabase em SQL Editor -> New query -> Run.
-- Pode ser executado mais de uma vez (idempotente).

-- 1) Tabela principal: tempestades geomagnéticas (DONKI / GST)
create table if not exists public.gst_eventos (
  id                   bigint generated always as identity primary key,
  gst_id               text        not null,          -- chave natural da NASA (gstID)
  start_time           timestamptz not null,
  kp_max               numeric(4,2),                  -- maior Kp entre as medições
  kp_max_observado_em  timestamptz,
  kp_max_fonte         text,
  nivel_g              smallint    not null default 0 check (nivel_g between 0 and 5),
  qtd_medicoes         integer     not null default 0,
  all_kp_index         jsonb       not null default '[]'::jsonb,
  linked_events        jsonb       not null default '[]'::jsonb,
  link                 text,
  submission_time      timestamptz,
  version_id           integer,
  atualizado_em        timestamptz not null default now(),
  constraint gst_eventos_gst_id_key unique (gst_id)   -- permite upsert sem duplicatas
);

create index if not exists gst_eventos_start_time_idx
  on public.gst_eventos (start_time desc);

-- 2) Log das execuções do pipeline
create table if not exists public.execucoes (
  id                    bigint generated always as identity primary key,
  iniciado_em           timestamptz not null default now(),
  finalizado_em         timestamptz not null default now(),
  registros_processados integer     not null default 0,
  lotes                 integer     not null default 0,
  erros                 integer     not null default 0,
  status                text        not null
                        check (status in ('concluido', 'erro_parcial', 'erro_critico')),
  mensagem              text
);

-- 3) Row Level Security (RLS) com leitura pública
alter table public.gst_eventos enable row level security;
alter table public.execucoes   enable row level security;

drop policy if exists "leitura publica gst_eventos" on public.gst_eventos;
create policy "leitura publica gst_eventos"
  on public.gst_eventos for select
  to anon, authenticated
  using (true);

drop policy if exists "leitura publica execucoes" on public.execucoes;
create policy "leitura publica execucoes"
  on public.execucoes for select
  to anon, authenticated
  using (true);

-- 4) GRANTs explícitos
grant usage on schema public to anon, authenticated, service_role;

grant select on public.gst_eventos to anon, authenticated;
grant select on public.execucoes   to anon, authenticated;

grant all on public.gst_eventos to service_role;
grant all on public.execucoes   to service_role;
grant usage, select on all sequences in schema public to service_role;
