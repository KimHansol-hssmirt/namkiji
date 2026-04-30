// ─── 매장 목록 패널 ──────────────────────────────────────────────────────
let panelOpen = false;

function openStorePanel() {
  if (panelOpen) return;
  panelOpen = true;
  renderStoreList();
  document.getElementById('store-list-view').classList.add('show');
  document.getElementById('store-panel-overlay').classList.add('show');
  document.getElementById('store-count').style.display = 'none';
  document.getElementById('info-popup').style.display = 'none';
  initPanelDrag();
}

function closeStorePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  const panel = document.getElementById('store-list-view');
  panel.classList.remove('show');
  panel.style.transform = '';
  document.getElementById('store-panel-overlay').classList.remove('show');
  document.getElementById('store-count').style.display = 'block';
}

function toggleStorePanel() {
  panelOpen ? closeStorePanel() : openStorePanel();
}

// ─── 패널 드래그로 닫기 (위로 끌면 닫힘) ─────────────────────────────────
function initPanelDrag() {
  const handle = document.getElementById('panel-drag-handle');
  const panel  = document.getElementById('store-list-view');
  const THRESHOLD = 80;

  function startDrag(startY) {
    panel.style.transition = 'none';

    function onMove(clientY) {
      const dy = Math.min(0, clientY - startY); // 위쪽만 허용
      panel.style.transform = `translateY(${dy}px)`;
    }

    function endDrag(clientY) {
      panel.style.transition = '';
      const dy = Math.min(0, clientY - startY);
      if (Math.abs(dy) >= THRESHOLD) {
        closeStorePanel();
      } else {
        panel.style.transform = '';
      }
    }

    // 터치
    function touchMove(e) { onMove(e.touches[0].clientY); e.preventDefault(); }
    function touchEnd(e)  { endDrag(e.changedTouches[0].clientY); cleanup(); }
    // 마우스
    function mouseMove(e) { onMove(e.clientY); }
    function mouseUp(e)   { endDrag(e.clientY); cleanup(); }

    function cleanup() {
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend',  touchEnd);
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup',   mouseUp);
    }

    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend',  touchEnd);
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup',   mouseUp);
  }

  handle.ontouchstart = e => startDrag(e.touches[0].clientY);
  handle.onmousedown  = e => startDrag(e.clientY);
}

// ─── 뷰 전환 (헤더 토글) ─────────────────────────────────────────────────
function switchView(view) {
  const isMap = view === 'map';
  document.getElementById('view-map-btn').classList.toggle('active', isMap);
  document.getElementById('view-list-btn').classList.toggle('active', !isMap);

  if (isMap) {
    closeStorePanel();
    applyMapFilter();
  } else {
    openStorePanel();
  }
}

function applyMapFilter() {
  const visibleIds = new Set(getFilteredStores().map(s => s.id));
  Object.entries(overlays).forEach(([id, entry]) => {
    entry.overlay.setMap(visibleIds.has(id) ? map : null);
  });
}

function filterList(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  applyCurrentFilter();
}

let searchOpen = false;

function toggleSearch() {
  searchOpen = !searchOpen;
  const row = document.getElementById('header-search-row');
  const btn = document.getElementById('search-toggle-btn');
  const SEARCH_H = 54;
  const BASE_TOP = 62;

  row.classList.toggle('open', searchOpen);
  btn.classList.toggle('active', searchOpen);
  document.body.classList.toggle('search-open', searchOpen);

  const newTop = (BASE_TOP + (searchOpen ? SEARCH_H : 0)) + 'px';
  document.getElementById('map').style.top = newTop;
  document.getElementById('store-list-view').style.top = newTop;

  if (searchOpen) {
    setTimeout(() => document.getElementById('store-search-input').focus(), 150);
  } else {
    clearSearch();
  }
}

function searchStores(query) {
  currentSearch = query.trim();
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = currentSearch ? 'block' : 'none';
  applyCurrentFilter();
}

function applyCurrentFilter() {
  const isMapVisible = document.getElementById('map').style.display !== 'none';
  if (isMapVisible) {
    applyMapFilter();
  } else {
    renderStoreList();
  }
}

