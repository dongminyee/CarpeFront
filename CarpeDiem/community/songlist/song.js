(function(){
  const table = document.getElementById('coverTable');
  if(!table) return;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  const filterRow = document.getElementById('filterRow');
  const filterInputs = [...filterRow.querySelectorAll('input,select')];
  const rowsPerSel = document.getElementById('rowsPerPage');
  const pager = document.getElementById('pagination');
  const csvInput = document.getElementById('csvInput');

  let data = rowsToData();
  let filters = {};
  let sortState = { key:null, dir:1 };
  let page = 1, rowsPerPage = parseInt(rowsPerSel.value,10);

  rowsPerSel.addEventListener('change', () => {
    rowsPerPage = parseInt(rowsPerSel.value, 10) || 10; // 선택값 반영
    page = 1;                                           // 첫 페이지로 이동
    render();                                           // 다시 그리기
  });

  // ▼▼▼ 헤더 정렬: 위임 방식 (버튼 눌러도 정렬 안 걸리게 예외 처리)
  thead.addEventListener('click', (e)=>{
      // 필터 토글 버튼 클릭은 정렬 무시
    const th = e.target.closest('th');               // 클릭된 곳의 th 찾기
    if(!th || !th.dataset.key) return;
    const key = th.dataset.key;

    if (sortState.key === key) sortState.dir *= -1;
    else { sortState.key = key; sortState.dir = 1; }

    // asc/desc 클래스 표시
    thead.querySelectorAll('th').forEach(h=>h.classList.remove('asc','desc'));
    th.classList.add(sortState.dir===1 ? 'asc' : 'desc');

    render();
  });

  searchToggle.addEventListener('click', ()=>{
    const isOpen = filterRow.style.display !== 'none';
    filterRow.style.display = isOpen ? 'none' : 'table-row';
    if (!isOpen) filterInputs[0]?.focus();
  });

  filterInputs.forEach(inp=>{
    const apply = ()=>{
      filters[inp.dataset.col] = inp.value.trim();
      page = 1;
      render();
    };
    inp.addEventListener('input', apply);
    inp.addEventListener('change', apply);
  });

  // ------- 나머지 기존 로직(필터/페이지/CSV/렌더)은 그대로 두세요 -------
  // (아래 함수들은 기존 코드와 동일)
  function rowsToData(){
    return [...tbody.querySelectorAll('tr')].map(tr=>{
      const a = tr.querySelector('a.thumb');
      const img = tr.querySelector('a.thumb img');
      return {
        thumbHref: a?.href || '#',
        thumbImg: img?.src || '',
        title: tr.querySelector('td[data-key="title"]')?.textContent.trim() || '',
        artist: tr.querySelector('td[data-key="artist"]')?.textContent.trim() || '',
        gen: tr.querySelector('td[data-key="gen"]')?.textContent.trim() || '',
        stage: tr.querySelector('td[data-key="stage"]')?.textContent.trim() || '',
        year: tr.querySelector('td[data-key="year"]')?.textContent.trim() || ''
      };
    });
  }

  function applyFilters(list){
    return list.filter(row=>{
      return Object.entries(filters).every(([k, val])=>{
        if(!val) return true;
        const hay = (row[k]||'').toLowerCase();
        return hay.includes(val.toLowerCase());
      });
    });
  }

  function applySort(list){
    const {key, dir} = sortState;
    if(!key) return list;
    const type = table.querySelector(`thead th[data-key="${key}"]`)?.dataset.type || 'text';
    const cmp = (a,b)=>{
      const va=a[key]||'', vb=b[key]||'';
      if(type==='number'){
        const na=Number(va)||0, nb=Number(vb)||0;
        return (na-nb)*dir;
      }else{
        return va.localeCompare(vb, 'ko', {numeric:true})*dir;
      }
    };
    return [...list].sort(cmp);
  }

  function paginate(list){
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / rowsPerPage));
    if(page>pages) page=pages;
    const start = (page-1)*rowsPerPage;
    const slice = list.slice(start, start+rowsPerPage);
    drawPager(pages);
    return slice;
  }

  function drawPager(pages){
    pager.innerHTML = '';
    if(pages<=1) return;
    const mk = (txt, disabled, act, onClick)=>{
      const b = document.createElement('button');
      b.textContent = txt;
      if(disabled) b.disabled = true;
      if(act) b.classList.add('active');
      b.addEventListener('click', onClick);
      pager.appendChild(b);
    };
    mk('‹', page===1, false, ()=>{ page=Math.max(1,page-1); render(); });
    for(let i=1;i<=pages;i++){
      mk(String(i), false, i===page, ()=>{ page=i; render(); });
    }
    mk('›', page===pages, false, ()=>{ page=Math.min(pages,page+1); render(); });
  }

  function buildRow(row){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <a class="thumb" href="${row.thumbHref}" target="_blank" rel="noopener">
          <img src="${row.thumbImg}" alt="${escapeHTML(row.title)} 썸네일">
          <span class="play">▶</span>
        </a>
      </td>
      <td data-key="title">${escapeHTML(row.title)}</td>
      <td data-key="artist">${escapeHTML(row.artist)}</td>
      <td data-key="gen">${escapeHTML(row.gen)}</td>
      <td data-key="stage">${escapeHTML(row.stage)}</td>
      <td data-key="year">${escapeHTML(row.year)}</td>
    `;
    return tr;
  }
  function escapeHTML(s){ return (s??'').replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }

  function render(rebuildFilters=false){
    let list = applyFilters(data);
    list = applySort(list);
    const pageRows = paginate(list);
    tbody.innerHTML = '';
    pageRows.forEach(r=>tbody.appendChild(buildRow(r)));
    if(rebuildFilters){ /* 키/연도 select 갱신 함수 호출하던 분이면 여기에 */ }
  }

  // 초기 렌더
  render(true);

  // 필터/CSV/행수 변경 이벤트 등 기존 코드 유지…
})();