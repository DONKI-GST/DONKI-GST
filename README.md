# DONKI-GST: pipeline de tempestades geomagnéticas

Atividade Avaliativa do 3º Trimestre: pipeline de dados com as APIs abertas da NASA.

**Grupo 04** | Organização `SN-2026-GRUPO-04-NASA` | Integrantes: Lucas Ramos, Beatriz e Raul

## Links

| Item | Link |
|------|------|
| Organização no GitHub | https://github.com/DONKI-GST |
| Repositório | https://github.com/DONKI-GST/DONKI-GST  |
| Painel publicado (GitHub Pages) | https://donki-gst.github.io/DONKI-GST/ |
| Projeto no Supabase | `DONKI-GST-DB` (região South America, São Paulo) |

## A API: DONKI / GST

A **DONKI** (Space Weather Database Of Notifications, Knowledge, Information), mantida pelo CCMC da NASA, reúne eventos de clima espacial. O endpoint **GST** (Geomagnetic Storm) lista as tempestades geomagnéticas. Cada registro traz:

- `gstID`: identificador único da tempestade (usado como chave de deduplicação)
- `startTime`: início do evento (UTC)
- `allKpIndex`: medições do índice **Kp** (0 a 9), com horário e fonte (NOAA)
- `linkedEvents`: eventos solares ligados à tempestade (CME, HSS, IPS etc.)
- `link`, `submissionTime`, `versionId`: página do evento na NASA, data de envio e versão

**Relevância científica:** tempestades geomagnéticas são causadas pela interação do vento solar e de ejeções de massa coronal com o campo magnético da Terra. Elas podem afetar satélites, GPS, redes elétricas e produzir auroras. A escala NOAA usada no painel converte o Kp em níveis: Kp 5 = G1, 6 = G2, 7 = G3, 8 = G4 e 9 = G5.

**Endpoint usado:** `https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD`

> **Particularidade encontrada:** o enunciado indica `api.nasa.gov/DONKI/GST` com chave, mas esse endereço deixou de entregar dados após a migração do DONKI para o CCMC em 30/09/2026 (o workflow falhou com erro 503). O novo endereço não exige chave. O endereço antigo continua no script apenas como reserva.

## Arquitetura

```
GitHub Actions (a cada 6 h ou manual)
        |
        v
scripts/fetch_nasa.py  ->  Supabase (PostgreSQL + API REST)  ->  index.html (GitHub Pages)
```

1. O workflow `.github/workflows/update-data.yml` roda pelo agendamento (cron) ou manualmente (`workflow_dispatch`), com `permissions: contents: read`, `concurrency` e `timeout-minutes`.
2. O script `scripts/fetch_nasa.py` consulta a API em janelas de 30 dias, normaliza os campos, **deduplica por `gst_id`** (evita o erro PostgreSQL 21000) e faz **upsert em lotes de 100**.
3. Cada execução é registrada na tabela `execucoes` com registros processados, lotes, erros e status (`concluido`, `erro_parcial` ou `erro_critico`). Em caso de falha, o script termina com `sys.exit(1)` e o erro fica visível nos logs do Actions.
4. O painel lê a API REST pública do Supabase (RLS com leitura pública) e mostra gráfico, tabela, filtros e a última atualização.

### Modelagem

- **`gst_eventos`**: tabela principal, com `UNIQUE (gst_id)` (chave natural da NASA). Guarda início, Kp máximo, nível G, quantidade de medições, medições completas e eventos ligados (JSON) e link.
- **`execucoes`**: log do pipeline (início, fim, registros, lotes, erros, status e mensagem).
- RLS ativo nas duas tabelas, com política de leitura pública. `SELECT` para `anon` e `authenticated`, `ALL` para `service_role`. Veja `sql/setup.sql`.

## Painel

Publicado no GitHub Pages (`index.html`), consome a API REST do Supabase e oferece:

- gráfico de barras do Kp máximo de cada tempestade, colorido pelo nível G
- tabela de eventos com link para a página da NASA
- filtros de período e de intensidade mínima
- data e status da última execução do pipeline (lidos de `execucoes`)
- `escapeHtml()` aplicada a todo valor externo inserido no HTML

## Divisão de responsabilidades

| Área | Responsável |
|------|-------------|
| Painel (frontend) | Lucas Ramos e Beatriz |
| Pipeline (Actions e script) | Lucas Ramos e Raul) |
| Banco de dados (Supabase) | Raul |
| Documentação | Beatriz |

   
## Como configurar

1. **GitHub:** crie a organização `SN-2026-GRUPO-04-NASA` e o repositório público `DONKI-GST`. Convide o usuário `GilFerques`.
2. **Supabase:** crie a organização com o mesmo nome e o projeto `DONKI-GST-DB` (South America, São Paulo). Rode o conteúdo de `sql/setup.sql` no SQL Editor. Convide `rafael.ferques@ifpr.edu.br` como Developer.
3. **Secrets do GitHub** (Settings, Secrets and variables, Actions):

   | Secret | Valor |
   |--------|-------|
   | `SUPABASE_URL` | URL do projeto |
   | `SUPABASE_SERVICE_KEY` | secret key (service_role). Nunca vai para o código |
   | `NASA_API_KEY` | chave de api.nasa.gov (opcional, usada só no endereço de reserva) |

4. **Painel:** em `index.html`, defina `SUPABASE_URL` e `SUPABASE_KEY` com a URL do projeto e a **publishable key** (somente leitura).
5. **GitHub Pages:** Settings, Pages, branch `main`, pasta `/ (root)`.
6. **Primeira coleta:** aba Actions, "Atualizar dados DONKI-GST", Run workflow. Confira o ícone verde, os dados em `gst_eventos` e a linha `concluido` em `execucoes`.

Para testar a API REST do Supabase no navegador:

```
https://SEU-PROJETO.supabase.co/rest/v1/gst_eventos?select=gst_id,start_time,kp_max,nivel_g&order=start_time.desc&limit=5&apikey=SUA_PUBLISHABLE_KEY
```

## Segurança

- A secret key (service_role) existe apenas nos Secrets do GitHub, nunca no código, em commits ou prints.
- O painel usa somente a publishable key, e todo valor externo passa por `escapeHtml()`.
- Em caso de exposição de uma chave, ela deve ser regenerada imediatamente.

## Uso de IA generativa

O grupo usou IA generativa (Claude, da Anthropic, em conversa de chat) para gerar o código-base e corrigir erros. A configuração das plataformas, os testes e a validação dos resultados foram feitos pelos integrantes. O registro completo está em `docs/ai-interaction.md` e a análise crítica em `docs/reflexao.md`.
