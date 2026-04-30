// ─── Firebase 초기화 ─────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyA8UfcMut2nstcVF06dEFeYrsUhyRsD4zE',
  authDomain:        'namkiji-4b339.firebaseapp.com',
  projectId:         'namkiji-4b339',
  storageBucket:     'namkiji-4b339.firebasestorage.app',
  messagingSenderId: '388594334859',
  appId:             '1:388594334859:web:1f8c97512e09f74e12a88e',
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ─── 전역 상태 ───────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'namkiji2024';
let isAdmin = false;
let selectedCat = '';
let currentPopupId = null;
let map = null;
let geocoder = null;
let overlays = {};
let editingStoreId = null;
let selectedPlace = null;
let currentFilter = 'all';

const catLabel = { clothes: '옷', shoes: '신발', goods: '잡화', snack: '간식' };

// ─── 토스트 메시지 ────────────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dismissToast(), 2200);
}

function dismissToast() {
  const el = document.getElementById('toast');
  el.classList.remove('show', 'dragging');
  el.style.transform = '';
  el.style.opacity = '';
  clearTimeout(toastTimer);
}

// ─── 토스트 드래그로 닫기 ─────────────────────────────────────────────────
// loader.js의 init() 완료 후 호출됨
function initToastDrag() {
  const THRESHOLD = 60;
  const toast = document.getElementById('toast');

  /* ── 터치 ── */
  toast.addEventListener('touchstart', function(e) {
    if (!toast.classList.contains('show')) return;
    const startY = e.touches[0].clientY;
    toast.classList.add('dragging');

    function onMove(ev) {
      const dy = Math.max(0, ev.touches[0].clientY - startY);
      toast.style.transform = `translateX(-50%) translateY(${dy}px)`;
      toast.style.opacity   = String(1 - Math.min(dy / THRESHOLD, 1) * 0.7);
      ev.preventDefault();
    }

    function onEnd(ev) {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
      toast.classList.remove('dragging');
      const dy = Math.max(0, ev.changedTouches[0].clientY - startY);
      if (dy >= THRESHOLD) {
        dismissToast();
      } else {
        toast.style.transform = '';
        toast.style.opacity   = '';
      }
    }

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onEnd);
  }, { passive: true });

  /* ── 마우스 ── */
  toast.addEventListener('mousedown', function(e) {
    if (!toast.classList.contains('show')) return;
    const startY = e.clientY;
    toast.classList.add('dragging');

    function onMove(ev) {
      const dy = Math.max(0, ev.clientY - startY);
      toast.style.transform = `translateX(-50%) translateY(${dy}px)`;
      toast.style.opacity   = String(1 - Math.min(dy / THRESHOLD, 1) * 0.7);
    }

    function onUp(ev) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      toast.classList.remove('dragging');
      const dy = Math.max(0, ev.clientY - startY);
      if (dy >= THRESHOLD) {
        dismissToast();
      } else {
        toast.style.transform = '';
        toast.style.opacity   = '';
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}
