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
(function initToastDrag() {
  const DISMISS_THRESHOLD = 50;
  let startY = 0;
  let isDragging = false;

  function getClientY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  function onStart(e) {
    const el = document.getElementById('toast');
    if (!el.classList.contains('show')) return;
    isDragging = true;
    startY = getClientY(e);
    el.classList.add('dragging');
  }

  function onMove(e) {
    if (!isDragging) return;
    const el = document.getElementById('toast');
    const dy = Math.max(0, getClientY(e) - startY); // 아래 방향만
    const progress = Math.min(dy / DISMISS_THRESHOLD, 1);
    el.style.transform = `translateX(-50%) translateY(${dy}px)`;
    el.style.opacity = String(1 - progress * 0.6);
    if (e.cancelable) e.preventDefault();
  }

  function onEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const el = document.getElementById('toast');
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const dy = Math.max(0, endY - startY);

    el.classList.remove('dragging');
    if (dy >= DISMISS_THRESHOLD) {
      dismissToast();
    } else {
      // 스냅백
      el.style.transform = '';
      el.style.opacity = '';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('toast');
    // 터치
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd);
    // 마우스
    el.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onEnd);
  });
})();
