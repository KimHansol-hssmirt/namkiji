const PARTIALS = [
  'header',
  'map',
  'legend',
  'store-count',
  'fab',
  'info-popup',
  'form-sheet',
  'admin-modal',
  'toast',
  'place-search',
];

function loadScript(src) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    document.body.appendChild(s);
  });
}

async function loadPartials() {
  const app = document.getElementById('app');
  const htmls = await Promise.all(
    PARTIALS.map(name => fetch(`partials/${name}.html`).then(r => r.text()))
  );
  htmls.forEach(html => app.insertAdjacentHTML('beforeend', html));
}

async function init() {
  await loadPartials();
  await loadScript('js/common.js');
  await loadScript('js/main.js');
  await loadScript('js/components.js');
  tryInit();
}

init();
