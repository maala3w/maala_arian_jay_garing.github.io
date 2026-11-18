// Portfolio editor. It has no server: the browser's File System Access API (Edge and Chrome)
// lets it read and write the folder you choose, so saving updates data/portfolio.json and uploads
// copy files into assets/. It can only touch that folder, on the computer it is opened on.

import { hydrateIcons, icon } from './icons.js';

const $ = (selector, root = document) => root.querySelector(selector);

const ICONS = ['search', 'bar-chart', 'line-chart', 'scatter-chart', 'cpu', 'users', 'book-open', 'file-text', 'palette', 'code', 'monitor', 'mic', 'message-circle', 'lightbulb', 'target', 'database', 'pen-tool', 'video', 'presentation', 'megaphone', 'globe', 'award', 'trophy', 'flask', 'layers', 'sparkles', 'table', 'shirt', 'graduation-cap', 'calendar', 'clock', 'refresh', 'flag', 'star', 'image', 'link', 'building', 'target'];

// ---------------------------------------------------------------------------
// What can be edited. Keys match public/data/portfolio.json.
// ---------------------------------------------------------------------------
const text = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const long = (key, label, extra = {}) => ({ key, label, type: 'textarea', ...extra });
const num = (key, label) => ({ key, label, type: 'number' });
const select = (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra });
const check = (key, label) => ({ key, label, type: 'checkbox' });
const lines = (key, label, extra = {}) => ({ key, label, type: 'lines', ...extra });
const photo = (key, label, extra = {}) => ({ key, label, type: 'file', folder: 'images', accept: 'image', ...extra });
const doc = (key, label, extra = {}) => ({ key, label, type: 'file', folder: 'certificates', accept: 'any', ...extra });

/** A list of proof photos shown as thumbnails on the card. */
const proofList = (key = 'photos', urlKey = 'url') => ({
  key, type: 'list', upload: true, title: 'Proof photos', itemLabel: 'photo', titleOf: (i) => i.caption || 'Photo',
  make: () => ({ [urlKey]: null, caption: '' }),
  fields: [
    photo(urlKey, 'Photo', { hint: 'For example a certificate, event photo, or poster. Visitors can click it to see it full size. Cover private details first, because everyone can see it.' }),
    text('caption', 'Caption (optional)', { hint: 'It also describes the photo for screen readers.' }),
  ],
});

const LONG_HINT ='Leave a blank line between paragraphs. Start lines with "- " to make a list.';

