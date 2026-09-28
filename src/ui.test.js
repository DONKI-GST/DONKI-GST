/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { renderEvents, renderStatus } from './ui';

describe('renderEvents', () => {
  it('exibe mensagem de vazio quando não há eventos', () => {
    const container = document.createElement('section');
    renderEvents(container, []);
    expect(container.textContent).toContain('Nenhum evento GST encontrado');
  });

  it('renderiza cards quando há eventos', () => {
    const container = document.createElement('section');
    renderEvents(container, [{ gstID: 'GST-1', startTime: '2026-09-10T00:00Z', allKpIndex: [{ kpIndex: 7 }] }]);
    expect(container.querySelectorAll('.event-card')).toHaveLength(1);
    expect(container.textContent).toContain('GST-1');
  });
});

describe('renderStatus', () => {
  it('atualiza classe e mensagem', () => {
    const status = document.createElement('div');
    renderStatus(status, { type: 'success', message: 'ok' });
    expect(status.className).toBe('success');
    expect(status.textContent).toBe('ok');
  });
});
