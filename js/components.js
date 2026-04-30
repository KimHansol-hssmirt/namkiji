// ─── 뷰 전환 ─────────────────────────────────────────────────────────────
function switchView(view) {
  const isMap = view === 'map';
  document.getElementById('map').style.display           = isMap ? 'block' : 'none';
  document.getElementById('legend').style.display        = isMap ? 'flex'  : 'none';
  document.getElementById('store-count').style.display   = isMap ? 'block' : 'none';
  document.getElementById('fab').style.display           = isMap ? 'flex'  : 'none';
  document.getElementById('info-popup').style.display    = 'none';
  document.getElementById('store-list-view').classList.toggle('show', !isMap);
  document.getElementById('view-map-btn').classList.toggle('active', isMap);
  document.getElementById('view-list-btn').classList.toggle('active', !isMap);
  if (!isMap) renderStoreList();
}

function filterList(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  renderStoreList();
}

function renderStoreList() {
  const ul = document.getElementById('store-list-ul');
  if (!ul) return;

  const stores = Object.values(overlays).map(e => e.store);
  const filtered = currentFilter === 'all' ? stores : stores.filter(s => s.cat === currentFilter);
  filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  ul.innerHTML = filtered.length === 0
    ? '<li style="text-align:center;color:#bbb;padding:40px 0;font-size:14px;">매장이 없어요</li>'
    : filtered.map(s => `
      <li class="store-item" onclick="goToStore('${s.id}')">
        <div class="store-item-header">
          <span class="store-item-name">${s.name}</span>
          <span class="store-item-tag ${s.cat}">${catLabel[s.cat]}</span>
        </div>
        ${s.hours ? `<div class="store-item-hours">🕐 ${s.hours}</div>` : ''}
        <div class="store-item-addr">📍 ${s.addr}</div>
        ${s.memo ? `<div class="store-item-memo">💬 ${s.memo}</div>` : ''}
      </li>`).join('');
}

function goToStore(id) {
  switchView('map');
  const entry = overlays[id];
  if (!entry) return;
  map.panTo(new kakao.maps.LatLng(entry.store.lat, entry.store.lng));
  map.setLevel(3);
  setTimeout(() => showPopup(id), 300);
}

// ─── 사진 업로드 ─────────────────────────────────────────────────────────
let selectedPhotos = [];   // File 객체 배열 (신규 선택)
const MAX_PHOTOS = 3;

function onPhotoSelected(input) {
  const files = Array.from(input.files);
  const remaining = MAX_PHOTOS - selectedPhotos.length;
  if (remaining <= 0) { showToast(`사진은 최대 ${MAX_PHOTOS}장까지 추가할 수 있어요`); input.value = ''; return; }

  const toAdd = files.slice(0, remaining);
  if (files.length > remaining) showToast(`최대 ${MAX_PHOTOS}장까지만 추가됩니다`);

  toAdd.forEach(file => {
    selectedPhotos.push(file);
    addPhotoPreview(file, selectedPhotos.length - 1);
  });
  input.value = '';
  updateUploadAreaVisibility();
}

function addPhotoPreview(file, idx) {
  const reader = new FileReader();
  reader.onload = e => {
    const list = document.getElementById('photo-preview-list');
    const item = document.createElement('div');
    item.className = 'photo-preview-item';
    item.dataset.idx = idx;
    item.innerHTML = `
      <img src="${e.target.result}" alt="사진 미리보기" />
      <button class="photo-preview-remove" onclick="removePhoto(${idx})">×</button>`;
    list.appendChild(item);
  };
  reader.readAsDataURL(file);
}

function removePhoto(idx) {
  selectedPhotos[idx] = null;   // null 로 표시 (인덱스 유지)
  const list = document.getElementById('photo-preview-list');
  const item = list.querySelector(`[data-idx="${idx}"]`);
  if (item) item.remove();
  updateUploadAreaVisibility();
}

function updateUploadAreaVisibility() {
  const activeCount = selectedPhotos.filter(Boolean).length;
  const area = document.getElementById('photo-upload-area');
  if (area) area.style.display = activeCount >= MAX_PHOTOS ? 'none' : 'flex';
}

