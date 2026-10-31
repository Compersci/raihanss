const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('#motion-toggle');
const activeEntrances = new Set();
const observed = new WeakSet();
const revealed = new WeakSet();
let paused = false;
let introduced = false;
try { paused = localStorage.getItem('motion-paused') === 'true'; } catch { /* Motion still works when browser storage is unavailable. */ }

function enabled() { return !paused && !preference.matches; }
function finishEntrances() {
  activeEntrances.forEach(animation => animation.cancel());
  activeEntrances.clear();
}
function syncMotion() {
  const running = enabled();
  root.classList.toggle('motion-enabled', running);
  root.classList.toggle('motion-paused', !running);
  root.classList.toggle('page-active', !document.hidden);
  toggle.hidden = false;
  toggle.disabled = preference.matches;
  toggle.setAttribute('aria-pressed', String(!running));
  const label = preference.matches ? 'Animasi nonaktif: perangkatmu mengaktifkan pengurangan gerakan' : running ? 'Jeda animasi' : 'Lanjutkan animasi';
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
  if (!running || document.hidden) finishEntrances();
}

function trackEntrance(animation) {
  activeEntrances.add(animation);
  animation.finished.then(() => activeEntrances.delete(animation), () => activeEntrances.delete(animation));
}

function introduceBackdrop() {
  const backdrop = document.querySelector('.glass-backdrop');
  if (!enabled() || document.hidden || document.querySelector('dialog[open]') || backdrop.getBoundingClientRect().bottom <= 0) return;
  // Keep the one-time reveal on a wrapper so it never overrides the artwork’s ambient drift.
  trackEntrance(backdrop.animate([
    { opacity: .35, transform: 'scale(1.16) translateX(2%)' },
    { opacity: 1, transform: 'scale(1) translateX(0)' }
  ], { duration: 1600, easing: 'cubic-bezier(.16,1,.3,1)' }));
  trackEntrance(document.querySelector('.glass-intro-sheen').animate([
    { opacity: 0, transform: 'translateX(-85%)', offset: 0 },
    { opacity: .65, transform: 'translateX(-25%)', offset: .35 },
    { opacity: .4, transform: 'translateX(25%)', offset: .65 },
    { opacity: 0, transform: 'translateX(85%)', offset: 1 }
  ], { duration: 1900, easing: 'ease-in-out' }));
}

function entrance(node, delay = 0, distance = 26) {
  // Animate from a temporary keyframe; content is never hidden in the base styles.
  if (!enabled() || document.hidden || document.querySelector('dialog[open]') || node.getBoundingClientRect().bottom < 0 || node.contains(document.activeElement)) return;
  const animation = node.animate([
    { opacity: 0, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 760, delay, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
  trackEntrance(animation);
}

const reveals = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    if (!revealed.has(target)) {
      revealed.add(target);
      const index = target.matches('.project') ? [...target.parentElement.children].indexOf(target) : 0;
      entrance(target, index * 90);
    }
    reveals.unobserve(target);
  });
}, { rootMargin: '0px 0px 45px 0px', threshold: 0 });

const ambient = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    target.classList.toggle('motion-in-view', isIntersecting);
    if (!isIntersecting) activeEntrances.forEach(animation => {
      if (target.contains(animation.effect.target)) animation.cancel();
    });
  });
});
document.querySelectorAll('.hero, .contact').forEach(node => ambient.observe(node));

export function refreshMotion() {
  if (!introduced) {
    introduced = true;
    ['.hero-copy > .eyebrow', 'h1', '.hero-intro', '.hero-buttons'].forEach((selector, index) => entrance(document.querySelector(selector), index * 100, 22));
    entrance(document.querySelector('.profile-card'), 280, 20);
    document.querySelectorAll('.interest-item').forEach((node, index) => entrance(node, 380 + index * 70, 14));
  }
  // render() replaces project nodes after an owner save; observe the new cards too.
  document.querySelectorAll('.section-label, .about-layout > *, .section-heading-row, .project, .contact-inner, footer').forEach(node => {
    if (observed.has(node)) return;
    observed.add(node);
    reveals.observe(node);
  });
}

toggle.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('motion-paused', String(paused)); } catch { /* Keep the current page preference without persistence. */ }
  syncMotion();
});
preference.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
document.addEventListener('focusin', event => {
  activeEntrances.forEach(animation => {
    if (animation.effect.target.contains(event.target)) animation.cancel();
  });
});
new MutationObserver(() => {
  if (document.querySelector('dialog[open]')) finishEntrances();
}).observe(document.querySelector('#editor-dialog'), { attributes: true, attributeFilter: ['open'] });
syncMotion();
introduceBackdrop();