function clearSearch() {
  currentSearch = '';
  const input = document.getElementById('store-search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderStoreList();
}

function getFilteredStores() {
  const stores = Object.values(overlays).map(e => e.store);
  const keyword = currentSearch.toLowerCase();
  const catLabelsKo = { clothes: '옷', shoes: '신발', goods: '잡화', snack: '간식' };

  return stores.filter(s => {
    const matchCat  = currentFilter === 'all' || s.cat === currentFilter;
    const matchText = !keyword
      || s.name.toLowerCase().includes(keyword)
      || (catLabelsKo[s.cat] || '').includes(keyword)
      || (s.cat || '').includes(keyword)
      || (s.memo || '').toLowerCase().includes(keyword);
    return matchCat && matchText;
  });
}

function highlightText(text, keyword) {
  if (!keyword) return text;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text;
  return (
    text.slice(0, idx) +
    `<mark class="search-highlight">${text.slice(idx, idx + keyword.length)}</mark>` +
    text.slice(idx + keyword.length)
  );
}

function renderStoreList() {
  const ul = document.getElementById('store-list-ul');
  if (!ul) return;

  const filtered = getFilteredStores();

  // 패널 카운트 업데이트
  const pc = document.getElementById('panel-count');
  if (pc) pc.textContent = `${filtered.length}개`;
  filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const kw = currentSearch;

  ul.innerHTML = filtered.length === 0
    ? `<li style="text-align:center;color:#bbb;padding:40px 0;font-size:14px;">${kw ? `"${kw}" 검색 결과가 없어요` : '매장이 없어요'}</li>`
    : filtered.map(s => `
      <li class="store-item" onclick="goToStore('${s.id}')">
        <div class="store-item-header">
          <span class="store-item-name">${highlightText(s.name, kw)}</span>
          <span class="store-item-tag ${s.cat}">${catLabel[s.cat]}</span>
        </div>
        ${s.hours ? `<div class="store-item-hours">🕐 ${s.hours}</div>` : ''}
        <div class="store-item-addr">📍 ${s.addr}</div>
        ${s.memo ? `<div class="store-item-memo">💬 ${highlightText(s.memo, kw)}</div>` : ''}
      </li>`).join('');
}

function goToStore(id) {
  closeStorePanel();
  const entry = overlays[id];
  if (!entry) return;
  map.panTo(new kakao.maps.LatLng(entry.store.lat, entry.store.lng));
  map.setLevel(3);
  setTimeout(() => showPopup(id), 300);
}

// ─── 해시태그 ────────────────────────────────────────────────────────────
let selectedTags = [];

function addTag(raw) {
  const tag = raw.replace(/^#+/, '').trim();  // # 앞부분 제거, 공백 제거
  if (!tag || selectedTags.includes(tag)) return;
  selectedTags.push(tag);
  renderTagChips();
  // 추천 태그 활성화 동기화
  document.querySelectorAll('.hashtag-suggest-pill').forEach(el => {
    if (el.dataset.tag === tag) el.classList.add('active');
  });
}

function removeTag(tag) {
  selectedTags = selectedTags.filter(t => t !== tag);
  renderTagChips();
  document.querySelectorAll('.hashtag-suggest-pill').forEach(el => {
    if (el.dataset.tag === tag) el.classList.remove('active');
  });
}

function togglePresetTag(tag) {
  selectedTags.includes(tag) ? removeTag(tag) : addTag(tag);
}

function onTagKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim();
    if (val) { addTag(val); e.target.value = ''; }
  }
}

function renderTagChips() {
  const container = document.getElementById('hashtag-selected');
  if (!container) return;
  container.innerHTML = selectedTags.map(tag => `
    <span class="hashtag-chip">
      #${tag}
      <button class="hashtag-chip-remove" onclick="removeTag('${tag}')">×</button>
    </span>`).join('');
}

function resetTags() {
  selectedTags = [];
  renderTagChips();
  document.querySelectorAll('.hashtag-suggest-pill').forEach(el => el.classList.remove('active'));
  const input = document.getElementById('f-tag-input');
  if (input) input.value = '';
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
    const data = { name, addr, cat: selectedCat, memo, hours, lat, lng, tags: [...selectedTags] };
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
  resetTags();
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

  const hashtagsEl = document.getElementById('popup-hashtags');
  hashtagsEl.innerHTML = (s.tags && s.tags.length)
    ? s.tags.map(t => `<span class="popup-hashtag">#${t}</span>`).join('')
    : '';

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
  // 기존 태그 로드
  resetTags();
  (s.tags || []).forEach(tag => addTag(tag));
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
