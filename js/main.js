// Entry point for index.html: loads content from data/portfolio.json and wires up each section.

import { getPortfolio } from './api.js';
import { hydrateIcons } from './icons.js';
import { initNavigation } from './navigation.js';
import { initSystems } from './systems.js';
import { initContactForm } from './contact.js';
import { initVisionFlow } from './vision.js';
import { initThemePicker } from './theme.js';
import { initResearch } from './research.js';
import { initModeButtons } from './mode.js';
import { renderDocuments } from './documents.js';
import { initDepth } from './depth.js';
import { initChatbot } from './chatbot.js';
import { initSidebarToggle } from './sidebar.js';
import * as render from './render.js';

function initReveal() {
  const items = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => observer.observe(el));
}

function showLoadError() {
  document.querySelectorAll('[data-list], [data-project-grid]').forEach((el) => {
    if (!el.children.length) {
      el.innerHTML = '<li class="empty-state">This section could not be loaded right now. Please refresh the page to try again.</li>';
    }
  });
}

async function init() {
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  initThemePicker();
  initModeButtons();
  hydrateIcons();

  let result = null;
  try {
    result = await getPortfolio();
  } catch (err) {
    console.error('[portfolio] Content could not be loaded:', err);
    showLoadError();
  }

  initNavigation();
  initSidebarToggle();

  if (result) {
    const { data } = result;
    render.renderProfile(data.profile);
    render.renderHeroId(data.intro, data.profile);
    render.renderSocials(data.socialLinks);
    render.renderIdentityCards(data.identityCards);
    render.renderLanguages(data.languages);
    render.renderEducation(data.education);
    render.renderSkills(data.skillCategories);
    render.renderExperience(data.experiences);
    render.renderLeadership(data.experiences);
    render.renderAchievements(data.achievements);
    render.renderTrainings(data.trainings);
    render.renderVision(data.visionSteps, data.careerPrinciples);
    initResearch(data.researchPapers);
    initSystems(data.systems);
    initVisionFlow();
    if (data.chatbot?.enabled) initChatbot(data);
    renderDocuments(data);
  }

  initContactForm({
    email: result?.data?.profile?.email || 'arianmaala19@gmail.com',
  });
  hydrateIcons();
  initReveal();
  initDepth();
}

// Tell the intro (js/loading.js) the page is usable — on success, fallback, or error alike,
// so the loading screen can never get stuck.
window.__portfolioBooted = true;

init().catch((err) => {
  // Unexpected content must not leave the page hidden: show what is there and flag the rest.
  console.error('[portfolio] Page setup failed:', err);
  showLoadError();
  initReveal();
}).finally(() => {
  window.__portfolioReady = true;
  document.dispatchEvent(new Event('portfolio:ready'));
});