const SCREENS = [
  {
    id: 'photo', label: 'Profile & About Me', icon: 'user',
    groups: [
      {
        path: 'profile', title: 'Profile',
        fields: [
          photo('profileImageUrl', 'Profile photo', { hint: 'Shown in the sidebar and the phone top bar. The hero and the intro school ID each have their own photo.' }),
          text('fullName', 'Full name', { required: true }),
          text('shortLabel', 'Roles', { hint: 'Separate roles with a vertical bar: A | B | C' }),
          long('aboutBio', 'About me', { rows: 9, hint: LONG_HINT }),
          long('careerGoal', 'Career goal'),
          long('visionText', 'Career vision'),
        ],
      },
      {
        path: 'intro', title: 'Intro school ID',
        fields: [photo('photoUrl', 'ID photo', { hint: 'Shown only on the school ID in the opening animation. A head-and-shoulders portrait with your face centered works best. If empty, the ID shows your initials.' })],
      },
      { path: 'identityCards', title: 'Highlight cards', itemLabel: 'card', titleOf: (i) => i.title, make: () => ({ title: 'New card', description: '', icon: 'sparkles' }), fields: [text('title', 'Title'), long('description', 'Description'), select('icon', 'Icon', ICONS)] },
      { path: 'languages', title: 'Languages', itemLabel: 'language', titleOf: (i) => i.name, make: () => ({ name: 'New language', proficiency: null }), fields: [text('name', 'Language'), text('proficiency', 'Level (optional)')] },
    ],
  },
  {
    id: 'hero', label: 'Hero & Contact', icon: 'home',
    groups: [
      { path: 'profile', title: 'Hero', fields: [photo('heroImageUrl', 'Hero photo', { hint: 'Shown only on the photo card beside your name at the top of the page. It is cropped to a square, so keep your face centered. If empty, the card shows your initials.' }), long('heroIntro', 'Introduction', { rows: 5 }), text('heroStatement', 'Short statement')] },
      { path: 'profile', title: 'Contact details', fields: [text('email', 'Email'), text('phone', 'Phone'), text('location', 'Location'), long('contactText', 'Contact invitation')] },
      {
        path: 'socialLinks', title: 'Social links', itemLabel: 'link', titleOf: (i) => `${i.platform}${i.url ? ` — ${i.url}` : ''}`,
        make: () => ({ platform: 'LinkedIn', url: '' }),
        fields: [select('platform', 'Platform', ['GitHub', 'LinkedIn', 'Facebook', 'Instagram', 'X', 'YouTube', 'Website', 'Other'], { noBlank: true }), text('label', 'Display text (optional)'), text('url', 'Link', { link: true, hint: 'For example https://www.linkedin.com/in/your-name' })],
      },
    ],
  },
  {
    id: 'resume', label: 'Résumé & CV', icon: 'file-text',
    // View-only: the site shows page images (resumePages / cvPages) and never publishes the Word
    // files, so there is no upload here. A new version has to be turned into page images first.
    intro: 'Your résumé and CV are shown on your site as view-only pages, so visitors can read them but not download them. The Word files are kept in the private-documents folder, which is not published. To update either one, give the new file to Claude to turn into view-only pages.',
    groups: [],
  },
  {
    id: 'education', label: 'Education', icon: 'graduation-cap',
    groups: [{
      path: 'education', title: 'Schools', itemLabel: 'school', titleOf: (i) => `${i.institution || 'School'}${i.level ? ` — ${i.level}` : ''}`,
      make: () => ({ institution: 'New school', level: '', program: null, startYear: null, endYear: null, description: null, achievements: [] }),
      fields: [
        text('institution', 'School'), text('level', 'Level'), text('program', 'Degree or strand'), num('startYear', 'Start year'), num('endYear', 'End year'), long('description', 'Description'),
        { key: 'achievements', type: 'list', title: 'Honors', itemLabel: 'honor', titleOf: (i) => i.title, make: () => ({ title: 'New honor', isDistinction: true }), fields: [text('title', 'Honor'), check('isDistinction', 'Show as a highlighted badge')] },
        { key: 'photos', type: 'list', title: 'Graduation photos', itemLabel: 'photo', titleOf: (i) => i.caption || 'Photo', make: () => ({ url: null, caption: '' }), fields: [photo('url', 'Photo', { hint: 'Shown on the left of this school\'s card. Portrait photos fit best.' }), text('caption', 'Caption (optional)', { hint: 'For example "Graduation Day, 2023". It also describes the photo for screen readers.' })] },
      ],
    }],
  },
  {
    id: 'skills', label: 'Skills', icon: 'layers',
    groups: [{
      path: 'skillCategories', title: 'Skill groups', itemLabel: 'group', titleOf: (i) => i.name,
      make: () => ({ slug: `group-${Date.now()}`, name: 'New group', description: '', icon: 'sparkles', isFeatured: false, skills: [] }),
      fields: [
        text('name', 'Group name'), long('description', 'Description'), select('icon', 'Icon', ICONS), check('isFeatured', 'Show large, as your core focus'),
        { key: 'skills', type: 'list', title: 'Skills', itemLabel: 'skill', titleOf: (i) => i.name, make: () => ({ name: 'New skill', icon: 'sparkles' }), fields: [text('name', 'Skill'), select('proficiency', 'Level (optional)', ['Experienced With', 'Working Knowledge', 'Developing Skills']), select('icon', 'Icon (optional)', ICONS)] },
      ],
    }],
  },
  {
    id: 'experience', label: 'Experience & Leadership', icon: 'briefcase',
    groups: [{
      path: 'experiences', title: 'Roles', itemLabel: 'role', titleOf: (i) => `${i.title}${i.section === 'leadership' ? ' (Leadership)' : ''}`, search: true,
      make: () => ({ section: 'professional', title: 'New role', organization: null, startYear: null, endYear: null, status: null, summary: null, points: [], media: [] }),
      fields: [
        select('section', 'Show under', ['professional', 'leadership'], { noBlank: true, labels: { professional: 'Experience', leadership: 'Leadership' } }),
        text('title', 'Position'), text('organization', 'Organization'), num('startYear', 'Start year'), num('endYear', 'End year'), text('status', 'Status', { hint: 'For example Former, Completed, In progress' }), long('summary', 'Description', { hint: LONG_HINT }),
        proofList('media', 'mediaUrl'),
        { key: 'points', type: 'list', title: 'Responsibilities & skills', itemLabel: 'point', titleOf: (i) => i.content, make: () => ({ pointType: 'responsibility', content: '' }), fields: [select('pointType', 'Type', ['responsibility', 'skill'], { noBlank: true }), long('content', 'Text')] },
      ],
    }],
  },
  {
    id: 'research', label: 'Research Papers', icon: 'book-open',
    groups: [{
      path: 'researchPapers', title: 'Papers', itemLabel: 'paper', titleOf: (i) => i.title, search: true,
      make: () => ({ title: 'New paper', researchType: 'qualitative', academicLevel: null, institution: null, yearLabel: null }),
      fields: [long('title', 'Title'), select('researchType', 'Type', ['qualitative', 'quantitative', 'developmental', 'action'], { noBlank: true }), text('academicLevel', 'Academic level'), text('institution', 'Institution'), text('yearLabel', 'Year'), long('abstract', 'Abstract', { rows: 6 }), doc('paperUrl', 'Paper file', { folder: 'documents' }), proofList()],
    }],
  },
  {
    id: 'projects', label: 'Project Software', icon: 'code',
    groups: [{
      path: 'systems', title: 'Systems', itemLabel: 'system', titleOf: (i) => i.name,
      make: () => ({ name: 'New system', url: '', photoUrl: null }),
      fields: [
        text('name', 'System name'),
        text('url', 'Link', { link: true, hint: 'Clicking the card opens this link. The card only appears once this is filled in.' }),
        photo('photoUrl', 'Background photo', { hint: 'A wide screenshot works best. The name appears over the bottom of the photo.' }),
      ],
    }],
  },
  {
    id: 'achievements', label: 'Competitions & Awards', icon: 'trophy',
    groups: [{
      path: 'achievements', title: 'Achievements', itemLabel: 'achievement', titleOf: (i) => `${i.distinction ? `${i.distinction}: ` : ''}${i.title}`, search: true,
      make: () => ({ category: 'institutional', title: 'New achievement' }),
      fields: [
        select('category', 'Group', ['international', 'regional', 'division', 'institutional', 'academic'], { noBlank: true, labels: { international: 'International', regional: 'Regional', division: 'Division', institutional: 'Institutional', academic: 'Awards' } }),
        text('distinction', 'Placement', { hint: 'For example Champion, 2nd Place, Qualifier' }), text('title', 'Title'), text('eventName', 'Event'), text('year', 'Year', { hint: 'One year or a range, for example 2019 or 2017–2018' }), text('location', 'Location'), text('issuingOrganization', 'Organization'), long('description', 'Description'),
        proofList(), doc('certificateUrl', 'Certificate'), photo('photoUrl', 'Photo'), doc('documentUrl', 'Other document', { folder: 'documents' }),
      ],
    }],
  },
  {
    id: 'trainings', label: 'Trainings & Seminars', icon: 'award',
    groups: [{
      path: 'trainings', title: 'Trainings', itemLabel: 'training', titleOf: (i) => i.title, search: true,
      make: () => ({ category: 'seminar', title: 'New training' }),
      fields: [
        select('category', 'Group', ['leadership', 'skill-development', 'seminar', 'webinar'], { noBlank: true }),
        text('title', 'Title'), text('trainingType', 'Type'), long('theme', 'Theme'), num('year', 'Year'), text('dateLabel', 'Exact date'), text('location', 'Location'), text('organizer', 'Organizer'), long('description', 'Description'), proofList(), doc('certificateUrl', 'Certificate'),
      ],
    }],
  },
  {
    id: 'chatbot', label: 'Chatbot', icon: 'message-circle',
    intro: 'The chatbot quotes this portfolio word for word, so it only says what you have written here.',
    groups: [{
      path: 'chatbot', title: 'Chatbot',
      fields: [check('enabled', 'Show the chatbot on my site'), long('welcomeMessage', 'Welcome message'), lines('suggestedQuestions', 'Suggested questions', { hint: 'One per line, up to six.' }), lines('approvedFacts', 'Extra facts', { hint: 'One sentence per line. Only add what is true.' })],
    }],
  },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let root = null; // the chosen public folder
let data = null;
let dirty = false;
let backedUp = false;
let currentScreen = SCREENS[0].id;

let toastTimer;
function toast(message, { error = false } = {}) {
  const el = $('[data-toast]');
  el.textContent = message;
  el.classList.toggle('is-error', error);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, error ? 7000 : 3500);
}

