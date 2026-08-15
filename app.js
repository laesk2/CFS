let records = JSON.parse(localStorage.getItem('endoRecords')) || [];
let trash = JSON.parse(localStorage.getItem('endoTrash')) || [];

let listSort = { key: 'date', order: 'desc' }; 
let trashSort = { key: 'date', order: 'desc' }; 

let currentDetailId = null;
let isEditMode = false;

const modal = document.getElementById('modal-overlay');
const modalMsg = document.getElementById('modal-msg');
const btnYes = document.getElementById('modal-btn-yes');
const btnNo = document.getElementById('modal-btn-no');

function showModal(message, onYes) {
  modalMsg.textContent = message;
  modal.style.display = 'flex';
  
  const newYes = btnYes.cloneNode(true);
  const newNo = btnNo.cloneNode(true);
  btnYes.parentNode.replaceChild(newYes, btnYes);
  btnNo.parentNode.replaceChild(newNo, btnNo);
  
  newYes.addEventListener('click', () => {
    modal.style.display = 'none';
    onYes();
  });
  
  newNo.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

function getTodayDateString() {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kst.toISOString().split('T')[0];
}

const views = document.querySelectorAll('.view');
const tabBtns = document.querySelectorAll('.tab-btn');

function switchTab(targetId) {
  tabBtns.forEach(btn => {
    if(btn.dataset.target === targetId) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  views.forEach(v => v.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
  
  if(targetId === 'view-list') renderList();
  if(targetId === 'view-trash') renderTrash();
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.target);
  });
});

const bxOtherChk = document.getElementById('i-res-5');
const bxOtherTxt = document.getElementById('i-bx-result-other-txt');
bxOtherChk.addEventListener('change', (e) => {
  bxOtherTxt.style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('btn-submit').addEventListener('click', () => {
  const date = document.getElementById('i-date').value;
  const name = document.getElementById('i-name').value;
  const id = document.getElementById('i-id').value;
  const age = document.getElementById('i-age').value;
  
  if(!date || !name || !id || !age) {
    alert("날짜, 이름, 등록번호, 나이는 필수입니다.");
    return;
  }

  const genderEl = document.querySelector('input[name="i-gender"]:checked');
  const successEl = document.querySelector('input[name="i-success"]:checked');
  const adrEl = document.querySelector('input[name="i-adr"]:checked');
  
  const tMin = document.getElementById('i-time-min').value;
  const tSec = document.getElementById('i-time-sec').value;
  const formattedTime = (tMin || tSec) ? `${tMin || '0'}:${(tSec || '0').padStart(2, '0')}` : '';
  
  const bxSelected = Array.from(document.querySelectorAll('input[name="i-bx"]:checked')).map(el => el.value);
  const resultSelected = Array.from(document.querySelectorAll('input[name="i-bx-result"]:checked')).map(el => el.value);
  
  const now = new Date().toISOString();

  const newRecord = {
    uid: Date.now().toString(),
    date: date,
    name: name,
    id: id,
    age: age,
    gender: genderEl ? genderEl.value : '',
    success: successEl ? successEl.value : 'Y',
    time: formattedTime,
    adr: adrEl ? adrEl.value : '',
    bx: bxSelected,
    bxResult: resultSelected,
    bxOtherTxt: document.getElementById('i-bx-result-other-txt').value,
    findings: document.getElementById('i-findings').value,
    note: document.getElementById('i-note').value,
    createdAt: now,
    updatedAt: now
  };

  records.push(newRecord);
  saveData();
  resetForm();
  alert("저장되었습니다.");
});

document.getElementById('btn-reset').addEventListener('click', () => {
  showModal('초기화 하시겠습니까?', resetForm);
});

function resetForm() {
  document.getElementById('record-form').reset();
  document.getElementById('i-date').value = getTodayDateString();
  document.getElementById('i-time-sec').value = "0";
  bxOtherTxt.style.display = 'none';
}

function saveData() {
  localStorage.setItem('endoRecords', JSON.stringify(records));
  localStorage.setItem('endoTrash', JSON.stringify(trash));
}

// === 휴지통 비우기 로직 유지 ===
document.getElementById('btn-empty-trash').addEventListener('click', () => {
  if (trash.length === 0) {
    alert("휴지통이 이미 비어 있습니다.");
    return;
  }
  showModal('휴지통을 비우시겠습니까?', () => {
    trash = []; 
    saveData();
    renderTrash();
  });
});

document.querySelectorAll('#list-sort-bar .sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sort;
    if (listSort.key === key) {
      listSort.order = listSort.order === 'desc' ? 'asc' : 'desc';
    } else {
      listSort.key = key;
      listSort.order = 'desc'; 
    }
    updateSortUI('list-sort-bar', listSort);
    renderList();
  });
});

