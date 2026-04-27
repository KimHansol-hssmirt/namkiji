// ─── State ───────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'namkiji2024';
let isAdmin = false;
let selectedCat = '';
let currentPopupId = null;
let map = null;
let geocoder = null;
let overlays = {};

// ─── Dummy Data ──────────────────────────────────────────────────────────
const dummyStores = [
  {
    id: 'dummy1',
    name: '꼬마세상',
    addr: '서울 중구 남대문시장4길 21',
    cat: 'clothes',
    memo: '신생아~7세 의류 전문. 도매도 가능.',
    lat: 37.5590, lng: 126.9762
  },
  {
    id: 'dummy2',
    name: '키즈슈즈랜드',
    addr: '서울 중구 남대문시장2길 8',
    cat: 'shoes',
    memo: '수입 아동화 전문. 사이즈 100~190.',
    lat: 37.5602, lng: 126.9775
  },
  {
    id: 'dummy3',
    name: '아가방 남대문점',
    addr: '서울 중구 남대문시장5길 14',
    cat: 'clothes',
    memo: '임부복·신생아 의류. 오전 9시 오픈.',
    lat: 37.5595, lng: 126.9755
  },
  {
    id: 'dummy4',
    name: '베베잡화관',
    addr: '서울 중구 남대문시장3길 33',
    cat: 'goods',
    memo: '가방, 모자, 양말 등 아동 잡화 총집합.',
    lat: 37.5608, lng: 126.9768
  },
  {
    id: 'dummy5',
    name: '리틀스타 의류',
    addr: '서울 중구 남대문시장길 19',
    cat: 'clothes',
    memo: '계절별 의류 최저가. 단체주문 환영.',
    lat: 37.5583, lng: 126.9780
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────
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

// ─── Map Init ─────────────────────────────────────────────────────────────
function initMap() {
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(37.5597, 126.9769),
    level: 4
  };
  map = new kakao.maps.Map(container, options);
  geocoder = new kakao.maps.services.Geocoder();

  getAllStores().forEach(s => addPinToMap(s));
  updateCount();
}

// ─── Pin ──────────────────────────────────────────────────────────────────
const catLabel = { clothes: '옷', shoes: '신발', goods: '잡화' };

function makePinHTML(store) {
  return `
    <div class="map-pin" onclick="showPopup('${store.id}')">
      <div class="pin-bubble ${store.cat}">${store.name}</div>
    </div>`;
}

function addPinToMap(store) {
  const pos = new kakao.maps.LatLng(store.lat, store.lng);
  const overlay = new kakao.maps.CustomOverlay({
    position: pos,
    content: makePinHTML(store),
    yAnchor: 1.3,
  });
  overlay.setMap(map);
  overlays[store.id] = { overlay, store };
}

function removePinFromMap(id) {
  if (overlays[id]) {
    overlays[id].overlay.setMap(null);
    delete overlays[id];
  }
}

function updateCount() {
  document.getElementById('count-num').textContent = Object.keys(overlays).length;
}

// ─── Form ─────────────────────────────────────────────────────────────────
function openForm() {
  document.getElementById('modal-overlay').classList.add('show');
  document.getElementById('form-sheet').classList.add('show');
}

function closeForm() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.getElementById('form-sheet').classList.remove('show');
}

function selectCat(cat) {
  selectedCat = cat;
  document.querySelectorAll('.cat-pill').forEach(el => {
    el.className = 'cat-pill';
    if (el.dataset.cat === cat) el.classList.add(`selected-${cat}`);
  });
}

function submitStore() {
  const name = document.getElementById('f-name').value.trim();
  const addr = document.getElementById('f-addr').value.trim();
  const memo = document.getElementById('f-memo').value.trim();

  if (!name) { showToast('매장명을 입력해주세요'); return; }
  if (!addr) { showToast('주소를 입력해주세요'); return; }
  if (!selectedCat) { showToast('품목을 선택해주세요'); return; }

  showToast('주소 검색 중...');

  geocoder.addressSearch(addr, function(result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const store = {
        id: 'user_' + Date.now(),
        name, addr, cat: selectedCat, memo,
        lat: parseFloat(result[0].y),
        lng: parseFloat(result[0].x)
      };

      const userStores = loadStores();
      userStores.push(store);
      saveStores(userStores);

      addPinToMap(store);
      updateCount();
      map.panTo(new kakao.maps.LatLng(store.lat, store.lng));
      closeForm();
      resetForm();
      showToast('📌 지도에 등록됐어요!');
    } else {
      showToast('주소를 찾을 수 없어요. 다시 확인해주세요.');
    }
  });
}

function resetForm() {
  document.getElementById('f-name').value = '';
  document.getElementById('f-addr').value = '';
  document.getElementById('f-memo').value = '';
  selectedCat = '';
  document.querySelectorAll('.cat-pill').forEach(el => el.className = 'cat-pill');
}

// ─── Popup ────────────────────────────────────────────────────────────────
function showPopup(id) {
  const entry = overlays[id];
  if (!entry) return;
  const s = entry.store;
  currentPopupId = id;

  document.getElementById('popup-name').textContent = s.name;

  const tagEl = document.getElementById('popup-tag');
  tagEl.textContent = catLabel[s.cat] || s.cat;
  tagEl.className = `popup-tag ${s.cat}`;

  document.getElementById('popup-addr').textContent = '📍 ' + s.addr;
  document.getElementById('popup-memo').textContent = s.memo ? '💬 ' + s.memo : '';
  document.getElementById('popup-delete').classList.toggle('visible', isAdmin);
  document.getElementById('info-popup').style.display = 'block';
}

function closePopup() {
  document.getElementById('info-popup').style.display = 'none';
  currentPopupId = null;
}

function deleteCurrentStore() {
  if (!currentPopupId || !isAdmin) return;
  if (dummyStores.some(s => s.id === currentPopupId)) {
    showToast('기본 데이터는 삭제할 수 없어요');
    return;
  }
  saveStores(loadStores().filter(s => s.id !== currentPopupId));
  removePinFromMap(currentPopupId);
  updateCount();
  closePopup();
  showToast('삭제됐어요');
}

// ─── Admin ────────────────────────────────────────────────────────────────
function openAdminModal() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('admin-btn').classList.remove('active');
    document.getElementById('admin-btn').textContent = '관리자';
    if (currentPopupId) document.getElementById('popup-delete').classList.remove('visible');
    showToast('관리자 모드 해제');
    return;
  }
  document.getElementById('admin-pw').value = '';
  document.getElementById('admin-modal').classList.add('show');
  setTimeout(() => document.getElementById('admin-pw').focus(), 100);
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.remove('show');
}

function confirmAdmin() {
  const pw = document.getElementById('admin-pw').value;
  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    closeAdminModal();
    document.getElementById('admin-btn').classList.add('active');
    document.getElementById('admin-btn').textContent = '관리자 ✓';
    showToast('🔓 관리자 모드 활성화');
  } else {
    showToast('비밀번호가 틀렸어요');
    document.getElementById('admin-pw').value = '';
    document.getElementById('admin-pw').focus();
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ─── Map load ─────────────────────────────────────────────────────────────
function tryInit() {
  if (typeof kakao !== 'undefined' && kakao.maps) {
    kakao.maps.load(initMap);
  } else {
    setTimeout(tryInit, 100);
  }
}

window.addEventListener('load', tryInit);

document.getElementById('map').addEventListener('click', function(e) {
  if (!e.target.closest('.map-pin') && !e.target.closest('#info-popup')) {
    closePopup();
  }
});