function setDirty(value) {
  dirty = value;
  const status = $('[data-status]');
  status.textContent = value ? 'Unsaved changes' : 'All changes saved';
  status.classList.toggle('is-dirty', value);
}

window.addEventListener('beforeunload', (event) => { if (dirty) event.preventDefault(); });

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------
async function resolveFile(path) {
  const parts = String(path).split('/').filter(Boolean);
  let dir = root;
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
  return dir.getFileHandle(parts.at(-1));
}

async function writeFile(dir, name, contents) {
  const handle = await dir.getFileHandle(name, { create: true });
  const stream = await handle.createWritable();
  await stream.write(contents);
  await stream.close(); // The file only changes here, so a failed save can't leave half a file.
}

async function saveData() {
  const dir = await root.getDirectoryHandle('data');
  if (!backedUp) {
    const previous = await (await dir.getFileHandle('portfolio.json')).getFile();
    await writeFile(dir, 'portfolio.backup.json', await previous.text());
    backedUp = true;
  }
  await writeFile(dir, 'portfolio.json', `${JSON.stringify(data, null, 2)}\n`);
}

const MB = 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;
const IMAGE_TARGET = 1.5 * MB;

/** Identifies a file by its first bytes rather than trusting its name. */
async function detectType(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', ext: 'jpg' };
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return { kind: 'image', ext: 'png' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { kind: 'image', ext: 'webp' };
  if (ascii(0, 5) === '%PDF-') return { kind: 'pdf', ext: 'pdf' };
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    // A .docx is a zip whose entry names appear as plain text. Macro-enabled files are refused.
    const body = await file.text();
    if (body.includes('word/document.xml') && !body.includes('word/vbaProject.bin')) return { kind: 'docx', ext: 'docx' };
  }
  return null;
}