document.querySelectorAll('#trash-sort-bar .sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sort;
    if (trashSort.key === key) {
      trashSort.order = trashSort.order === 'desc' ? 'asc' : 'desc';
    } else {
      trashSort.key = key;
      trashSort.order = 'desc'; 
    }
    updateSortUI('trash-sort-bar', trashSort);
    renderTrash();
  });
});

function updateSortUI(barId, sortObj) {
  document.querySelectorAll(`#${barId} .sort-btn`).forEach(btn => {
    const originalText = btn.textContent.replace(/[▼▲]/g, '').trim();
    if (btn.dataset.sort === sortObj.key) {
      btn.textContent = `${originalText} ${sortObj.order === 'desc' ? '▼' : '▲'}`;
    } else {
      btn.textContent = originalText;
    }
  });
}

function sortData(dataArray, sortObj) {
  return [...dataArray].sort((a, b) => {
    let valA = a[sortObj.key];
    let valB = b[sortObj.key];
    
    if (sortObj.key === 'id' || sortObj.key === 'age') {
      valA = Number(valA); valB = Number(valB);
    }
    
    let comparison = 0;
    if (valA > valB) comparison = 1;
    else if (valA < valB) comparison = -1;
    
    if (comparison === 0 && sortObj.key === 'date') {
      comparison = a.createdAt > b.createdAt ? 1 : -1;
    }

    return sortObj.order === 'desc' ? comparison * -1 : comparison;
  });
}

function renderList() {
  const container = document.getElementById('list-container');
  container.innerHTML = '';

  const adrTargetRecords = records.filter(r => r.adr === 'Y');
  let adrText = "ADR --%";
  
  if (adrTargetRecords.length > 0) {
    const adrPositiveRecords = adrTargetRecords.filter(r => 
      r.bxResult && (r.bxResult.includes('선종') || r.bxResult.includes('암'))
    );
    const adrRate = (adrPositiveRecords.length / adrTargetRecords.length) * 100;
    adrText = `ADR ${adrRate.toFixed(1)}%`;
  }
  document.getElementById('adr-display').textContent = adrText;

  const sortedRecords = sortData(records, listSort);

  sortedRecords.forEach(rec => {
    let resBadge = '';
    // 목록 표시에서 ADR 뱃지는 제외하고 조직검사 결과 뱃지만 표시
    if (rec.bxResult && rec.bxResult.length > 0) {
      if (rec.bxResult.includes('암')) {
        resBadge = `<span class="badge badge-res-cancer">암</span>`;
      } else if (rec.bxResult.includes('선종')) {
        resBadge = `<span class="badge badge-res-adenoma">선종</span>`;
      } else if (rec.bxResult.includes('pending')) {
        resBadge = `<span class="badge badge-res-pending">pending</span>`;
      }
    }

    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-header">
        <span>${rec.date}</span>
        <span>${rec.name} (${rec.gender || '-'})</span>
      </div>
      <div class="list-item-body">
        <span>ID: ${rec.id} | 나이: ${rec.age}</span>
        <div style="margin-left: auto;">
          ${resBadge}
        </div>
      </div>
    `;
    div.addEventListener('click', () => openDetail(rec, 'list'));
    container.appendChild(div);
  });
}

function renderTrash() {
  const container = document.getElementById('trash-container');
  container.innerHTML = '';

  const sortedTrash = sortData(trash, trashSort);

  sortedTrash.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-header">
        <span>${rec.date}</span>
        <span>${rec.name} (${rec.gender || '-'})</span>
      </div>
      <div class="list-item-body">
        등록번호: ${rec.id} | 나이: ${rec.age}
      </div>
    `;
    div.addEventListener('click', () => openDetail(rec, 'trash'));
    container.appendChild(div);
  });
}