async function uploadPhotos(storeId) {
  const storage = firebase.storage();
  const urls = [];
  const files = selectedPhotos.filter(Boolean);
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const ref = storage.ref(`stores/${storeId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    urls.push(url);
  }
  return urls;
}

function resetPhotos() {
  selectedPhotos = [];
  const list = document.getElementById('photo-preview-list');
  if (list) list.innerHTML = '';
  const area = document.getElementById('photo-upload-area');
  if (area) area.style.display = 'flex';
  const input = document.getElementById('f-photos');
  if (input) input.value = '';
}

// ─── 장소 검색 ───────────────────────────────────────────────────────────
let ps = null;

function openPlaceSearch() {
  if (!ps) ps = new kakao.maps.services.Places();
  document.getElementById('place-keyword').value = '';
  document.getElementById('place-results').innerHTML = '';
  document.getElementById('place-search-modal').classList.add('show');
  setTimeout(() => document.getElementById('place-keyword').focus(), 100);
}

function closePlaceSearch() {
  document.getElementById('place-search-modal').classList.remove('show');
}

function searchPlaces() {
  const keyword = document.getElementById('place-keyword').value.trim();
  if (!keyword) { document.getElementById('place-results').innerHTML = ''; return; }

  ps.keywordSearch(keyword, function(data, status) {
    const list = document.getElementById('place-results');
    list.innerHTML = '';
    if (status !== kakao.maps.services.Status.OK) {
      list.innerHTML = '<li style="padding:16px;color:#888;text-align:center">검색 결과가 없어요</li>';
      return;
    }
    data.forEach(place => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="place-result-name">${place.place_name}</div>
        <div class="place-result-addr">${place.road_address_name || place.address_name}</div>
      `;
      li.onclick = () => selectPlace(place);
      list.appendChild(li);
    });
  }, { location: new kakao.maps.LatLng(37.5597, 126.9769), radius: 3000 });
}

function selectPlace(place) {
  selectedPlace = {
    lat: parseFloat(place.y),
    lng: parseFloat(place.x),
    addr: place.road_address_name || place.address_name,
  };
  document.getElementById('f-addr').value = selectedPlace.addr;
  if (!document.getElementById('f-name').value) {
    document.getElementById('f-name').value = place.place_name;
  }
  closePlaceSearch();
}

function clearHours() {
  document.getElementById('f-open').value = '';
  document.getElementById('f-close').value = '';
}

// ─── 제보 폼 ─────────────────────────────────────────────────────────────
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

