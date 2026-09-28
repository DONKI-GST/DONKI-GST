import { describe, expect, it } from 'vitest';
import { validateDateRange } from './validation';

describe('validateDateRange', () => {
  it('retorna erro quando datas estão ausentes', () => {
    expect(validateDateRange('', '')).toEqual({
      valid: false,
      message: 'Informe data inicial e data final.',
    });
  });

  it('retorna erro para formato de data inválido', () => {
    expect(validateDateRange('2026-13-40', '2026-09-10')).toEqual({
      valid: false,
      message: 'Use datas válidas no formato YYYY-MM-DD.',
    });
  });

  it('retorna erro quando início é maior que fim', () => {
    expect(validateDateRange('2026-09-12', '2026-09-10')).toEqual({
      valid: false,
      message: 'A data inicial não pode ser maior que a data final.',
    });
  });

  it('retorna válido para intervalo correto', () => {
    expect(validateDateRange('2026-09-10', '2026-09-12')).toEqual({ valid: true, message: '' });
  });
});
