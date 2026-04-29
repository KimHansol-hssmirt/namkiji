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

function submitStore() {
  const name = document.getElementById('f-name').value.trim();
  const addr = document.getElementById('f-addr').value.trim();
  const memo = document.getElementById('f-memo').value.trim();

  if (!name) { showToast('매장명을 입력해주세요'); return; }
  if (!addr) { showToast('주소를 입력해주세요'); return; }
  if (!selectedCat) { showToast('품목을 선택해주세요'); return; }

  showToast('주소 검색 중...');

  geocoder.addressSearch(addr, async function(result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const lat = parseFloat(result[0].y);
      const lng = parseFloat(result[0].x);

      if (editingStoreId) {
        await db.collection('stores').doc(editingStoreId).update({ name, addr, cat: selectedCat, memo, lat, lng });
        map.panTo(new kakao.maps.LatLng(lat, lng));
        closeForm();
        resetForm();
        showToast('✏️ 수정됐어요!');
      } else {
        const store = {
          name, addr, cat: selectedCat, memo, lat, lng,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('stores').add(store);
        map.panTo(new kakao.maps.LatLng(lat, lng));
        closeForm();
        resetForm();
        showToast('📌 지도에 등록됐어요!');
      }
    } else {
      showToast('주소를 찾을 수 없어요. 다시 확인해주세요.');
    }
  });
}

function resetForm() {
  editingStoreId = null;
  document.getElementById('f-name').value = '';
  document.getElementById('f-addr').value = '';
  document.getElementById('f-memo').value = '';
  selectedCat = '';
  document.querySelectorAll('.cat-pill').forEach(el => el.className = 'cat-pill');
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

  document.getElementById('popup-addr').textContent = '📍 ' + s.addr;
  document.getElementById('popup-memo').textContent = s.memo ? '💬 ' + s.memo : '';

  const isDummy = dummyStores.some(d => d.id === id);
  document.getElementById('popup-actions').classList.toggle('visible', isAdmin && !isDummy);
  document.getElementById('info-popup').style.display = 'block';
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
  document.getElementById('f-name').value = s.name;
  document.getElementById('f-addr').value = s.addr;
  document.getElementById('f-memo').value = s.memo || '';
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
