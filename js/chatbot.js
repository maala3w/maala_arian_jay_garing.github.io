// Visitor chat window. Answers are quoted from portfolio.json in the browser (see
// chatbot-knowledge.js). Everything is inserted as text, so an answer can never add markup.

import { buildFacts, answerFromFacts } from './chatbot-knowledge.js';
import { icon } from './icons.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initChatbot(portfolio) {
  const { welcomeMessage, suggestedQuestions = [] } = portfolio.chatbot;
  const facts = buildFacts(portfolio);
  const owner = { name: portfolio.profile?.fullName, email: portfolio.profile?.email };

  const launcher = el('button', 'chat-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'chat-panel');
  launcher.setAttribute('aria-label', 'Ask about my qualifications');
  launcher.innerHTML = icon('message-circle');

  const panel = el('section', 'chat-panel paper');
  panel.id = 'chat-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Portfolio assistant');

  const head = el('header', 'chat-panel__head');
  const title = el('div');
  title.append(el('p', 'chat-panel__title', 'Portfolio assistant'), el('p', 'chat-panel__sub', 'Answers are quoted directly from this portfolio'));
  const close = el('button', 'icon-btn chat-panel__close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close assistant');
  close.innerHTML = icon('x');
  head.append(title, close);

  const log = el('div', 'chat-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  const suggestions = el('div', 'chat-suggestions');
  suggestedQuestions.forEach((q) => {
    const button = el('button', 'chat-suggestion', q);
    button.type = 'button';
    button.addEventListener('click', () => send(q));
    suggestions.append(button);
  });

  const form = el('form', 'chat-form');
  const label = el('label', 'visually-hidden', 'Your question');
  label.htmlFor = 'chat-input';
  const input = el('input');
  input.id = 'chat-input';
  input.type = 'text';
  input.maxLength = 500;
  input.autocomplete = 'off';
  input.placeholder = 'Ask a question…';
  const submit = el('button', 'btn btn--primary chat-form__send');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Send question');
  submit.innerHTML = icon('send');
  form.append(label, input, submit);

  panel.append(head, log, suggestions, form);
  document.body.append(launcher, panel);

  function addMessage(role, text) {
    log.append(el('p', `chat-message chat-message--${role}`, text));
    log.scrollTop = log.scrollHeight;
  }

  addMessage('assistant', welcomeMessage);

  function send(raw) {
    const question = raw.trim();
    if (!question) return;
    suggestions.hidden = true;
    input.value = '';
    addMessage('user', question);
    addMessage('assistant', answerFromFacts(question, facts, owner));
    input.focus();
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
    else launcher.focus();
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send(input.value);
  });
}
