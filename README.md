# DONKI-GST Dashboard

Aplicação web para consultar eventos de tempestade geomagnética (GST) na API DONKI.

## Assunções

- O arquivo `Atividade Avaliativa 3 Trim.pdf` não está disponível no conteúdo versionado deste repositório no branch atual. Por isso, a implementação foi baseada no enunciado textual da issue e no endpoint público DONKI/GST.
- Endpoint consumido: `GET /DONKI/GST` com parâmetros `startDate`, `endDate` e `api_key`.

## Pré-requisitos

- Node.js 20+
- npm 10+

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
3. Ajuste as variáveis se necessário:
   - `VITE_DONKI_BASE_URL` (padrão: `https://api.nasa.gov/DONKI`)
   - `VITE_DONKI_API_KEY` (padrão local: `DEMO_KEY`)

## Como executar

```bash
npm run dev
```

Abra a URL exibida pelo Vite.

## Build

```bash
npm run build
npm run preview
```

## Testes e qualidade

```bash
npm run lint
npm run test
```

## Funcionalidades implementadas

- Formulário de busca com validação de intervalo de datas.
- Tratamento de estados de carregamento, vazio e erro.
- Renderização dos eventos GST retornados pela DONKI.
- Configuração centralizada da integração DONKI por variáveis de ambiente.
- Testes automatizados para validação, cliente de API e renderização de UI.
