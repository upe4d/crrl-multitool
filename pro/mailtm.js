/* Альтернативная временная почта: создаёт ящик и читает входящие через Mail.tm API. */
(() => {
  'use strict';
  const api = 'https://api.mail.tm';
  const create = document.getElementById('mailtm-create');
  const refresh = document.getElementById('mailtm-refresh');
  const address = document.getElementById('mailtm-address');
  const messages = document.getElementById('mailtm-messages');
  const status = document.getElementById('mailtm-status');
  if (!create) return;
  let token = '', email = '';

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(api + path, { ...options, headers });
    if (!response.ok) throw new Error(`Mail.tm: HTTP ${response.status}`);
    return response.json();
  }

  function render(items) {
    messages.replaceChildren();
    if (!items.length) {
      messages.innerHTML = '<p class="mailtm-empty">Пока писем нет. Нажмите «Обновить входящие» после отправки письма.</p>';
      return;
    }
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mailtm-message';
      button.innerHTML = `<strong>${item.subject || '(без темы)'}</strong><span>${item.from?.address || 'Неизвестный отправитель'}</span>`;
      button.addEventListener('click', async () => {
        try {
          const full = await request(`/messages/${encodeURIComponent(item.id)}`);
          const body = full.text || full.html?.[0] || 'Текст письма недоступен.';
          alert(`${full.subject || '(без темы)'}\n\n${body}`);
        } catch (error) { status.textContent = `Не удалось открыть письмо: ${error.message}`; }
      });
      messages.append(button);
    });
  }

  async function loadMessages() {
    if (!token) return;
    const data = await request('/messages?page=1');
    render(data['hydra:member'] || []);
    status.textContent = `Адрес готов: ${email} · писем: ${(data['hydra:member'] || []).length}`;
  }

  create.addEventListener('click', async () => {
    create.disabled = true; refresh.disabled = true; status.textContent = 'Создаём временный ящик…';
    try {
      const domains = await request('/domains?page=1');
      const domain = domains['hydra:member']?.find((item) => item.isActive);
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
    } catch (error) {
      status.textContent = `Не удалось создать ящик: ${error.message}`;
      create.disabled = false;
    }
  });

  refresh.addEventListener('click', async () => {
    refresh.disabled = true;
    try { await loadMessages(); } catch (error) { status.textContent = `Не удалось обновить входящие: ${error.message}`; }
    refresh.disabled = false;
  });
})();
