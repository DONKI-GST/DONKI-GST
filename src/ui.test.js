/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { renderEvents, renderStatus } from './ui';

describe('renderEvents', () => {
  it('exibe resumo e mensagem de vazio quando não há eventos', () => {
    const container = document.createElement('section');

    renderEvents(container, [], { range: { startDate: '2026-09-01', endDate: '2026-09-02' } });

    expect(container.querySelector('.query-summary')).not.toBeNull();
    expect(container.textContent).toContain('Total de eventos');
    expect(container.textContent).toContain('Nenhum evento GST encontrado');
  });

  it('renderiza card com campos principais, links seguros e detalhes adicionais', () => {
    const container = document.createElement('section');

    renderEvents(
      container,
      [
        {
          gstID: 'GST-1',
          startTime: '2026-09-10T00:00:00Z',
          endTime: '2026-09-10T05:00:00Z',
          link: 'https://example.com/evento',
          allKpIndex: [
            { kpIndex: 5.67, observedTime: '2026-09-10T01:00:00Z', source: 'NOAA' },
            { kpIndex: 7.1, observedTime: '2026-09-10T02:00:00Z', source: 'NOAA' },
          ],
          note: 'Evento relevante',
          linkedEvents: [{ activityID: 'CME-1' }],
        },
      ],
      { range: { startDate: '2026-09-01', endDate: '2026-09-30' } },
    );

    const card = container.querySelector('.event-card');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('GST-1');
    expect(card?.textContent).toContain('Kp máx: 7.1');
    expect(card?.textContent).toContain('Evento relevante');

    const sourceLink = card?.querySelector('a');
    expect(sourceLink?.getAttribute('target')).toBe('_blank');
    expect(sourceLink?.getAttribute('rel')).toBe('noreferrer');

    const linkedEventsValue = card?.querySelector('.extra-value')?.textContent || '';
    expect(linkedEventsValue).not.toContain('[object Object]');
  });

  it('aplica fallback Não informado para campos ausentes', () => {
    const container = document.createElement('section');

    renderEvents(container, [{ gstID: '', allKpIndex: [] }], {
      range: { startDate: '2026-09-01', endDate: '2026-09-30' },
    });

    expect(container.textContent).toContain('Não informado');
  });
});

describe('renderStatus', () => {
  it('atualiza classe, papel ARIA e mensagem', () => {
    const status = document.createElement('div');
    renderStatus(status, { type: 'success', message: 'ok' });

    expect(status.className).toBe('status status--success');
    expect(status.textContent).toBe('ok');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('usa alert para erros', () => {
    const status = document.createElement('div');
    renderStatus(status, { type: 'error', message: 'falha' });

    expect(status.className).toBe('status status--error');
    expect(status.getAttribute('role')).toBe('alert');
    expect(status.getAttribute('aria-live')).toBe('assertive');
  });
});
