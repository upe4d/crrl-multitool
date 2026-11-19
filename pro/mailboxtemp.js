/* Клиент MailboxTemp: новый ящик или поиск входящих по известному адресу. */
(() => {
  'use strict';
  const api = 'https://mailboxtemp.com';
  const create = document.getElementById('mbt-create');
  const open = document.getElementById('mbt-open');
  const addressInput = document.getElementById('mbt-address');
  const current = document.getElementById('mbt-current');
  const expiry = document.getElementById('mbt-expiry');
  const refresh = document.getElementById('mbt-refresh');
  const status = document.getElementById('mbt-status');
  const count = document.getElementById('mbt-count');
  const messages = document.getElementById('mbt-messages');
  const reader = document.getElementById('mbt-reader');
  const subject = document.getElementById('mbt-reader-subject');
  const meta = document.getElementById('mbt-reader-meta');
  const body = document.getElementById('mbt-reader-body');
  const download = document.getElementById('mbt-download');
  if (!create) return;
  let mailbox = '', opened = null, timer = null;

  async function request(path, options = {}) {
    const response = await fetch(api + path, { ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function formatTtl(seconds) {
    if (!Number.isFinite(seconds)) return 'Срок действия неизвестен';
    const minutes = Math.max(0, Math.floor(seconds / 60));
    return minutes >= 60 ? `Осталось около ${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : `Осталось около ${minutes} мин`;
  }

  async function loadInbox() {
    if (!mailbox) return;
    const data = await request(`/api/inbox/${encodeURIComponent(mailbox)}/emails`);
    const items = data.emails || [];
    count.textContent = `${items.length} ${items.length === 1 ? 'письмо' : 'писем'}`;
    messages.replaceChildren();
    if (!items.length) { messages.innerHTML = '<p class="mailtm-empty">Писем пока нет. Оставьте ящик открытым и обновите позже.</p>'; return; }
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'mailtm-message';
      button.innerHTML = `<span class="mailtm-message-icon">✉</span><span class="mailtm-message-copy"><strong>${item.subject || '(без темы)'}</strong><span>${item.from_address || 'Неизвестный отправитель'}${item.otp_code ? ` · код ${item.otp_code}` : ''}</span></span><span class="mailtm-message-date">${item.received_at ? new Date(item.received_at).toLocaleString('ru-RU') : ''}</span>`;
      button.addEventListener('click', async () => {
        document.querySelectorAll('#mbt-messages .mailtm-message').forEach((node) => node.classList.remove('active'));
        button.classList.add('active'); reader.hidden = false; subject.textContent = 'Загружаем письмо…'; body.textContent = ''; download.disabled = true;
        try {
          const data = await request(`/api/email/${encodeURIComponent(mailbox)}/${encodeURIComponent(item.id)}`);
          opened = data.email; subject.textContent = opened.subject || '(без темы)'; meta.textContent = `${opened.from_address || ''} · ${opened.received_at ? new Date(opened.received_at).toLocaleString('ru-RU') : ''}`; body.textContent = opened.body_text || 'Текст письма недоступен.'; download.disabled = false;
        } catch (error) { status.textContent = `Не удалось открыть письмо: ${error.message}`; }
      });
      messages.append(button);
    });
  }

  async function openMailbox(address) {
    const value = address.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Введите полный адрес почты');
    const data = await request(`/api/inbox/${encodeURIComponent(value)}`);
    mailbox = value; current.textContent = value; expiry.textContent = formatTtl(Number(data.ttl)); refresh.disabled = false; status.textContent = 'Ящик подключён. Входящие обновляются автоматически.'; await loadInbox();
    clearInterval(timer); timer = setInterval(() => loadInbox().catch(() => {}), 15000);
  }

  create.addEventListener('click', async () => {
    create.disabled = true; status.textContent = 'Создаём новый ящик…';
    try { const data = await request('/api/inbox/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); addressInput.value = data.address; await openMailbox(data.address); }
    catch (error) { status.textContent = `Не удалось создать ящик: ${error.message}`; }
    create.disabled = false;
  });
  open.addEventListener('click', async () => { open.disabled = true; status.textContent = 'Проверяем адрес…'; try { await openMailbox(addressInput.value); } catch (error) { status.textContent = `Не удалось открыть ящик: ${error.message}`; } open.disabled = false; });
  refresh.addEventListener('click', async () => { refresh.disabled = true; refresh.classList.add('is-loading'); try { await loadInbox(); } catch (error) { status.textContent = `Не удалось обновить входящие: ${error.message}`; } refresh.classList.remove('is-loading'); refresh.disabled = false; });
  download.addEventListener('click', () => { if (!opened) return; const text = `Тема: ${opened.subject || '(без темы)'}\nОт: ${opened.from_address || ''}\nДата: ${opened.received_at || ''}\n\n${opened.body_text || ''}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); link.download = 'mailboxtemp-letter.txt'; link.click(); URL.revokeObjectURL(link.href); });
})();
