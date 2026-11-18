// Runs synchronously in <head> so styles that depend on JavaScript, and the visitor's
// saved colour theme (see js/theme.js), apply before first paint.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  // The visitor's own choice wins; otherwise use the default set in the CMS.
  var theme = root.getAttribute('data-default-theme');
  try {
    var saved = localStorage.getItem('portfolio-theme');
    if (/^(teal|gold|black-gold|black-pink|black-violet)$/.test(saved || '')) theme = saved;
  } catch (e) { /* storage unavailable: keep the default theme */ }
  if (/^(gold|black-gold|black-pink|black-violet)$/.test(theme || '')) root.setAttribute('data-theme', theme);
  try {
    if (localStorage.getItem('portfolio-mode') === 'dark') root.setAttribute('data-mode', 'dark');
  } catch (e) { /* storage unavailable: stay in light mode */ }
  // Desktop only: the visitor may have hidden the sidebar for a full-width view (see js/sidebar.js).
  try {
    if (localStorage.getItem('portfolio-sidebar') === 'hidden') root.classList.add('sidebar-hidden');
  } catch (e) { /* storage unavailable: sidebar stays visible */ }

  // If the home page's main script never ran, drop the JS-only styles so nothing stays hidden.
  window.addEventListener('load', function () {
    if (root.getAttribute('data-page') === 'home' && !window.__portfolioBooted) root.classList.remove('js');
  });
})();
