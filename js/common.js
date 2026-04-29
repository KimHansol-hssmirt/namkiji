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

const catLabel = { clothes: '옷', shoes: '신발', goods: '잡화' };

// ─── 토스트 메시지 ────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
