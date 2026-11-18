// Contact form: checks the fields, then opens the visitor's email app with the message filled in.
// A static site has nowhere to store messages, so nothing is saved or sent by the site itself.

import { icon } from './icons.js';
import { esc } from './utils.js';

const LIMITS = {
  fullName: { min: 2 },
  subject: { min: 3 },
  message: { min: 20, max: 2000 },
};
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const NAME_RE = /^[\p{L}\p{M}' .,-]+$/u;
const FIELDS = ['fullName', 'email', 'subject', 'message'];

function validate(values) {
  const errors = {};
  const name = values.fullName.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (!name) errors.fullName = 'Please enter your full name.';
  else if (name.length < LIMITS.fullName.min) errors.fullName = `Name must be at least ${LIMITS.fullName.min} characters.`;
  else if (!NAME_RE.test(name)) errors.fullName = 'Name may only contain letters, spaces, apostrophes, periods, and hyphens.';

  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address, like name@example.com.';

  if (!subject) errors.subject = 'Please enter a subject.';
  else if (subject.length < LIMITS.subject.min) errors.subject = `Subject must be at least ${LIMITS.subject.min} characters.`;

  if (!message) errors.message = 'Please enter a message.';
  else if (message.length < LIMITS.message.min) errors.message = `Please write at least ${LIMITS.message.min} characters so I can understand your message.`;
  else if (message.length > LIMITS.message.max) errors.message = `Please keep your message under ${LIMITS.message.max} characters.`;
  return errors;
}

export function initContactForm({ email = '' } = {}) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const counter = form.querySelector('[data-char-count]');
  const message = form.elements.message;
  const touched = new Set();

  function setError(name, text) {
    const input = form.elements[name];
    const field = input?.closest('.field');
    const out = field?.querySelector('.field__error');
    if (!out) return;
    out.textContent = text || '';
    field.classList.toggle('has-error', Boolean(text));
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
  }

  function showStatus(kind, html) {
    status.hidden = false;
    status.className = `form-status form-status--${kind}`;
    status.innerHTML = html;
  }

  const read = () => Object.fromEntries(FIELDS.map((name) => [name, form.elements[name].value]));

  function updateCounter() {
    const length = message.value.trim().length;
    counter.textContent = String(length);
    counter.parentElement.classList.toggle('is-over', length > LIMITS.message.max);
  }

  message.addEventListener('input', updateCounter);

  // Validate a field after the visitor leaves it, then live while they correct it.
  form.addEventListener('focusout', (event) => {
    const { name } = event.target;
    if (!FIELDS.includes(name)) return;
    touched.add(name);
    setError(name, validate(read())[name]);
  });
  form.addEventListener('input', (event) => {
    const { name } = event.target;
    if (touched.has(name)) setError(name, validate(read())[name]);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = read();
    const errors = validate(values);
    FIELDS.forEach((name) => { touched.add(name); setError(name, errors[name]); });
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      showStatus('error', `${icon('alert-circle')}<span>Please correct the highlighted fields and try again.</span>`);
      form.elements[firstInvalid].focus();
      return;
    }

    const body = `${values.message.trim()}\n\n${values.fullName.trim()}\n${values.email.trim()}`;
    showStatus('info', `${icon('info')}<span>Your email app should open with this message ready to send. If it doesn't, please email me directly at <a href="mailto:${esc(email)}">${esc(email)}</a>.</span>`);
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(values.subject.trim())}&body=${encodeURIComponent(body)}`;
  });

  updateCounter();
}
