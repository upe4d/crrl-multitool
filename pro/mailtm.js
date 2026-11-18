/* Альтернативная временная почта: создаёт ящик и читает входящие через Mail.tm API. */
(() => {
  'use strict';
  const api = './mailtm-proxy.php';
  const create = document.getElementById('mailtm-create');
  const refresh = document.getElementById('mailtm-refresh');
  const address = document.getElementById('mailtm-address');
  const messages = document.getElementById('mailtm-messages');
  const status = document.getElementById('mailtm-status');
  const count = document.getElementById('mailtm-count');
  const reader = document.getElementById('mailtm-reader');
  const readerSubject = document.getElementById('mailtm-reader-subject');
  const readerMeta = document.getElementById('mailtm-reader-meta');
  const readerBody = document.getElementById('mailtm-reader-body');
  const download = document.getElementById('mailtm-download');
  if (!create) return;
  let token = '', email = '', openedMessage = null, refreshTimer = null;

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${api}?path=${encodeURIComponent(path)}`, { ...options, headers });
    if (!response.ok) throw new Error(`Mail.tm: HTTP ${response.status}`);
    return response.json();
  }

  function render(items) {
    messages.replaceChildren();
    count.textContent = `${items.length} ${items.length === 1 ? 'письмо' : 'писем'}`;
    if (!items.length) {
      messages.innerHTML = '<p class="mailtm-empty">Пока писем нет. Нажмите «Обновить входящие» после отправки письма.</p>';
      return;
    }
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mailtm-message';
      button.innerHTML = `<span class="mailtm-message-icon">✉</span><span class="mailtm-message-copy"><strong>${item.subject || '(без темы)'}</strong><span>${item.from?.address || 'Неизвестный отправитель'} · ${item.intro || 'Открыть письмо'}</span></span><span class="mailtm-message-date">${item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : ''}</span>`;
      button.addEventListener('click', async () => {
        document.querySelectorAll('.mailtm-message').forEach((node) => node.classList.remove('active'));
        button.classList.add('active');
        reader.hidden = false;
        readerSubject.textContent = 'Загружаем письмо…';
        readerMeta.textContent = '';
        readerBody.textContent = '';
        try {
          const full = await request(`/messages/${encodeURIComponent(item.id)}`);
          openedMessage = full;
          readerSubject.textContent = full.subject || '(без темы)';
          readerMeta.textContent = `${full.from?.address || 'Неизвестный отправитель'} · ${full.createdAt ? new Date(full.createdAt).toLocaleString('ru-RU') : ''}`;
          readerBody.textContent = full.text || 'Текст письма недоступен.';
          download.disabled = false;
        } catch (error) { status.textContent = `Не удалось открыть письмо: ${error.message}`; }
      });
      messages.append(button);
    });
  }

  async function loadMessages() {
    if (!token) return;
    const data = await request('/messages?page=1');
    const items = Array.isArray(data) ? data : (data['hydra:member'] || []);
    render(items);
    status.textContent = `Адрес готов: ${email} · писем: ${items.length}`;
  }

  create.addEventListener('click', async () => {
    create.disabled = true; refresh.disabled = true; status.textContent = 'Создаём временный ящик…';
    try {
      const domains = await request('/domains?page=1');
      const domainList = Array.isArray(domains) ? domains : (domains['hydra:member'] || []);
      const domain = domainList.find((item) => item.isActive);
      if (!domain) throw new Error('Mail.tm не вернул активный домен');
      const local = `mt${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      email = `${local}@${domain.domain}`;
      const password = `${crypto.randomUUID()}Aa1!`;
      await request('/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: email, password }) });
      const auth = await request('/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: email, password }) });
      token = auth.token;
      address.textContent = email;
      refresh.disabled = false;
      await loadMessages();
      clearInterval(refreshTimer);
      refreshTimer = setInterval(() => loadMessages().catch(() => {}), 30000);
    } catch (error) {
      status.textContent = `Не удалось создать ящик: ${error.message}`;
      create.disabled = false;
    }
  });

  refresh.addEventListener('click', async () => {
    refresh.disabled = true;
    refresh.classList.add('is-loading');
    try { await loadMessages(); } catch (error) { status.textContent = `Не удалось обновить входящие: ${error.message}`; }
    refresh.classList.remove('is-loading');
    refresh.disabled = false;
  });

  download.addEventListener('click', () => {
    if (!openedMessage) return;
    const text = `Тема: ${openedMessage.subject || '(без темы)'}\nОт: ${openedMessage.from?.address || ''}\nДата: ${openedMessage.createdAt || ''}\n\n${openedMessage.text || ''}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    link.download = 'mailtm-letter.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  });
})();
