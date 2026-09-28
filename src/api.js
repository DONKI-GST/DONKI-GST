const DEFAULT_BASE_URL = 'https://api.nasa.gov/DONKI';

export function buildGstUrl({ startDate, endDate, apiKey, baseUrl = DEFAULT_BASE_URL }) {
  const url = new URL('/GST', baseUrl);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('api_key', apiKey || 'DEMO_KEY');
  return url.toString();
}

export async function fetchGstEvents({
  startDate,
  endDate,
  signal,
  fetchImpl = fetch,
  baseUrl = import.meta.env.VITE_DONKI_BASE_URL || DEFAULT_BASE_URL,
  apiKey = import.meta.env.VITE_DONKI_API_KEY || 'DEMO_KEY',
}) {
  const response = await fetchImpl(buildGstUrl({ startDate, endDate, apiKey, baseUrl }), { signal });

  if (!response.ok) {
    throw new Error(`Falha ao consultar DONKI-GST (HTTP ${response.status}).`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error('Formato de resposta inválido da DONKI-GST.');
  }

  return payload;
}
