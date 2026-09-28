import './style.css';
import { fetchGstEvents } from './api';
import { renderEvents, renderStatus } from './ui';
import { validateDateRange } from './validation';

const form = document.querySelector('#search-form');
const startDateInput = document.querySelector('#start-date');
const endDateInput = document.querySelector('#end-date');
const submitButton = document.querySelector('#submit-button');
const status = document.querySelector('#status');
const results = document.querySelector('#results');

let controller;

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Consultando...' : 'Buscar eventos';
  results.setAttribute('aria-busy', String(isLoading));
}

function setDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const formatDate = (date) => date.toISOString().slice(0, 10);
  startDateInput.value = formatDate(start);
  endDateInput.value = formatDate(end);
}

async function onSearch(event) {
  event.preventDefault();

  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  const validation = validateDateRange(startDate, endDate);
  if (!validation.valid) {
    renderStatus(status, { type: 'error', message: validation.message });
    return;
  }

  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  renderStatus(status, { type: 'loading', message: 'Carregando eventos da DONKI-GST...' });
  setLoading(true);

  try {
    const events = await fetchGstEvents({
      startDate,
      endDate,
      signal: controller.signal,
    });

    renderStatus(status, {
      type: 'success',
      message: `${events.length} evento(s) carregado(s) com sucesso.`,
    });
    renderEvents(results, events, { range: { startDate, endDate } });
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }

    renderStatus(status, {
      type: 'error',
      message: error.message || 'Erro inesperado ao consultar DONKI-GST.',
    });

    if (!results.hasChildNodes()) {
      renderEvents(results, [], {
        range: { startDate, endDate },
        emptyMessage: 'Sem dados exibidos no momento. Tente novamente em instantes.',
      });
    }
  } finally {
    setLoading(false);
  }
}

setDefaultDates();
form.addEventListener('submit', onSearch);
form.requestSubmit();
