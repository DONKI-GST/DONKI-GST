const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateInput(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, message: 'Informe data inicial e data final.' };
  }

  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
    return { valid: false, message: 'Use datas válidas no formato YYYY-MM-DD.' };
  }

  if (startDate > endDate) {
    return { valid: false, message: 'A data inicial não pode ser maior que a data final.' };
  }

  return { valid: true, message: '' };
}
