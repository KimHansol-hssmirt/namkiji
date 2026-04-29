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
  'store-list',
];

async function init() {
  const app = document.getElementById('app');
  const htmls = await Promise.all(
    PARTIALS.map(name => fetch(`partials/${name}.html`).then(r => r.text()))
  );
  htmls.forEach(html => app.insertAdjacentHTML('beforeend', html));
  tryInit();
}

init();
