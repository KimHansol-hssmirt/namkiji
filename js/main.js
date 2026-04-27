// ─── 더미 데이터 ─────────────────────────────────────────────────────────
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

// ─── 지도 초기화 ──────────────────────────────────────────────────────────
function initMap() {
  const container = document.getElementById('map');
  map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(37.5597, 126.9769),
    level: 4
  });
  geocoder = new kakao.maps.services.Geocoder();

  getAllStores().forEach(s => addPinToMap(s));
  updateCount();
}

// ─── 지도 핀 ─────────────────────────────────────────────────────────────
function makePinHTML(store) {
  return `
    <div class="map-pin" onclick="showPopup('${store.id}')">
      <div class="pin-bubble ${store.cat}">${store.name}</div>
    </div>`;
}

function addPinToMap(store) {
  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(store.lat, store.lng),
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

// ─── 카카오맵 SDK 로드 후 실행 ────────────────────────────────────────────
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
