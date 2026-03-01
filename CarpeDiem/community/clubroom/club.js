(async function(){
  // 1) 시트 CSV 주소
  const SHEET_ID = '1WL1Tr3yVpE8gLXm5bLF3wxfguIc_uomABDJgnjTPmeA';
  const GID      = '1020655765';
  const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

  // 2) CSV 가져오기
  const rows = await new Promise((resolve, reject)=>{
    Papa.parse(CSV_URL, {
      download: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (res)=>resolve(res.data),
      error: reject
    });
  });

  // 3) 요일 헤더 줄 찾기 (일/월/화/수/목/금/토 중 3개 이상 포함된 줄)
  const daySet = new Set(['일','월','화','수','목','금','토']);
  const isDayCell = (s)=>{
    const t = String(s||'').trim().replace(/\s/g,'');
    return ['일','월','화','수','목','금','토'].some(d=>t.startsWith(d));
  };

  let headerRowIdx = -1;
  for (let i=0; i<rows.length; i++){
    const r = rows[i].map(s=>String(s||'').trim());
    const dayCount = r.filter(isDayCell).length;
    if (dayCount >= 3){ headerRowIdx = i; break; }
  }
  if(headerRowIdx === -1){
    document.getElementById('scheduleGrid').innerHTML =
      '<div class="cell">요일 헤더(일~토)를 찾지 못했습니다.</div>';
    return;
  }

  const header = rows[headerRowIdx].map(s=>String(s||'').trim());

  // 4) 컬럼 인덱스 정의
  const COL_START = 0;  // A열: 시작시간 (예: "오전 9:00:00")
  // const COL_DASH = 1; // B열: "-" (사용 안 함)
  const COL_END   = 2;  // C열: 끝시간 (예: "오전 9:30:00")
  // 요일 칼럼: 보통 D열부터
  const dayCols = header
    .map((v,idx)=>({v,idx}))
    .filter(o => isDayCell(o.v) && o.idx >= 3)
    .map(o => o.idx);

  // 5) 데이터 행 만들기 (시간은 A,C를 합쳐 "HH:MM–HH:MM")
  const dataRows = rows.slice(headerRowIdx+1).map(r=>r.map(s=>String(s||'').trim()));

  const grid = [];
  for(const r of dataRows){
    const start = toHHMM(r[COL_START]);  // "오전 9:00:00" -> "09:00"
    const end   = toHHMM(r[COL_END]);    // "오전 9:30:00" -> "09:30"
    if(!start || !end) continue;         // 시간대 없는 행 스킵

    const rowObj = { time: `${start}–${end}`, cells: [] };
    dayCols.forEach(c => rowObj.cells.push(r[c] || ''));
    grid.push(rowObj);
  }

  // 6) 렌더링
  const container = document.getElementById('scheduleGrid');
  container.style.gridTemplateColumns = `120px repeat(${dayCols.length}, 1fr)`;

  // 좌상단 빈칸
  const emptyHead = document.createElement('div');
  emptyHead.className = 'cell head';
  container.appendChild(emptyHead);

  // 요일 헤더
  dayCols.forEach(idx=>{
    const el = document.createElement('div');
    el.className = 'cell head';
    el.textContent = header[idx];
    container.appendChild(el);
  });

  // 본문(시간 + 각 요일 셀)
  grid.forEach(row=>{
    const t = document.createElement('div');
    t.className = 'cell time';
    t.textContent = row.time;
    container.appendChild(t);

    // 기존 셀 생성 부분에서 수정
    row.cells.forEach(txt=>{
    const el = document.createElement('div');
    el.className = 'cell';

    if(txt){
        const [first, ...rest] = txt.split(/\n/);
        el.innerHTML = `<strong>${escapeHTML(first)}</strong>${
        rest.length ? `<div>${escapeHTML(rest.join('\n'))}</div>` : ''
        }`;

        // 일정 내용 기반 색상 부여
        const color = getColorForText(first.trim());
        el.style.backgroundColor = color;
    } else {
        el.classList.add('empty');
    }

    container.appendChild(el);
    });

    // 색상 생성 함수
    function getColorForText(text){
    // 같은 텍스트면 같은 색, 다른 텍스트면 다른 색
    let hash = 0;
    for(let i=0;i<text.length;i++){
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash)*50 % 360; // 0~359 범위
    return `hsl(${hue}, 40%, 70%)`;   // 파스텔톤
}
  });

  // ===== 유틸 =====
  function toHHMM(raw){
    if(!raw) return '';
    let s = String(raw).trim();
    // 오전/오후 → AM/PM 치환 (영문/국문 모두 처리)
    s = s.replace(/오전/gi,'AM').replace(/오후/gi,'PM');

    // AM/PM 추출(앞/뒤 어떤 위치든)
    const ampmMatch = s.match(/\b(AM|PM)\b/i);
    const ampm = ampmMatch ? ampmMatch[1].toUpperCase() : null;

    // 시:분[:초] 추출
    const tm = s.match(/([0-2]?\d):([0-5]\d)(?::\d{1,2})?/);
    if(!tm) return '';

    let h = parseInt(tm[1],10);
    const m = tm[2];

    if(ampm){
      if(ampm==='PM' && h < 12) h += 12;
      if(ampm==='AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2,'0')}:${m}`;
  }

  function escapeHTML(x){
    return String(x).replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
  }
})();