function createEventCard(event) {
  const article = document.createElement('article');
  article.className = 'event-card';

  const heading = document.createElement('h2');
  heading.textContent = event.gstID || 'Evento sem identificador';

  const details = document.createElement('ul');

  const start = document.createElement('li');
  start.textContent = `Início: ${event.startTime || '-'}`;
  details.appendChild(start);

  const kp = document.createElement('li');
  kp.textContent = `Kp: ${event.allKpIndex?.[0]?.kpIndex ?? '-'}`;
  details.appendChild(kp);

  const source = document.createElement('li');
  source.textContent = `Fonte: ${event.link || 'não informada'}`;
  details.appendChild(source);

  article.append(heading, details);
  return article;
}

export function renderEvents(container, events) {
  container.textContent = '';

  if (!events.length) {
    const message = document.createElement('p');
    message.className = 'empty';
    message.textContent = 'Nenhum evento GST encontrado para o período informado.';
    container.appendChild(message);
    return;
  }

  events.forEach((event) => {
    container.appendChild(createEventCard(event));
  });
}

export function renderStatus(element, { type, message }) {
  element.className = type || '';
  element.textContent = message || '';
}
