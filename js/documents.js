// Résumé & CV section: view-only. Each document is shown as page images in an in-page viewer,
// with no download link, and the original Word files are not published at all (they live in
// private-documents/, outside public/). The section and its menu link stay hidden until at
// least one document has pages.
//
// A static site can't stop someone from taking a screenshot; this removes every download route
// the page itself offers (links, right-click "Save image", dragging, printing the viewer).

import { icon } from './icons.js';
import { esc, safeUrl } from './utils.js';

const DOCS = [
  { key: 'resumePages', title: 'Résumé', icon: 'file-text' },
  { key: 'cvPages', title: 'Curriculum Vitae', icon: 'graduation-cap' },
];

function card(doc, pages, index) {
  return `
    <li class="reveal">
      <article class="doc-card paper">
        <span class="doc-card__icon">${icon(doc.icon)}</span>
        <h3 class="doc-card__title">${esc(doc.title)}</h3>
        <p class="doc-card__type">${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · View only</p>
        <div class="doc-card__actions">
          <button class="btn btn--primary" type="button" data-doc-open="${index}">${icon('book-open')}<span>View ${esc(doc.title)}</span></button>
        </div>
      </article>
    </li>`;
}

function buildViewer() {
  const dialog = document.createElement('dialog');
  dialog.className = 'doc-viewer';
  dialog.setAttribute('aria-labelledby', 'doc-viewer-title');
  dialog.innerHTML = `
    <header class="doc-viewer__bar">
      <h2 class="doc-viewer__title" id="doc-viewer-title"></h2>
      <span class="doc-viewer__badge">${icon('shield')}View only</span>
      <span class="doc-viewer__count" aria-live="polite"></span>
      <button class="doc-viewer__close" type="button" aria-label="Close">${icon('x')}</button>
    </header>
    <div class="doc-viewer__pages" tabindex="0"></div>`;
  document.body.appendChild(dialog);

  const pagesBox = dialog.querySelector('.doc-viewer__pages');
  const count = dialog.querySelector('.doc-viewer__count');

  // No right-click "Save image as", no dragging a page out, no copy.
  ['contextmenu', 'dragstart', 'copy', 'cut'].forEach((type) => dialog.addEventListener(type, (e) => e.preventDefault()));
  dialog.querySelector('.doc-viewer__close').addEventListener('click', () => dialog.close());
  // Clicking the dimmed area outside the document closes it.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('doc-viewer-open');
    pagesBox.replaceChildren();
  });

  // Shows "Page 2 of 4" for the page nearest the middle of the viewer.
  pagesBox.addEventListener('scroll', () => {
    const frames = [...pagesBox.children];
    if (!frames.length) return;
    const middle = pagesBox.scrollTop + pagesBox.clientHeight / 2;
    const current = frames.findIndex((f) => f.offsetTop + f.offsetHeight > middle);
    count.textContent = `Page ${(current === -1 ? frames.length : current + 1)} of ${frames.length}`;
  }, { passive: true });

  return {
    open(doc, pages, opener) {
      dialog.querySelector('.doc-viewer__title').textContent = doc.title;
      count.textContent = `Page 1 of ${pages.length}`;
      pagesBox.innerHTML = pages.map((src, i) => `
        <div class="doc-viewer__page">
          <img src="${esc(src)}" alt="${esc(doc.title)}, page ${i + 1} of ${pages.length}" draggable="false" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
          <span class="doc-viewer__shield" aria-hidden="true"></span>
        </div>`).join('');
      pagesBox.scrollTop = 0;
      document.documentElement.classList.add('doc-viewer-open');
      dialog.showModal();
      dialog.addEventListener('close', () => opener?.focus(), { once: true });
    },
  };
}

let viewer = null;

export function renderDocuments(data = {}) {
  const section = document.getElementById('documents');
  const list = document.querySelector('[data-documents]');
  if (!section || !list) return;

  const docs = DOCS
    .map((doc) => ({ doc, pages: (Array.isArray(data[doc.key]) ? data[doc.key] : []).map(safeUrl).filter(Boolean) }))
    .filter(({ pages }) => pages.length);

  list.innerHTML = docs.map(({ doc, pages }, i) => card(doc, pages, i)).join('');
  list.onclick = (event) => {
    const button = event.target.closest('[data-doc-open]');
    if (!button) return;
    const { doc, pages } = docs[Number(button.dataset.docOpen)];
    viewer ||= buildViewer();
    viewer.open(doc, pages, button);
  };

  const hasFiles = docs.length > 0;
  section.hidden = !hasFiles;
  document.querySelectorAll('[data-documents-link]').forEach((link) => { link.hidden = !hasFiles; });
  // Keeps the section numbers in sequence when this section is hidden.
  const contactNumber = document.querySelector('#contact .kicker__num');
  if (contactNumber) contactNumber.textContent = hasFiles ? '11' : '10';
}
