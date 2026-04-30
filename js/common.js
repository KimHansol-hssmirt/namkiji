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
let currentSearch = '';

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

// ─── 토스트 스와이프로 닫기 ──────────────────────────────────────────────
// loader.js init() 완료 후 호출
function initToastDrag() {
  const THRESHOLD  = 60;   // 닫힘 판정 드래그 거리 (px)
  const DISMISS_TO = 140;  // 닫힐 때 날아가는 거리 (px)
  const toast = document.getElementById('toast');

  // 드래그 임계값 초과 → 아래로 날려보내며 닫기
  function animateDismiss() {
    toast.classList.remove('dragging');               // transition 복원
    toast.style.transform = `translateX(-50%) translateY(${DISMISS_TO}px)`;
    toast.style.opacity   = '0';
    clearTimeout(toastTimer);
    setTimeout(() => {
      toast.classList.remove('show');
      toast.style.transform = '';
      toast.style.opacity   = '';
    }, 320);                                          // CSS transition 완료 후 숨김
  }

  // 드래그 임계값 미달 → 원래 위치로 스냅백
  function snapBack() {
    toast.classList.remove('dragging');               // transition 복원
    toast.style.transform = '';                       // CSS .show 상태로 복귀
    toast.style.opacity   = '';
  }

  // 드래그 중 위치·투명도 업데이트
  function applyDrag(dy) {
    // 아래 방향만 허용, 위로는 약간의 저항감
    const clampedDy = dy > 0 ? dy : dy * 0.15;
    toast.style.transform = `translateX(-50%) translateY(${clampedDy}px)`;
    toast.style.opacity   = String(1 - Math.min(Math.max(dy, 0) / THRESHOLD, 1) * 0.65);
  }

  /* ── 터치 ──────────────────────────────────────────────────────────── */
  toast.addEventListener('touchstart', function(e) {
    if (!toast.classList.contains('show')) return;
    const startY = e.touches[0].clientY;
    toast.classList.add('dragging');

    function onMove(ev) {
      applyDrag(ev.touches[0].clientY - startY);
      ev.preventDefault();   // 스크롤 이벤트 차단
    }
    function onEnd(ev) {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
      const dy = ev.changedTouches[0].clientY - startY;
      dy >= THRESHOLD ? animateDismiss() : snapBack();
    }

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onEnd,  { passive: true });
  }, { passive: true });

  /* ── 마우스 ─────────────────────────────────────────────────────────── */
  toast.addEventListener('mousedown', function(e) {
    if (!toast.classList.contains('show')) return;
    const startY = e.clientY;
    toast.classList.add('dragging');

    function onMove(ev) { applyDrag(ev.clientY - startY); }
    function onUp(ev) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      const dy = ev.clientY - startY;
      dy >= THRESHOLD ? animateDismiss() : snapBack();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}
