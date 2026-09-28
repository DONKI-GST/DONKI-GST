const NOT_INFORMED = 'Não informado';
const EVENT_FIELDS = new Set(['gstID', 'startTime', 'endTime', 'allKpIndex', 'link']);

function formatDateTime(value) {
  if (!value) {
    return NOT_INFORMED;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

  return `${formatter.format(date)} UTC`;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return NOT_INFORMED;
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return NOT_INFORMED;
    }

    if (value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return value.map(String).join(', ');
    }

    return JSON.stringify(value);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatFieldName(field) {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function getKpEntries(allKpIndex) {
  if (!Array.isArray(allKpIndex)) {
    return [];
  }

  return allKpIndex
    .map((item) => ({
      kp: Number(item?.kpIndex),
      observedAt: item?.observedTime,
      source: item?.source,
    }))
    .filter((item) => Number.isFinite(item.kp));
}

function getMaxKp(event) {
  const values = getKpEntries(event?.allKpIndex).map((item) => item.kp);
  return values.length ? Math.max(...values) : null;
}

function createDetailsRow(label, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';

  const term = document.createElement('dt');
  term.textContent = label;

  const description = document.createElement('dd');
  description.textContent = value;

  row.append(term, description);
  return row;
}

function createSummary(container, events, range = {}) {
  const summary = document.createElement('section');
  summary.className = 'query-summary';
  summary.setAttribute('aria-label', 'Resumo da consulta');

  const heading = document.createElement('h3');
  heading.textContent = 'Resumo da consulta';

  const metrics = document.createElement('dl');
  metrics.className = 'summary-metrics';

  const strongestKp = events.reduce((max, event) => {
    const eventMax = getMaxKp(event);
    if (eventMax === null) {
      return max;
    }

    return Math.max(max, eventMax);
  }, -Infinity);

  const strongestKpText = Number.isFinite(strongestKp) ? strongestKp.toFixed(1) : NOT_INFORMED;

  metrics.append(
    createDetailsRow('Período inicial', formatDateTime(range.startDate)),
    createDetailsRow('Período final', formatDateTime(range.endDate)),
    createDetailsRow('Total de eventos', String(events.length)),
    createDetailsRow('Maior índice Kp', strongestKpText),
  );

  summary.append(heading, metrics);
  container.appendChild(summary);
}

function createSourceElement(link) {
  if (!link) {
    const missingSource = document.createElement('span');
    missingSource.textContent = NOT_INFORMED;
    return missingSource;
  }

  try {
    const normalizedUrl = new URL(link).toString();
    const anchor = document.createElement('a');
    anchor.href = normalizedUrl;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.textContent = 'Abrir fonte oficial';
    return anchor;
  } catch {
    const invalidSource = document.createElement('span');
    invalidSource.textContent = String(link);
    return invalidSource;
  }
}

function createKpTimeline(event) {
  const wrapper = document.createElement('section');
  wrapper.className = 'kp-section';

  const title = document.createElement('h4');
  title.textContent = 'Evolução dos índices Kp';
  wrapper.appendChild(title);

  const kpEntries = getKpEntries(event?.allKpIndex);

  if (!kpEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'event-note';
    empty.textContent = 'Não informado';
    wrapper.appendChild(empty);
    return wrapper;
  }

  const timeline = document.createElement('ul');
  timeline.className = 'kp-list';

  kpEntries.forEach((entry) => {
    const line = document.createElement('li');

    const kpValue = document.createElement('strong');
    kpValue.textContent = `Kp ${entry.kp.toFixed(1)}`;

    const observation = document.createElement('span');
    const sourceText = entry.source ? ` • Fonte ${entry.source}` : '';
    observation.textContent = `${formatDateTime(entry.observedAt)}${sourceText}`;

    line.append(kpValue, observation);
    timeline.appendChild(line);
  });

  wrapper.appendChild(timeline);
  return wrapper;
}

function createAdditionalDetails(event) {
  const extraFields = Object.entries(event).filter(([key]) => !EVENT_FIELDS.has(key));

  if (!extraFields.length) {
    return null;
  }

  const wrapper = document.createElement('section');
  wrapper.className = 'extra-details';

  const title = document.createElement('h4');
  title.textContent = 'Detalhes adicionais';

  const list = document.createElement('ul');

  extraFields.forEach(([key, value]) => {
    const item = document.createElement('li');

    const label = document.createElement('span');
    label.className = 'extra-label';
    label.textContent = `${formatFieldName(key)}:`;

    const content = document.createElement('span');
    content.className = 'extra-value';
    content.textContent = formatValue(value);

    item.append(label, content);
    list.appendChild(item);
  });

  wrapper.append(title, list);
  return wrapper;
}

function createEventCard(event) {
  const article = document.createElement('article');
  article.className = 'event-card';

  const header = document.createElement('header');
  header.className = 'event-header';

  const heading = document.createElement('h3');
  heading.textContent = event.gstID || NOT_INFORMED;

  const kpBadge = document.createElement('p');
  kpBadge.className = 'kp-badge';
  const maxKp = getMaxKp(event);
  kpBadge.textContent = `Kp máx: ${maxKp === null ? NOT_INFORMED : maxKp.toFixed(1)}`;

  header.append(heading, kpBadge);

  const details = document.createElement('dl');
  details.className = 'event-metadata';

  details.append(
    createDetailsRow('Identificador GST', event.gstID || NOT_INFORMED),
    createDetailsRow('Início', formatDateTime(event.startTime)),
    createDetailsRow('Fim', formatDateTime(event.endTime)),
  );

  const sourceRow = document.createElement('div');
  sourceRow.className = 'source-row';

  const sourceLabel = document.createElement('span');
  sourceLabel.className = 'source-label';
  sourceLabel.textContent = 'Fonte:';

  sourceRow.append(sourceLabel, createSourceElement(event.link));

  article.append(header, details, sourceRow, createKpTimeline(event));

  const additional = createAdditionalDetails(event);
  if (additional) {
    article.appendChild(additional);
  }

  return article;
}

export function renderEvents(container, events, options = {}) {
  const eventList = Array.isArray(events) ? events : [];
  container.textContent = '';
  createSummary(container, eventList, options.range || {});

  if (!eventList.length) {
    const message = document.createElement('p');
    message.className = 'empty-state';
    message.textContent =
      options.emptyMessage || 'Nenhum evento GST encontrado para o período informado.';
    container.appendChild(message);
    return;
  }

  const list = document.createElement('div');
  list.className = 'events-grid';

  eventList.forEach((event) => {
    list.appendChild(createEventCard(event));
  });

  container.appendChild(list);
}

export function renderStatus(element, { type, message }) {
  element.className = type ? `status status--${type}` : 'status';
  element.textContent = message || '';
  element.setAttribute('role', type === 'error' ? 'alert' : 'status');
  element.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
}
