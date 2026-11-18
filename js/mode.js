// Light / Dark buttons. js/boot.js re-applies the saved choice before first paint on every page.

import { icon } from './icons.js';

const STORAGE_KEY = 'portfolio-mode';

function applyMode(mode) {
  const root = document.documentElement;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-transition');
    setTimeout(() => root.classList.remove('theme-transition'), 400);
  }
  if (mode === 'dark') root.setAttribute('data-mode', 'dark');
  else root.removeAttribute('data-mode');
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch { /* storage unavailable: the choice lasts until reload */ }
}

const currentMode = () => (document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light');

export function initModeButtons() {
  const choices = [...document.querySelectorAll('[data-mode-choice]')];
  const toggles = [...document.querySelectorAll('[data-mode-toggle]')]; // the phone's top bar

  const show = () => {
    const current = currentMode();
    choices.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeChoice === current)));
    toggles.forEach((b) => {
      b.innerHTML = icon(current === 'dark' ? 'sun' : 'moon');
      b.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  };

  const choose = (mode) => {
    applyMode(mode);
    show();
  };
  choices.forEach((b) => b.addEventListener('click', () => choose(b.dataset.modeChoice)));
  toggles.forEach((b) => b.addEventListener('click', () => choose(currentMode() === 'dark' ? 'light' : 'dark')));
  show();
}
