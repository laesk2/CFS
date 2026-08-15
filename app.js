let records = JSON.parse(localStorage.getItem('endoRecords')) || [];
let trash = JSON.parse(localStorage.getItem('endoTrash')) || [];
let currentSort = { key: 'date', order: 'desc' }; 
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

const views = document.querySelectorAll('.view');
const tabBtns = document.querySelectorAll('.tab-btn');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(btn.dataset.target).classList.add('active');
    
    if(btn.dataset.target === 'view-list') renderList();
    if(btn.dataset.target === 'view-trash') renderTrash();
  });
});

const bxOtherChk = document.getElementById('i-bx-result-other-chk');
const bxOtherTxt = document.getElementById('i-bx-result-other-txt');
bxOtherChk.addEventListener('change', (e) => {
  bxOtherTxt.style.display = e.target.checked ? 'block' : 'none';
});

// 데이터 저장 
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
  
  // 분, 초 조합
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
  bxOtherTxt.style.display = 'none';
}

function saveData() {
  localStorage.setItem('endoRecords', JSON.stringify(records));
  localStorage.setItem('endoTrash', JSON.stringify(trash));
}

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sort;
    if (currentSort.key === key) {
      currentSort.order = currentSort.order === 'desc' ? 'asc' : 'desc';
    } else {
      currentSort.key = key;
      currentSort.order = 'desc'; 
    }
    updateSortUI();
    renderList();
  });
});

function updateSortUI() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    const originalText = btn.textContent.replace(/[▼▲]/g, '').trim();
    if (btn.dataset.sort === currentSort.key) {
      btn.textContent = `${originalText} ${currentSort.order === 'desc' ? '▼' : '▲'}`;
    } else {
      btn.textContent = originalText;
    }
  });
}

function renderList() {
  const container = document.getElementById('list-container');
  container.innerHTML = '';

  let sortedRecords = [...records].sort((a, b) => {
    let valA = a[currentSort.key];
    let valB = b[currentSort.key];
    
    if (currentSort.key === 'id' || currentSort.key === 'age') {
      valA = Number(valA); valB = Number(valB);
    }
    
    let comparison = 0;
    if (valA > valB) comparison = 1;
    else if (valA < valB) comparison = -1;
    
    if (comparison === 0 && currentSort.key === 'date') {
      comparison = a.createdAt > b.createdAt ? 1 : -1;
    }

    return currentSort.order === 'desc' ? comparison * -1 : comparison;
  });

  sortedRecords.forEach(rec => {
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
    div.addEventListener('click', () => openDetail(rec, 'list'));
    container.appendChild(div);
  });
}

function renderTrash() {
  const container = document.getElementById('trash-container');
  container.innerHTML = '';
  trash.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-header">
        <span>${rec.date}</span>
        <span>${rec.name}</span>
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
  
  // 저장된 MM:SS 분리
  const timeParts = record.time ? record.time.split(':') : ['', ''];
  const minVal = timeParts[0] || '';
  const secVal = timeParts[1] || '';
  
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
      <div class="checkbox-group">
        <label><input type="checkbox" id="d-bx-Bx" value="Bx" ${bxArr.includes('Bx')?'checked':''} ${dis}> Bx</label>
        <label><input type="checkbox" id="d-bx-CSP" value="CSP" ${bxArr.includes('CSP')?'checked':''} ${dis}> CSP</label>
        <label><input type="checkbox" id="d-bx-EMR" value="EMR" ${bxArr.includes('EMR')?'checked':''} ${dis}> EMR</label>
      </div>
    </div>
    <div class="form-group"><label>조직검사 결과</label>
      <div class="checkbox-group">
        <label><input type="checkbox" id="d-res-1" value="양성" ${resArr.includes('양성')?'checked':''} ${dis}> 양성</label>
        <label><input type="checkbox" id="d-res-2" value="선종" ${resArr.includes('선종')?'checked':''} ${dis}> 선종</label>
        <label><input type="checkbox" id="d-res-3" value="암" ${resArr.includes('암')?'checked':''} ${dis}> 암</label>
        <label><input type="checkbox" id="d-res-4" value="pending" ${resArr.includes('pending')?'checked':''} ${dis}> pending</label>
        <label><input type="checkbox" id="d-res-5" value="기타" ${resArr.includes('기타')?'checked':''} ${dis}> 기타</label>
      </div>
      <input type="text" id="d-res-txt" value="${record.bxOtherTxt || ''}" style="display:${resArr.includes('기타')||isEditMode?'block':'none'}; margin-top:5px;" ${dis}>
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
          
          const bx = [];
          if(document.getElementById('d-bx-Bx').checked) bx.push('Bx');
          if(document.getElementById('d-bx-CSP').checked) bx.push('CSP');
          if(document.getElementById('d-bx-EMR').checked) bx.push('EMR');
          records[idx].bx = bx;

          const res = [];
          if(document.getElementById('d-res-1').checked) res.push('양성');
          if(document.getElementById('d-res-2').checked) res.push('선종');
          if(document.getElementById('d-res-3').checked) res.push('암');
          if(document.getElementById('d-res-4').checked) res.push('pending');
          if(document.getElementById('d-res-5').checked) res.push('기타');
          records[idx].bxResult = res;
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
          document.getElementById('btn-detail-back').click();
        }
      });
    };
    btnContainer.appendChild(btnRestore);
  }
}

document.getElementById('btn-export-excel').addEventListener('click', () => {
  if (records.length === 0) {
    alert("내보낼 데이터가 없습니다.");
    return;
  }
  
  showModal('엑셀 파일로 저장/공유하시겠습니까?', () => {
    const excelData = records.map(rec => ({
      '날짜': rec.date,
      '이름': rec.name,
      '등록번호': rec.id,
      '나이': rec.age,
      '성별': rec.gender,
      '진입성공': rec.success,
      '진입시간': rec.time,
      'ADR': rec.adr,
      '조직검사': rec.bx.join(', '),
      '결과': rec.bxResult.join(', ') + (rec.bxResult.includes('기타') ? ` (${rec.bxOtherTxt})` : ''),
      '검사소견': rec.findings,
      '비고': rec.note,
      '최초입력': formatDateString(rec.createdAt),
      '마지막수정': formatDateString(rec.updatedAt)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
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
});

updateSortUI();