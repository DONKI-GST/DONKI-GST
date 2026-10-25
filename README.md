# DONKI-GST: pipeline de tempestades geomagnéticas

Atividade Avaliativa do 3º Trimestre: pipeline de dados com as APIs abertas da NASA.
**Grupo 04** | Organização `SN-2026-GRUPO-04-NASA` | Integrantes: Lucas Ramos, Beatriz e Raul

## Links

- Repositório: https://github.com/SN-2026-GRUPO-04-NASA/DONKI-GST
- Painel publicado: https://sn-2026-grupo-04-nasa.github.io/DONKI-GST/

## A API

A **DONKI** (Space Weather Database Of Notifications, Knowledge, Information) registra eventos de clima espacial. O endpoint **GST** (Geomagnetic Storm) lista tempestades geomagnéticas, cada uma com o horário de início, as medições do índice **Kp** (de 0 a 9) e os eventos solares ligados a ela.

- Endpoint: `https://api.nasa.gov/DONKI/GST?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD&api_key=...`
- Exige a chave gratuita da NASA (`NASA_API_KEY`).
- Escala NOAA usada no painel: Kp 5 = G1, 6 = G2, 7 = G3, 8 = G4, 9 = G5.

## Arquitetura

```
GitHub Actions (cron a cada 6 h)  ->  scripts/fetch_nasa.py  ->  Supabase (PostgreSQL)  ->  index.html (GitHub Pages)
```

1. O workflow `.github/workflows/update-data.yml` roda no agendamento ou manualmente.
2. O script consulta a API, normaliza os campos, **deduplica por `gst_id`** e faz **upsert em lotes de 100**.
3. Cada execução é registrada na tabela `execucoes` (`concluido`, `erro_parcial` ou `erro_critico`). Em caso de erro o script termina com `sys.exit(1)`.
4. O painel lê a API REST pública do Supabase (RLS com leitura pública) e mostra gráfico, tabela, filtros e a última atualização.

**Modelagem:** tabela `gst_eventos` com `UNIQUE (gst_id)` (chave natural da NASA) e tabela `execucoes`. Veja `sql/setup.sql`.

## Divisão de responsabilidades

| Área | Responsável |
|------|-------------|
| Painel (frontend) | Lucas Ramos |
| Pipeline (Actions e script) | a definir |
| Banco de dados (Supabase) | a definir |
| Documentação | a definir |

## Como configurar

1. **Supabase:** crie o projeto `DONKI-GST-DB` (região South America, São Paulo) e rode `sql/setup.sql` no SQL Editor.
2. **Secrets do GitHub** (Settings, Secrets and variables, Actions):
   - `SUPABASE_URL`: URL do projeto
   - `SUPABASE_SERVICE_KEY`: secret key (service_role). Nunca vai para o código.
   - `NASA_API_KEY`: chave gerada em https://api.nasa.gov
3. **Painel:** em `index.html`, troque `SUPABASE_URL` e `SUPABASE_KEY` pela URL do projeto e pela **publishable key** (anon, somente leitura).
4. **Pages:** Settings, Pages, branch `main`, pasta `/ (root)`.
5. **Primeira coleta:** aba Actions, "Atualizar dados DONKI-GST", Run workflow.

## Segurança

- A secret key (service_role) só existe nos Secrets do GitHub.
- O painel usa apenas a publishable key, e todo valor externo passa por `escapeHtml()`.
- O workflow usa `permissions: contents: read`, `concurrency` e `timeout-minutes`.

## Uso de IA generativa

Este projeto usou IA generativa como apoio. Os prompts e a análise crítica estão em `docs/ai-interaction.md` e `docs/reflexao.md`.

## Estrutura

```
index.html
README.md
scripts/fetch_nasa.py
sql/setup.sql
.github/workflows/update-data.yml
docs/ (tutorial.pdf, ai-interaction.md, reflexao.md, apresentacao.pdf)
```