const viewDetail = document.getElementById('view-detail');
const detailContentArea = document.getElementById('detail-content-area');

document.getElementById('btn-detail-back').addEventListener('click', () => {
  viewDetail.classList.remove('active');
  isEditMode = false;
  renderList();
  renderTrash();
});

function formatDateString(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function openDetail(record, source) {
  currentDetailId = record.uid;
  isEditMode = false;
  
  document.getElementById('detail-title').textContent = source === 'list' ? '상세 보기' : '휴지통 (읽기 전용)';
  document.getElementById('d-created-at').textContent = `최초 저장: ${formatDateString(record.createdAt)}`;
  document.getElementById('d-updated-at').textContent = `마지막 수정: ${formatDateString(record.updatedAt)}`;
  
  renderDetailForm(record);
  setDetailButtons(source);
  viewDetail.classList.add('active');
}

function renderDetailForm(record) {
  const dis = isEditMode ? '' : 'disabled';
  
  const bxArr = record.bx || [];
  const resArr = record.bxResult || [];
  
  const timeParts = record.time ? record.time.split(':') : ['', ''];
  const minVal = timeParts[0] || '';
  const secVal = timeParts[1] || '0'; 
  
  detailContentArea.innerHTML = `
    <div class="form-group"><label>날짜</label><input type="date" id="d-date" value="${record.date}" ${dis}></div>
    <div class="form-group"><label>이름</label><input type="text" id="d-name" value="${record.name}" ${dis}></div>
    <div class="form-group"><label>등록번호</label><input type="number" id="d-id" value="${record.id}" ${dis}></div>
    <div class="form-group"><label>나이</label><input type="number" id="d-age" value="${record.age}" ${dis}></div>
    <div class="form-group"><label>성별</label>
      <div class="radio-group">
        <input type="radio" id="d-g-m" name="d-gender" value="M" ${record.gender==='M'?'checked':''} ${dis}>
        <label for="d-g-m">M</label>
        <input type="radio" id="d-g-f" name="d-gender" value="F" ${record.gender==='F'?'checked':''} ${dis}>
        <label for="d-g-f">F</label>
      </div>
    </div>
    <div class="form-group"><label>진입 성공 여부</label>
      <div class="radio-group">
        <input type="radio" id="d-s-y" name="d-success" value="Y" ${record.success==='Y'?'checked':''} ${dis}>
        <label for="d-s-y">Y</label>
        <input type="radio" id="d-s-n" name="d-success" value="N" ${record.success==='N'?'checked':''} ${dis}>
        <label for="d-s-n">N</label>
      </div>
    </div>
    <div class="form-group"><label>진입 시간</label>
      <div class="time-input-group">
        <input type="number" id="d-time-min" value="${minVal}" min="0" placeholder="분" ${dis}><span>분</span>
        <input type="number" id="d-time-sec" value="${secVal}" min="0" max="59" placeholder="초" ${dis}><span>초</span>
      </div>
    </div>
    <div class="form-group"><label>ADR 포함 여부</label>
      <div class="radio-group">
        <input type="radio" id="d-a-y" name="d-adr" value="Y" ${record.adr==='Y'?'checked':''} ${dis}>
        <label for="d-a-y">Y</label>
        <input type="radio" id="d-a-n" name="d-adr" value="N" ${record.adr==='N'?'checked':''} ${dis}>
        <label for="d-a-n">N</label>
      </div>
    </div>
    <div class="form-group"><label>조직검사 시행 여부</label>
      <div class="multi-btn-group">
        <input type="checkbox" id="d-bx-1" name="d-bx" value="Bx" ${bxArr.includes('Bx')?'checked':''} ${dis}>
        <label for="d-bx-1">Bx</label>
        <input type="checkbox" id="d-bx-2" name="d-bx" value="CSP" ${bxArr.includes('CSP')?'checked':''} ${dis}>
        <label for="d-bx-2">CSP</label>
        <input type="checkbox" id="d-bx-3" name="d-bx" value="EMR" ${bxArr.includes('EMR')?'checked':''} ${dis}>
        <label for="d-bx-3">EMR</label>
      </div>
    </div>
    <div class="form-group"><label>조직검사 결과</label>
      <div class="multi-btn-group">
        <input type="checkbox" id="d-res-1" name="d-bx-result" value="양성" ${resArr.includes('양성')?'checked':''} ${dis}>
        <label for="d-res-1">양성</label>
        <input type="checkbox" id="d-res-2" name="d-bx-result" value="선종" ${resArr.includes('선종')?'checked':''} ${dis}>
        <label for="d-res-2">선종</label>
        <input type="checkbox" id="d-res-3" name="d-bx-result" value="암" ${resArr.includes('암')?'checked':''} ${dis}>
        <label for="d-res-3">암</label>
        <input type="checkbox" id="d-res-4" name="d-bx-result" value="pending" ${resArr.includes('pending')?'checked':''} ${dis}>
        <label for="d-res-4">pending</label>
        <input type="checkbox" id="d-res-5" name="d-bx-result" value="기타" ${resArr.includes('기타')?'checked':''} ${dis}>
        <label for="d-res-5">기타</label>
      </div>
      <input type="text" id="d-res-txt" value="${record.bxOtherTxt || ''}" style="display:${resArr.includes('기타')||isEditMode?'block':'none'}; margin-top:10px;" ${dis}>
    </div>
    <div class="form-group"><label>검사소견</label><textarea id="d-findings" rows="3" ${dis}>${record.findings}</textarea></div>
    <div class="form-group"><label>비고</label><textarea id="d-note" rows="2" ${dis}>${record.note}</textarea></div>
  `;
  
  if(isEditMode) {
    document.getElementById('d-res-5').addEventListener('change', (e) => {
      document.getElementById('d-res-txt').style.display = e.target.checked ? 'block' : 'none';
    });
  }
}

function setDetailButtons(source) {
  const btnContainer = document.getElementById('detail-action-buttons');
  btnContainer.innerHTML = '';

  if (source === 'list') {
    if (!isEditMode) {
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-edit';
      btnEdit.textContent = '수정하기';
      btnEdit.onclick = () => {
        showModal('수정하시겠습니까?', () => {
          isEditMode = true;
          const targetRec = records.find(r => r.uid === currentDetailId);
          renderDetailForm(targetRec);
          setDetailButtons('list');
        });
      };

      const btnDel = document.createElement('button');
      btnDel.className = 'btn-delete';
      btnDel.textContent = '삭제하기';
      btnDel.onclick = () => {
        showModal('삭제하시겠습니까?', () => {
          const idx = records.findIndex(r => r.uid === currentDetailId);
          if (idx > -1) {
            trash.push(records[idx]);
            records.splice(idx, 1);
            saveData();
            document.getElementById('btn-detail-back').click();
          }
        });
      };

      btnContainer.appendChild(btnEdit);
      btnContainer.appendChild(btnDel);
    } else {
      const btnSave = document.createElement('button');
      btnSave.className = 'btn-primary';
      btnSave.textContent = '수정완료';
      btnSave.onclick = () => {
        const idx = records.findIndex(r => r.uid === currentDetailId);
        if (idx > -1) {
          records[idx].date = document.getElementById('d-date').value;
          records[idx].name = document.getElementById('d-name').value;
          records[idx].id = document.getElementById('d-id').value;
          records[idx].age = document.getElementById('d-age').value;
          
          records[idx].gender = document.querySelector('input[name="d-gender"]:checked')?.value || '';
          records[idx].success = document.querySelector('input[name="d-success"]:checked')?.value || 'Y';
          
          const dMin = document.getElementById('d-time-min').value;
          const dSec = document.getElementById('d-time-sec').value;
          records[idx].time = (dMin || dSec) ? `${dMin || '0'}:${(dSec || '0').padStart(2, '0')}` : '';
          
          records[idx].adr = document.querySelector('input[name="d-adr"]:checked')?.value || '';
          
          records[idx].bx = Array.from(document.querySelectorAll('input[name="d-bx"]:checked')).map(el => el.value);
          records[idx].bxResult = Array.from(document.querySelectorAll('input[name="d-bx-result"]:checked')).map(el => el.value);
          records[idx].bxOtherTxt = document.getElementById('d-res-txt').value;

          records[idx].findings = document.getElementById('d-findings').value;
          records[idx].note = document.getElementById('d-note').value;
          records[idx].updatedAt = new Date().toISOString();

          saveData();
          isEditMode = false;
          document.getElementById('d-updated-at').textContent = `마지막 수정: ${formatDateString(records[idx].updatedAt)}`;
          renderDetailForm(records[idx]);
          setDetailButtons('list');
          alert('수정되었습니다.');
        }
      };
      btnContainer.appendChild(btnSave);
    }
  } else if (source === 'trash') {
    const btnRestore = document.createElement('button');
    btnRestore.className = 'btn-primary';
    btnRestore.textContent = '복구';
    btnRestore.onclick = () => {
      showModal('복구하시겠습니까?', () => {
        const idx = trash.findIndex(r => r.uid === currentDetailId);
        if (idx > -1) {
          records.push(trash[idx]);
          trash.splice(idx, 1);
          saveData();
          
          viewDetail.classList.remove('active');
          isEditMode = false;
          switchTab('view-list'); 
        }
      });
    };
    btnContainer.appendChild(btnRestore);
  }
}

function exportToExcel() {
  if (records.length === 0) {
    alert("내보낼 데이터가 없습니다.");
    return;
  }
  
  showModal('엑셀 파일로 저장/공유하시겠습니까?', () => {
    const excelData = records.map(rec => {
      const resultString = rec.bxResult.join(', ') + (rec.bxResult.includes('기타') ? ` (${rec.bxOtherTxt})` : '');
      return {
        '날짜': rec.date,
        '이름': rec.name,
        '등록번호': rec.id,
        '나이': rec.age,
        '성별': rec.gender,
        '진입성공': rec.success,
        '진입시간': rec.time,
        'ADR': rec.adr,
        '조직검사': rec.bx.join(', '),
        '결과': resultString,
        '검사소견': rec.findings,
        '비고': rec.note,
        '최초입력': formatDateString(rec.createdAt),
        '마지막수정': formatDateString(rec.updatedAt)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = {c: C, r: R};
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = worksheet[cell_ref];

        if (cell && cell.v) {
          const val = cell.v.toString();
          if (val.includes('암') || val.includes('선종')) {
            cell.s = { font: { color: { rgb: "FF0000" } } };
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "내시경기록");
    
    const fileName = `내시경기록_${new Date().toISOString().split('T')[0]}.xlsx`;

    try {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const file = new File([blob], fileName, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: '내시경 기록 데이터'
        }).catch(err => console.log("공유 취소됨:", err));
      } else {
        XLSX.writeFile(workbook, fileName);
      }
    } catch (e) {
      alert("엑셀 생성 중 오류가 발생했습니다: " + e.message);
    }
  });
}

document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
document.getElementById('btn-export-excel-input').addEventListener('click', exportToExcel);

updateSortUI('list-sort-bar', listSort);
updateSortUI('trash-sort-bar', trashSort);
document.getElementById('i-date').value = getTodayDateString();
document.getElementById('i-time-sec').value = "0";