/** Large photos are shrunk so the site stays fast. Re-saving also removes location data from them. */
async function prepareImage(file, ext) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const large = scale < 1 || file.size > IMAGE_TARGET;
  if (!large && ext !== 'jpg') return { blob: file, ext };
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/jpeg', 0.86); });
  return { blob, ext: 'jpg' };
}

const slugify = (name) => String(name).toLowerCase().replace(/\.[^.]*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'file';

/** Copies a chosen file into assets/<folder>/ and returns its path for portfolio.json. */
async function importFile(file, field) {
  const type = await detectType(file);
  const ACCEPTS = {
    image: { kinds: ['image'], text: 'a JPEG, PNG, or WebP image' },
    document: { kinds: ['pdf', 'docx'], text: 'a PDF or Word (.docx) file' },
    any: { kinds: ['image', 'pdf'], text: 'a JPEG, PNG, or WebP image, or a PDF' },
  };
  const rule = ACCEPTS[field.accept];
  if (!type || !rule.kinds.includes(type.kind)) throw new Error(`${file.name} can't be used here. Please choose ${rule.text}.`);
  if (type.kind !== 'image' && file.size > 15 * MB) throw new Error(`${file.name} is larger than 15 MB. Please use a smaller file.`);

  const { blob, ext } = type.kind === 'image' ? await prepareImage(file, type.ext) : { blob: file, ext: type.ext };

  const assets = await root.getDirectoryHandle('assets', { create: true });
  const dir = await assets.getDirectoryHandle(field.folder, { create: true });
  const base = slugify(file.name);
  // Never overwrite an existing file: something else may be using it.
  let name = `${base}.${ext}`;
  for (let n = 2; await dir.getFileHandle(name).then(() => true, () => false); n += 1) name = `${base}-${n}.${ext}`;
  await writeFile(dir, name, blob);
  return `assets/${field.folder}/${name}`;
}

const fileInput = $('[data-file-input]');
function chooseFile(accept) {
  return new Promise((resolve) => {
    fileInput.accept = {
      image: 'image/jpeg,image/png,image/webp',
      document: 'application/pdf,.docx',
      any: 'image/jpeg,image/png,image/webp,application/pdf',
    }[accept];
    fileInput.value = '';
    fileInput.onchange = () => resolve(fileInput.files[0] || null);
    fileInput.oncancel = () => resolve(null);
    fileInput.click();
  });
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'for') node.htmlFor = value;
    else node[key] = value;
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

let fieldCount = 0;

function setValue(obj, key, value, onChange) {
  if (value === '' || value === null || value === undefined) {
    if (key in obj) obj[key] = null;
  } else obj[key] = value;
  setDirty(true);
  onChange?.();
}

function fileField(field, obj, onChange) {
  const preview = el('div', { class: 'ed-upload__preview' });
  const info = el('p', { class: 'ed-upload__info' });
  const remove = el('button', { type: 'button', class: 'ed-mini ed-mini--danger', textContent: 'Remove' });
  const upload = el('button', { type: 'button', class: 'ed-add' });
  const box = el('div', { class: 'ed-upload' }, preview, info, el('div', { class: 'ed-upload__buttons' }, upload, remove));
  let objectUrl = null;

  async function show() {
    const path = obj[field.key];
    remove.hidden = !path;
    upload.textContent = path ? 'Replace…' : field.accept === 'image' ? 'Upload photo…' : 'Upload file…';
    preview.replaceChildren();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    if (!path) {
      preview.textContent = '—';
      info.textContent = 'Nothing uploaded yet. Click Upload, or drag a file here.';
      return;
    }
    info.textContent = path;
    if (/^https?:/i.test(path)) { preview.textContent = 'LINK'; return; }
    if (/\.pdf$/i.test(path)) { preview.textContent = 'PDF'; return; }
    if (/\.docx$/i.test(path)) { preview.textContent = 'DOCX'; return; }
    try {
      objectUrl = URL.createObjectURL(await (await resolveFile(path)).getFile());
      preview.append(el('img', { src: objectUrl, alt: '' }));
    } catch {
      preview.textContent = '?';
      info.textContent = `${path} (this file is missing from your folder)`;
    }
  }

  async function take(file) {
    if (!file) return;
    upload.disabled = true;
    upload.textContent = 'Saving…';
    try {
      setValue(obj, field.key, await importFile(file, field), onChange);
      await show();
      toast('File added. Press Save changes to keep it on your site.');
    } catch (err) {
      toast(err.message, { error: true });
      await show();
    } finally {
      upload.disabled = false;
    }
  }

  upload.addEventListener('click', async () => take(await chooseFile(field.accept)));
  remove.addEventListener('click', () => { setValue(obj, field.key, null, onChange); show(); });
  box.addEventListener('dragover', (event) => { event.preventDefault(); box.classList.add('is-over'); });
  box.addEventListener('dragleave', () => box.classList.remove('is-over'));
  box.addEventListener('drop', (event) => {
    event.preventDefault();
    box.classList.remove('is-over');
    take(event.dataTransfer.files[0]);
  });
  show();
  return box;
}

function fieldEl(field, obj, onChange) {
  fieldCount += 1;
  const id = `ed-f${fieldCount}`;
  const hint = field.hint ? el('p', { class: 'ed-hint', textContent: field.hint }) : null;
  const label = el('label', { for: id, textContent: field.label });

  switch (field.type) {
    case 'list':
      return listGroup(field, obj[field.key] ??= [], { nested: true });
    case 'file':
      return el('div', { class: 'field' }, el('span', { class: 'ed-legend', textContent: field.label }), fileField(field, obj, onChange), hint);
    case 'checkbox': {
      const input = el('input', { id, type: 'checkbox', checked: Boolean(obj[field.key]) });
      input.addEventListener('change', () => { obj[field.key] = input.checked; setDirty(true); onChange?.(); });
      return el('div', { class: 'field field--check' }, input, label);
    }
    case 'select': {
      const blank = field.noBlank ? [] : [el('option', { value: '', textContent: '— none —' })];
      const input = el('select', { id }, ...blank, ...field.options.map((o) => el('option', { value: o, textContent: field.labels?.[o] || o })));
      input.value = obj[field.key] ?? '';
      input.addEventListener('change', () => setValue(obj, field.key, input.value, onChange));
      return el('div', { class: 'field' }, label, input, hint);
    }
    case 'number': {
      const input = el('input', { id, type: 'number', step: 1, value: obj[field.key] ?? '' });
      input.addEventListener('input', () => setValue(obj, field.key, input.value === '' ? null : Number(input.value), onChange));
      return el('div', { class: 'field' }, label, input, hint);
    }
    case 'lines': {
      const input = el('textarea', { id, rows: 4, value: (obj[field.key] || []).join('\n') });
      input.addEventListener('input', () => {
        obj[field.key] = input.value.split('\n').map((s) => s.trim()).filter(Boolean);
        setDirty(true);
      });
      return el('div', { class: 'field' }, label, input, hint);
    }
    case 'textarea': {
      const input = el('textarea', { id, rows: field.rows || 3, value: obj[field.key] ?? '' });
      input.addEventListener('input', () => setValue(obj, field.key, input.value, onChange));
      return el('div', { class: 'field' }, label, input, hint);
    }
    default: {
      const input = el('input', { id, type: 'text', value: obj[field.key] ?? '' });
      input.addEventListener('input', () => setValue(obj, field.key, input.value, onChange));
      // The site only shows links with a scheme, so "my-site.com" becomes "https://my-site.com".
      if (field.link) {
        input.addEventListener('change', () => {
          const value = input.value.trim();
          if (!value || /^(https?:|mailto:)/i.test(value)) return;
          input.value = `https://${value.replace(/^\/+/, '')}`;
          setValue(obj, field.key, input.value, onChange);
        });
      }
      return el('div', { class: 'field' }, label, input, hint);
    }
  }
}

// ---------------------------------------------------------------------------
// Lists: add, remove, reorder
// ---------------------------------------------------------------------------
/** Asks for a photo and adds it to a proof-photo list straight away. Returns true if one was added. */
async function uploadInto(photos, group) {
  const fileSpec = group.fields.find((f) => f.type === 'file');
  const file = await chooseFile(fileSpec.accept);
  if (!file) return false;
  try {
    photos.push({ ...group.make(), [fileSpec.key]: await importFile(file, fileSpec) });
    setDirty(true);
    toast('Photo added. Press Save changes to keep it on your site.');
    return true;
  } catch (err) {
    toast(err.message, { error: true });
    return false;
  }
}

function listGroup(group, items, { nested = false } = {}) {
  const list = el('div', { class: 'ed-list' });
  const proofGroup = nested ? null : group.fields?.find((f) => f.upload);
  const search = group.search ? el('input', { class: 'ed-search', type: 'search', placeholder: `Search ${group.title.toLowerCase()}…`, ariaLabel: `Search ${group.title}` }) : null;

  function draw(openIndex = -1) {
    const query = search?.value.trim().toLowerCase() || '';
    list.replaceChildren(...items.flatMap((item, index) => {
      const title = () => String(group.titleOf(item) || `New ${group.itemLabel}`);
      if (query && !JSON.stringify(item).toLowerCase().includes(query)) return [];
      const titleEl = el('span', { class: 'ed-item__title', textContent: title() });
      const button = (label, ariaLabel, disabled, onClick, extraClass = '') => {
        const b = el('button', { type: 'button', class: `ed-mini ${extraClass}`, textContent: label, disabled, ariaLabel });
        b.addEventListener('click', (event) => { event.preventDefault(); onClick(); });
        return b;
      };
      const move = (delta) => {
        const [moved] = items.splice(index, 1);
        items.splice(index + delta, 0, moved);
        setDirty(true);
        draw();
      };
      const up = button('↑', '', index === 0, () => move(-1));
      const down = button('↓', '', index === items.length - 1, () => move(1));
      const remove = button('Delete', '', false, () => {
        if (!window.confirm(`Delete “${title()}”?`)) return;
        items.splice(index, 1);
        setDirty(true);
        draw();
      }, 'ed-mini--danger');
      // Every entry with proof photos gets its upload button right on its row.
      const photoCount = proofGroup ? (item[proofGroup.key] || []).filter((p) => p[proofGroup.fields[0].key]).length : 0;
      const uploadRow = proofGroup ? button(photoCount ? `Upload photo (${photoCount})` : 'Upload photo', '', false, async () => {
        uploadRow.disabled = true;
        const added = await uploadInto(item[proofGroup.key] ??= [], proofGroup);
        uploadRow.disabled = false;
        if (!added) return;
        draw(index);
        list.querySelector(':scope > details[open] .ed-sublist--upload')?.scrollIntoView({ block: 'center' });
      }, 'ed-mini--upload') : null;
      const refreshTitle = () => {
        titleEl.textContent = title();
        up.ariaLabel = `Move ${title()} up`;
        down.ariaLabel = `Move ${title()} down`;
        remove.ariaLabel = `Delete ${title()}`;
        if (uploadRow) uploadRow.ariaLabel = `Upload a proof photo for ${title()}`;
      };
      refreshTitle();
      const summary = el('summary', {}, titleEl, el('span', { class: 'ed-item__actions' }, uploadRow, up, down, remove));
      const details = el('details', { class: 'ed-item', open: index === openIndex }, summary);
      // Forms are built on first open, so long lists stay fast.
      const fill = () => {
        if (details.querySelector('.ed-form')) return;
        details.append(el('div', { class: 'ed-form' }, ...group.fields.map((f) => fieldEl(f, item, refreshTitle))));
        hydrateIcons(details);
      };
      details.addEventListener('toggle', () => { if (details.open) fill(); });
      if (index === openIndex) fill();
      return [details];
    }));
    if (!list.children.length) list.append(el('p', { class: 'ed-hint', textContent: items.length ? 'Nothing matches your search.' : 'Nothing here yet.' }));
  }

  search?.addEventListener('input', () => draw());
  const add = el('button', { type: 'button', class: 'ed-add', textContent: group.upload ? 'Upload photo…' : `+ Add ${group.itemLabel}` });
  add.addEventListener('click', async () => {
    if (group.upload) {
      add.disabled = true;
      const added = await uploadInto(items, group);
      add.disabled = false;
      if (added) draw(items.length - 1);
      return;
    }
    items.push(group.make());
    setDirty(true);
    if (search) search.value = '';
    draw(items.length - 1);
    list.lastElementChild?.scrollIntoView({ block: 'center' });
  });
  draw();
  const Heading = nested ? 'h3' : 'h2';
  return el('section', { class: nested ? `ed-sublist${group.upload ? ' ed-sublist--upload' : ''}` : 'ed-group' },
    el('div', { class: 'ed-group__head' }, el(Heading, { textContent: group.title, class: nested ? 'ed-legend' : '' }), add),
    search, list);
}

// ---------------------------------------------------------------------------
// Screens and start-up
// ---------------------------------------------------------------------------
function openScreen(id) {
  currentScreen = id;
  const screen = SCREENS.find((s) => s.id === id);
  document.querySelectorAll('[data-screen]').forEach((b) => {
    if (b.dataset.screen === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const main = $('[data-main]');
  const groups = screen.groups.map((group) => {
    const target = group.path ? (data[group.path] ??= group.make ? [] : {}) : data;
    if (group.make) return listGroup(group, target);
    return el('section', { class: 'ed-group' },
      screen.groups.length > 1 ? el('div', { class: 'ed-group__head' }, el('h2', { textContent: group.title })) : null,
      el('div', { class: 'ed-form paper' }, ...group.fields.map((f) => fieldEl(f, target))));
  });
  const hasUploads = screen.id !== 'resume' && screen.groups.some((g) => g.fields.some((f) => f.type === 'file' || f.fields?.some((x) => x.type === 'file')));
  main.replaceChildren(...[
    el('h1', { textContent: screen.label }),
    screen.intro ? el('p', { class: 'ed-intro', textContent: screen.intro }) : null,
    screen.id === 'resume' ? el('p', { class: 'ed-note', textContent: 'Anyone can download these from your published site. Use a public version: consider removing your home address, birth date, ID numbers, and references.' }) : null,
    hasUploads ? el('p', { class: 'ed-note', textContent: 'Anyone can see files on your published site. Before uploading a certificate, cover or crop out private details such as ID numbers, your home address, or signatures.' }) : null,
    ...groups,
  ].filter(Boolean));
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

async function save() {
  const button = $('[data-save]');
  button.disabled = true;
  try {
    await saveData();
    setDirty(false);
    toast('Saved. Refresh your site to see it. To update the online version, upload the public folder again.');
  } catch (err) {
    toast(`Could not save: ${err.message}`, { error: true });
  } finally {
    button.disabled = false;
  }
}

$('[data-save]').addEventListener('click', save);
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && root) {
    event.preventDefault();
    save();
  }
});

/** Accepts the public folder, or the project folder that contains it. */
async function locatePublic(handle) {
  const has = async (dir) => dir.getDirectoryHandle('data').then((d) => d.getFileHandle('portfolio.json')).then(() => true, () => false);
  if (await has(handle)) return handle;
  const inner = await handle.getDirectoryHandle('public').catch(() => null);
  if (inner && await has(inner)) return inner;
  return null;
}

async function startEditing(handle) {
  const folder = await locatePublic(handle);
  if (!folder) throw new Error(`“${handle.name}” isn't your portfolio. Please choose the public folder inside My Portfolio.`);
  root = folder;
  const file = await (await (await root.getDirectoryHandle('data')).getFileHandle('portfolio.json')).getFile();
  data = JSON.parse(await file.text());
  await rememberFolder(root).catch(() => {});

  $('[data-nav]').replaceChildren(...SCREENS.map((s) => {
    const b = el('button', { type: 'button' }, el('span', { textContent: s.label }));
    b.dataset.screen = s.id;
    b.insertAdjacentHTML('afterbegin', icon(s.icon));
    b.addEventListener('click', () => openScreen(s.id));
    return b;
  }));
  $('[data-start]').hidden = true;
  $('[data-app]').hidden = false;
  setDirty(false);
  openScreen(currentScreen);
}

// The chosen folder is remembered in this browser, so next time is one click.
const DB_NAME = 'portfolio-editor';
function withStore(mode, run) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('handles');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = run(open.result.transaction('handles', mode).objectStore('handles'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    };
  });
}
const rememberFolder = (handle) => withStore('readwrite', (store) => store.put(handle, 'public'));
const recallFolder = () => withStore('readonly', (store) => store.get('public'));

function showStartError(err) {
  if (err.name === 'AbortError') return;
  $('[data-start-error]').textContent = err.name === 'SyntaxError'
    ? 'portfolio.json has a mistake in it and could not be read. Restore data/portfolio.backup.json, or ask for help fixing it.'
    : err.message;
}

async function init() {
  hydrateIcons();
  if (!window.showDirectoryPicker) {
    $('[data-unsupported]').hidden = false;
    $('[data-pick]').hidden = true;
    return;
  }
  $('[data-pick]').addEventListener('click', async () => {
    $('[data-start-error]').textContent = '';
    try {
      await startEditing(await window.showDirectoryPicker({ id: 'portfolio', mode: 'readwrite' }));
    } catch (err) { showStartError(err); }
  });

  const saved = await recallFolder().catch(() => null);
  if (saved) {
    const resume = $('[data-continue]');
    resume.textContent = `Continue with “${saved.name}”`;
    resume.hidden = false;
    resume.addEventListener('click', async () => {
      $('[data-start-error]').textContent = '';
      try {
        const permission = await saved.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') throw new Error('Please allow editing so your changes can be saved.');
        await startEditing(saved);
      } catch (err) { showStartError(err); }
    });
  }
}

init();
