import { describe, expect, it, vi } from 'vitest';
import { buildGstUrl, fetchGstEvents } from './api';

describe('buildGstUrl', () => {
  it('monta URL com parâmetros esperados', () => {
    const url = buildGstUrl({
      baseUrl: 'https://api.nasa.gov/DONKI',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      apiKey: 'abc123',
    });

    expect(url).toContain('/GST?');
    expect(url).toContain('startDate=2026-09-01');
    expect(url).toContain('endDate=2026-09-02');
    expect(url).toContain('api_key=abc123');
  });
});

describe('fetchGstEvents', () => {
  it('retorna payload em caso de sucesso', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ gstID: 'A1' }]),
    });

    const result = await fetchGstEvents({
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      fetchImpl,
      baseUrl: 'https://api.nasa.gov/DONKI',
      apiKey: 'demo',
    });

    expect(result).toEqual([{ gstID: 'A1' }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('lança erro quando status HTTP não é sucesso', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(
      fetchGstEvents({
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        fetchImpl,
      }),
    ).rejects.toThrow('Falha ao consultar DONKI-GST');
  });

  it('lança erro para payload inválido', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ gstID: 'A1' }),
    });

    await expect(
      fetchGstEvents({
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        fetchImpl,
      }),
    ).rejects.toThrow('Formato de resposta inválido');
  });
});
