import { refreshMotion } from './motion.js';

const $ = (selector) => document.querySelector(selector);
let content;
let toastTimer;
const icons = [
  '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
  '<path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8"/>',
  '<rect x="5" y="5" width="14" height="14" rx="4"/><path d="m9 12 2 2 4-4"/>'
];
function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
function safeUrl(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
function externalLink(link, href) {
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}
function render() {
  document.querySelectorAll('[data-content]').forEach(node => { node.textContent = content[node.dataset.content]; });
  document.title = `${content.name} — ${content.role || 'Ruang pribadi saya'}`;
  $('meta[name="description"]').content = content.intro;
  $('#initial').textContent = Array.from(content.name)[0] || 'R';
  $('#interest-strip').replaceChildren(...content.interests.map((interest, index) => {
    const item = element('div', 'interest-item');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = icons[index]; // Only fixed, local SVG strings; never owner content.
    item.append(icon, element('span', '', interest), element('span', 'interest-index', `0${index + 1}`));
    return item;
  }));
  $('#project-grid').replaceChildren(...content.projects.map((project, index) => {
    const article = element('article', 'project');
    const url = safeUrl(project.url);
    const visual = element(url ? 'a' : 'div', `project-visual ${project.style}`);
    if (url) {
      externalLink(visual, url);
      visual.setAttribute('aria-label', `Lihat ${project.title} (dibuka di tab baru)`);
    } else visual.setAttribute('aria-hidden', 'true');
    visual.append(element('span', 'project-num', `EKSPLORASI / 0${index + 1}`), element('span', 'art-shape'));
    if (url) { const arrow = element('span', 'project-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); visual.append(arrow); }
    article.append(visual, element('p', 'project-category', project.category), element('h3', '', project.title), element('p', 'project-description', project.description));
    return article;
  }));
  $('#sample-note').hidden = !content.projects.some(project => /contoh proyek|sample project/i.test(project.category));
  $('#email-link').href = content.email ? `mailto:${content.email}` : '#contact';
  $('#email-link').setAttribute('aria-label', content.email ? `Kirim email ke ${content.name} di ${content.email}` : 'Periksa ketersediaan kontak');
  $('#contact-hint').hidden = true;
  const social = $('#social-link');
  const socialUrl = safeUrl(content.socialUrl);
  social.hidden = !socialUrl;
  if (socialUrl) { externalLink(social, socialUrl); social.textContent = `${content.socialLabel || 'Temukan saya di sini'} ↗`; }
  refreshMotion();
}
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
  return data;
}
$('#year').textContent = new Date().getFullYear();
function updateClock() { $('#clock').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' LOKAL'; }
updateClock();
setInterval(updateClock, 60_000);
$('#menu-button').addEventListener('click', () => {
  const open = $('#mobile-nav').hidden;
  $('#mobile-nav').hidden = !open;
  $('#menu-button').setAttribute('aria-expanded', String(open));
  $('#menu-button').setAttribute('aria-label', open ? 'Tutup navigasi' : 'Buka navigasi');
});
function closeMenu() {
  $('#mobile-nav').hidden = true;
  $('#menu-button').setAttribute('aria-expanded', 'false');
  $('#menu-button').setAttribute('aria-label', 'Buka navigasi');
}
$('#mobile-nav').addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#mobile-nav').hidden) { closeMenu(); $('#menu-button').focus(); } });
$('#email-link').addEventListener('click', event => {
  if (!content?.email) { event.preventDefault(); $('#contact-hint').hidden = false; }
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) document.querySelectorAll('.nav a').forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -50% 0px' });
['home', 'about', 'work', 'contact'].forEach(id => observer.observe(document.getElementById(id)));

const fields = [
  ['name', 'Nama kamu', 'text', 50], ['role', 'Profesi atau kegiatanmu', 'text', 120],
  ['headline', 'Judul utama (tekan Enter untuk baris baru)', 'textarea', 140],
  ['intro', 'Perkenalan singkat', 'textarea', 600], ['location', 'Lokasi', 'text', 120],
  ['availability', 'Ketersediaan', 'text', 120], ['email', 'Email kontak (opsional)', 'email', 254],
  ['socialUrl', 'Tautan media sosial / situs (opsional)', 'url', 500], ['socialLabel', 'Label tautan media sosial', 'text', 60],
  ['aboutTitle', 'Judul bagian tentang saya', 'textarea', 180], ['about', 'Ceritamu', 'textarea', 4000],
  ['currently', 'Kegiatanmu saat ini', 'text', 180]
];
function addField(parent, key, title, type, value, maxLength) {
  const id = `field-${key}`;
  const label = element('label', '', title);
  label.htmlFor = id;
  const input = element(type === 'textarea' ? 'textarea' : 'input');
  input.id = id;
  input.name = key;
  if (type !== 'textarea') input.type = type;
  if (type === 'url') input.placeholder = 'https://…';
  if (maxLength) input.maxLength = maxLength;
  input.value = value;
  if (['name', 'headline', 'intro', 'aboutTitle'].includes(key) || key.startsWith('interest-') || key.endsWith('-title')) input.required = true;
  parent.append(label, input);
}
function buildEditor() {
  const container = $('#editor-fields');
  container.replaceChildren();
  fields.forEach(([key, title, type, maxLength]) => addField(container, key, title, type, content[key], maxLength));
  const interests = element('fieldset');
  interests.append(element('legend', '', 'Empat minatmu'));
  content.interests.forEach((value, index) => addField(interests, `interest-${index}`, `Minat ${index + 1}`, 'text', value, 80));
  container.append(interests);
  content.projects.forEach((project, index) => {
    const group = element('fieldset');
    group.append(element('legend', '', `Proyek ${index + 1}`));
    [['title', 'Judul', 'text', 120], ['category', 'Kategori', 'text', 120], ['description', 'Deskripsi', 'textarea', 1000], ['url', 'Tautan proyek (opsional)', 'url', 500]].forEach(([key, title, type, maxLength]) => addField(group, `project-${index}-${key}`, title, type, project[key], maxLength));
    const label = element('label', '', 'Warna ilustrasi');
    label.htmlFor = `project-${index}-style`;
    const select = element('select');
    select.id = label.htmlFor;
    select.name = `project-${index}-style`;
    ['coral', 'blue', 'green'].forEach(style => {
      const option = element('option', '', { coral: 'Merah koral', blue: 'Biru', green: 'Hijau' }[style]);
      option.value = style;
      select.append(option);
    });
    select.value = project.style;
    group.append(label, select);
    container.append(group);
  });
}
function showEditor(authenticated) {
  $('#login-form').hidden = authenticated;
  $('#editor-form').hidden = !authenticated;
  if (authenticated) buildEditor();
}
$('#edit-button').addEventListener('click', async () => {
  if (!content) return notify('Profilmu belum dimuat. Muat ulang halaman untuk mencoba lagi.');
  $('#login-error').textContent = '';
  $('#save-error').textContent = '';
  $('#password').value = '';
  try {
    const session = await api('/api/session');
    showEditor(session.authenticated);
    $('#editor-dialog').showModal();
    if (session.authenticated) $('#close-editor').focus(); else $('#password').focus();
  } catch (error) { notify(error.message); }
});
function closeEditor() {
  if ($('#save-button').disabled) return;
  if (!$('#editor-form').hidden && JSON.stringify(readEditor()) !== JSON.stringify(content) && !confirm('Buang perubahan yang belum disimpan?')) return;
  $('#editor-dialog').close();
}
$('#close-editor').addEventListener('click', closeEditor);
$('#editor-dialog').addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#login-form button');
  button.disabled = true;
  $('#login-error').textContent = '';
  try {
    await api('/api/login', { method: 'POST', body: JSON.stringify({ password: $('#password').value }) });
    $('#password').value = '';
    showEditor(true);
    $('#editor-dialog').scrollTop = 0;
    $('#field-name').focus();
  } catch (error) { $('#login-error').textContent = error.message; }
  finally { button.disabled = false; }
});
function readEditor() {
  const form = new FormData($('#editor-form'));
  const next = {};
  fields.forEach(([key]) => { next[key] = form.get(key); });
  next.interests = content.interests.map((_, index) => form.get(`interest-${index}`));
  next.projects = content.projects.map((_, index) => Object.fromEntries(['title', 'category', 'description', 'url', 'style'].map(key => [key, form.get(`project-${index}-${key}`)])));
  return next;
}
$('#editor-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#save-button');
  button.disabled = true;
  button.textContent = 'Menyimpan…';
  $('#save-error').textContent = '';
  try {
    content = await api('/api/content', { method: 'PUT', body: JSON.stringify(readEditor()) });
    render();
    $('#editor-dialog').close();
    notify('Perubahanmu sudah tersimpan dan tampil di situs.');
  } catch (error) { $('#save-error').textContent = error.message; $('#save-error').scrollIntoView({ block: 'nearest' }); }
  finally { button.disabled = false; button.textContent = 'Simpan perubahan ↗'; }
});
$('#logout').addEventListener('click', async () => {
  if (JSON.stringify(readEditor()) !== JSON.stringify(content) && !confirm('Keluar dan buang perubahan yang belum disimpan?')) return;
  try { await api('/api/logout', { method: 'POST', body: '{}' }); showEditor(false); $('#password').focus(); notify('Kamu sudah keluar.'); }
  catch (error) { $('#save-error').textContent = error.message; }
});
window.addEventListener('beforeunload', event => {
  if ($('#editor-dialog').open && !$('#editor-form').hidden && JSON.stringify(readEditor()) !== JSON.stringify(content)) event.preventDefault();
});
try { content = await api('/api/content'); render(); }
catch { notify('Profilmu tidak dapat dimuat. Pastikan server lokal berjalan, lalu muat ulang halaman.'); }
