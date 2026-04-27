// ─── 전역 상태 ───────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'namkiji2024';
let isAdmin = false;
let selectedCat = '';
let currentPopupId = null;
let map = null;
let geocoder = null;
let overlays = {};

const catLabel = { clothes: '옷', shoes: '신발', goods: '잡화' };

// ─── localStorage 저장소 ─────────────────────────────────────────────────
function loadStores() {
  try {
    const saved = localStorage.getItem('namkiji_stores');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveStores(list) {
  localStorage.setItem('namkiji_stores', JSON.stringify(list));
}

function getAllStores() {
  return [...dummyStores, ...loadStores()];
}

// ─── 토스트 메시지 ────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