async function submitStore() {
  const name = document.getElementById('f-name').value.trim();
  const addr = document.getElementById('f-addr').value.trim();
  const memo = document.getElementById('f-memo').value.trim();

  if (!name) { showToast('매장명을 입력해주세요'); return; }
  if (!addr) { showToast('주소를 입력해주세요'); return; }
  if (!selectedCat) { showToast('품목을 선택해주세요'); return; }

  const openTime  = document.getElementById('f-open').value;
  const closeTime = document.getElementById('f-close').value;
  const hours = openTime && closeTime ? `${openTime} ~ ${closeTime}` : (openTime || closeTime || '');

  async function save(lat, lng) {
    const data = { name, addr, cat: selectedCat, memo, hours, lat, lng };
    if (editingStoreId) {
      // 수정 시 새 사진이 있으면 업로드해서 기존 목록에 추가
      const newUrls = await uploadPhotos(editingStoreId);
      const existing = overlays[editingStoreId]?.store?.photos || [];
      if (newUrls.length) data.photos = [...existing, ...newUrls];
      await db.collection('stores').doc(editingStoreId).update(data);
      showToast('✏️ 수정됐어요!');
    } else {
      showToast('사진 업로드 중...');
      const docRef = await db.collection('stores').add({
        ...data,
        photos: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      const photoUrls = await uploadPhotos(docRef.id);
      if (photoUrls.length) {
        await docRef.update({ photos: photoUrls });
      }
      showToast('📌 지도에 등록됐어요!');
    }
    map.panTo(new kakao.maps.LatLng(lat, lng));
    closeForm();
    resetForm();
  }

  if (selectedPlace) {
    await save(selectedPlace.lat, selectedPlace.lng);
  } else {
    showToast('주소 검색 중...');
    geocoder.addressSearch(addr, async function(result, status) {
      if (status === kakao.maps.services.Status.OK) {
        await save(parseFloat(result[0].y), parseFloat(result[0].x));
      } else {
        showToast('주소를 찾을 수 없어요. 다시 확인해주세요.');
      }
    });
  }
}

function resetForm() {
  editingStoreId = null;
  document.getElementById('f-name').value = '';
  document.getElementById('f-addr').value = '';
  document.getElementById('f-open').value = '';
  document.getElementById('f-close').value = '';
  document.getElementById('f-memo').value = '';
  selectedCat = '';
  document.querySelectorAll('.cat-pill').forEach(el => el.className = 'cat-pill');
  selectedPlace = null;
  resetPhotos();
  document.querySelector('.sheet-title').textContent = '📍 매장 제보하기';
  document.querySelector('.submit-btn').textContent = '지도에 핀 등록하기 📌';
}

// ─── 매장 정보 팝업 ───────────────────────────────────────────────────────
function showPopup(id) {
  const entry = overlays[id];
  if (!entry) return;
  const s = entry.store;
  currentPopupId = id;

  document.getElementById('popup-name').textContent = s.name;

  const tagEl = document.getElementById('popup-tag');
  tagEl.textContent = catLabel[s.cat] || s.cat;
  tagEl.className = `popup-tag ${s.cat}`;

  const hoursEl = document.getElementById('popup-hours');
  hoursEl.textContent = s.hours ? '🕐 ' + s.hours : '';

  // 사진
  const photosEl = document.getElementById('popup-photos');
  photosEl.innerHTML = '';
  if (s.photos && s.photos.length) {
    s.photos.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'popup-photo';
      img.alt = s.name;
      img.onclick = () => window.open(url, '_blank');
      photosEl.appendChild(img);
    });
  }

  document.getElementById('popup-addr').textContent = '📍 ' + s.addr;
  document.getElementById('popup-memo').textContent = s.memo ? '💬 ' + s.memo : '';

  const isDummy = dummyStores.some(d => d.id === id);
  document.getElementById('popup-actions').classList.toggle('visible', isAdmin && !isDummy);
  document.getElementById('info-popup').style.display = 'block';
}

function openNavi(id) {
  const entry = overlays[id];
  if (!entry) return;
  const { name, lat, lng } = entry.store;
  const url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
  window.open(url, '_blank');
}

function closePopup() {
  document.getElementById('info-popup').style.display = 'none';
  currentPopupId = null;
}

async function deleteCurrentStore() {
  if (!currentPopupId || !isAdmin) return;
  if (dummyStores.some(s => s.id === currentPopupId)) {
    showToast('기본 데이터는 삭제할 수 없어요');
    return;
  }
  await db.collection('stores').doc(currentPopupId).delete();
  closePopup();
  showToast('삭제됐어요');
}

function openEditForm(id) {
  const entry = overlays[id];
  if (!entry) return;
  const s = entry.store;

  editingStoreId = id;
  selectedPlace = { lat: s.lat, lng: s.lng, addr: s.addr };
  document.getElementById('f-name').value = s.name;
  document.getElementById('f-addr').value = s.addr;
  document.getElementById('f-memo').value = s.memo || '';
  if (s.hours && s.hours.includes('~')) {
    const [o, c] = s.hours.split('~').map(t => t.trim());
    document.getElementById('f-open').value = o;
    document.getElementById('f-close').value = c;
  }
  selectCat(s.cat);

  document.querySelector('.sheet-title').textContent = '✏️ 매장 수정하기';
  document.querySelector('.submit-btn').textContent = '수정 완료 ✓';

  closePopup();
  openForm();
}

// ─── 관리자 모달 ──────────────────────────────────────────────────────────
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
