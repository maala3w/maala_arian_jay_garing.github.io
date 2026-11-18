// Falling school-ID intro (loading screen).
//
// A classic script loaded at the very top of <body> on the home page, so the overlay exists
// before anything else paints. Settings arrive inline from the server (<script id="intro-config">,
// see server/routes/pages.js); when they are missing, the defaults below are used.
//
// Lifecycle: the overlay leaves once BOTH the animation sequence has finished AND main.js has
// signalled 'portfolio:ready' — or immediately on Skip / Esc, or after MAX_VISIBLE_MS no matter what.
// All text is inserted with textContent, never as HTML.
//
// The admin panel reuses this file to preview unsaved settings: window.PortfolioIntro.play(config, { container }).

(function () {
  'use strict';

  var DEFAULTS = {
    enabled: true,
    animationStyle: 'drop',
    welcomeMessage: 'Welcome to my portfolio',
    displayName: 'Arian Jay G. Maala',
    program: 'BS Computer Science',
    university: 'Biliran Province State University',
    academicPeriod: '2023–2027',
    subtitle: 'Research Enthusiast | Aspiring Data Analyst',
    photoUrl: null,
  };
  var STYLES = ['drop', 'lanyard', 'fade'];
  var REQUIRED_TEXT = ['welcomeMessage', 'displayName', 'program', 'university'];
  var OPTIONAL_TEXT = ['academicPeriod', 'subtitle'];
  var SESSION_KEY = 'portfolio-intro-seen';
  var MAX_VISIBLE_MS = 6000;
  // Time from start until the card has settled and the name is revealed (matches loading.css).
  var SEQUENCE_MS = { drop: 2250, lanyard: 2450, fade: 1350, reduced: 700 };
  var EXIT_MS = { leave: 520, skip: 260 };

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function safeImageUrl(url) {
    if (typeof url !== 'string') return null;
    url = url.trim();
    if (/^https?:\/\//i.test(url) || /^\/(?!\/)[\w\-./%]+$/.test(url) || /^[\w-]+\/[\w\-./%]+$/.test(url)) return url;
    return null;
  }

  /** Merges raw settings (from the server or the admin form) over the defaults. */
  function normalize(raw) {
    var cfg = {};
    Object.keys(DEFAULTS).forEach(function (k) { cfg[k] = DEFAULTS[k]; });
    if (!raw || typeof raw !== 'object') return cfg;

    if (typeof raw.enabled === 'boolean') cfg.enabled = raw.enabled;
    if (typeof raw.isEnabled === 'boolean') cfg.enabled = raw.isEnabled;
    if (STYLES.indexOf(raw.animationStyle) > -1) cfg.animationStyle = raw.animationStyle;
    REQUIRED_TEXT.forEach(function (k) {
      if (typeof raw[k] === 'string' && raw[k].trim()) cfg[k] = raw[k].trim();
    });
    OPTIONAL_TEXT.forEach(function (k) {
      if (k in raw) cfg[k] = typeof raw[k] === 'string' ? raw[k].trim() : '';
    });
    if ('photoUrl' in raw) cfg.photoUrl = safeImageUrl(raw.photoUrl);
    return cfg;
  }

  function readInlineConfig() {
    var el = document.getElementById('intro-config');
    if (!el) return normalize(null);
    try { return normalize(JSON.parse(el.textContent)); } catch (e) { return normalize(null); }
  }

  function initials(name) {
    var words = String(name).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    return ((words[0] || '')[0] || '') + ((words[1] || '')[0] || '');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // ---------------------------------------------------------------------------
  // Markup
  // ---------------------------------------------------------------------------
  function buildCard(cfg) {
    var card = el('article', 'id-card');
    card.setAttribute('aria-hidden', 'true'); // the same identity is announced in the text below the card

    card.appendChild(el('span', 'id-card__slot'));

    var head = el('header', 'id-card__head');
    head.appendChild(el('p', 'id-card__uni', cfg.university));
    head.appendChild(el('p', 'id-card__kind', 'Student Identification'));
    card.appendChild(head);

    var body = el('div', 'id-card__body');
    var photo = el('div', 'id-card__photo');
    var monogram = el('span', 'id-card__monogram', initials(cfg.displayName));
    photo.appendChild(monogram);
    if (cfg.photoUrl) {
      var img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.onload = function () { photo.replaceChildren(img); };
      img.src = cfg.photoUrl;
    }
    body.appendChild(photo);
    body.appendChild(el('p', 'id-card__name', cfg.displayName));
    body.appendChild(el('p', 'id-card__program', cfg.program));
    if (cfg.academicPeriod) body.appendChild(el('p', 'id-card__period', cfg.academicPeriod));
    card.appendChild(body);

    // Purely decorative footer: a smart-card chip and a tiny bar chart (not a barcode or any identifier).
    var foot = el('footer', 'id-card__foot');
    foot.appendChild(el('span', 'id-card__chip'));
    var bars = el('span', 'id-card__bars');
    for (var i = 0; i < 6; i++) bars.appendChild(el('i'));
    foot.appendChild(bars);
    foot.appendChild(el('span', 'id-card__note', 'Portfolio card · not an official ID'));
    card.appendChild(foot);
    return card;
  }

  function buildOverlay(cfg, style, embedded) {
    var root = el('section', 'intro intro--' + style + (embedded ? ' intro--embedded' : ''));
    root.setAttribute('aria-label', 'Portfolio introduction');

    root.appendChild(el('p', 'intro__welcome', cfg.welcomeMessage));

    var stage = el('div', 'intro__stage');
    stage.appendChild(el('div', 'intro__sheet'));
    stage.appendChild(el('div', 'intro__shadow'));
    var drop = el('div', 'intro__drop');
    var swing = el('div', 'intro__swing');
    var lanyard = el('div', 'intro__lanyard');
    lanyard.appendChild(el('span', 'intro__clip'));
    swing.appendChild(lanyard);
    swing.appendChild(buildCard(cfg));
    drop.appendChild(swing);
    stage.appendChild(drop);
    root.appendChild(stage);

    var identity = el('div', 'intro__identity');
    identity.appendChild(el('p', 'intro__name', cfg.displayName));
    if (cfg.subtitle) identity.appendChild(el('p', 'intro__subtitle', cfg.subtitle));
    root.appendChild(identity);

    var progress = el('div', 'intro__progress');
    progress.appendChild(el('span'));
    root.appendChild(progress);
    var status = el('p', 'visually-hidden', 'Loading portfolio…');
    status.setAttribute('role', 'status');
    root.appendChild(status);

    var skip = el('button', 'intro__skip', embedded ? 'Close preview' : 'Skip intro');
    skip.type = 'button';
    root.appendChild(skip);
    return { root: root, skip: skip, status: status };
  }

  // ---------------------------------------------------------------------------
  // Controller
  // ---------------------------------------------------------------------------
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function whenPortfolioReady() {
    return new Promise(function (resolve) {
      if (window.__portfolioReady) return resolve();
      document.addEventListener('portfolio:ready', function () { resolve(); }, { once: true });
    });
  }

  /**
   * Plays the intro.
   * options.container — render inside this element (admin preview) instead of over the page.
   * options.onDone    — called after the overlay is removed.
   */
  function play(rawConfig, options) {
    var opts = options || {};
    var embedded = Boolean(opts.container);
    var cfg = normalize(rawConfig);
    var style = prefersReducedMotion() ? 'reduced' : cfg.animationStyle;
    var html = document.documentElement;
    var parts = buildOverlay(cfg, style, embedded);
    var root = parts.root;
    var finished = false;

    var host = opts.container || document.body;
    host.insertBefore(root, host.firstChild);

    // Puts the ID's own photo on the card (separate from the profile photo). With none set, or if it
    // isn't ready in time, the monogram simply stays.
    if (!cfg.photoUrl && window.fetch) {
      fetch('data/portfolio.json', { cache: 'no-cache' }).then(function (res) { return res.json(); }).then(function (data) {
        var url = safeImageUrl(data.intro && data.intro.photoUrl);
        var photo = root.querySelector('.id-card__photo');
        if (!url || !photo) return;
        var img = new Image();
        img.alt = '';
        img.onload = function () { photo.replaceChildren(img); };
        img.src = url;
      }).catch(function () { /* keep the monogram */ });
    }

    // Hard cap: never keep visitors waiting, even if something below throws.
    var failsafe = setTimeout(function () { finish(true); }, embedded ? 120000 : MAX_VISIBLE_MS);

    function onKey(event) {
      if (event.key === 'Escape') finish(true);
      // Keep keyboard focus on Skip, rather than on links hidden behind the overlay.
      if (event.key === 'Tab' && !embedded) {
        event.preventDefault();
        parts.skip.focus();
      }
    }

    function finish(skipped) {
      if (finished) return;
      finished = true;
      clearTimeout(failsafe);
      document.removeEventListener('keydown', onKey);
      var hadFocus = root.contains(document.activeElement);
      root.classList.add(skipped ? 'is-skipping' : 'is-leaving');
      if (!embedded) {
        html.classList.remove('intro-active');
        html.classList.add('intro-revealing');
      }
      setTimeout(function () {
        root.remove();
        if (!embedded) {
          html.style.overflow = '';
          html.classList.remove('intro-revealing');
          if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
        }
        if (typeof opts.onDone === 'function') opts.onDone(skipped);
      }, skipped ? EXIT_MS.skip : EXIT_MS.leave);
    }

    parts.skip.addEventListener('click', function () { finish(true); });
    document.addEventListener('keydown', onKey);

    var ready = embedded ? Promise.resolve() : whenPortfolioReady();
    Promise.all([wait(SEQUENCE_MS[style]), ready])
      .then(function () {
        root.classList.add('is-ready');
        parts.status.textContent = 'Portfolio loaded.';
        return wait(embedded ? 900 : 280); // let the progress line complete
      })
      .then(function () { finish(false); })
      .catch(function () { finish(true); });

    return { finish: function () { finish(true); }, element: root };
  }

  function autoStart() {
    var html = document.documentElement;
    if (html.getAttribute('data-page') !== 'home') return;
    var cfg = readInlineConfig();
    if (!cfg.enabled || /[?&]preview=1\b/.test(location.search)) return;

    // Once per browser session. If storage is blocked the intro simply plays on this page load.
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (e) { /* ignore */ }

    html.classList.add('intro-active');
    html.style.overflow = 'hidden';
    try {
      play(cfg);
    } catch (e) {
      html.classList.remove('intro-active');
      html.style.overflow = '';
    }
  }

  window.PortfolioIntro = { play: play, normalize: normalize, defaults: DEFAULTS };
  autoStart();
})();
