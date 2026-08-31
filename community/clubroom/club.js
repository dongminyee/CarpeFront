(async function () {
  // [추가된 부분 1] 컨테이너를 먼저 찾고, 데이터를 가져오는 동안 뱅글뱅글 도는 로딩 UI를 띄워둡니다.
  const container = document.getElementById('scheduleGrid');

  // 로딩 중에는 잠시 flex로 바꿔서 스피너를 한가운데 정렬
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'center';
  container.style.minHeight = '300px'; // 푸터가 안 딸려 올라오게 최소 높이 보장

  // CSS 없이 JS 안에서 스피너 스타일까지 한 번에 주입 (간편함)
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; color: #888;">
        <div style="width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top: 3px solid #4032ff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span style="font-size: 0.95rem; font-weight: 600;">시간표를 불러오는 중입니다...</span>
    </div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;

  try {
    // 1) 시트 CSV 주소
    const SHEET_ID = '1WL1Tr3yVpE8gLXm5bLF3wxfguIc_uomABDJgnjTPmeA';
    const GID = '1020655765';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    // 2) CSV 가져오기
    const rows = await new Promise((resolve, reject) => {
      Papa.parse(CSV_URL, {
        download: true,
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (res) => resolve(res.data),
        error: reject
      });
    });

    // 3) 요일 헤더 줄 찾기
    const daySet = new Set(['일', '월', '화', '수', '목', '금', '토']);
    const isDayCell = (s) => {
      const t = String(s || '').trim().replace(/\s/g, '');
      return ['일', '월', '화', '수', '목', '금', '토'].some(d => t.startsWith(d));
    };

    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].map(s => String(s || '').trim());
      const dayCount = r.filter(isDayCell).length;
      if (dayCount >= 3) { headerRowIdx = i; break; }
    }
    if (headerRowIdx === -1) {
      container.innerHTML = '<div class="cell" style="color: white;">요일 헤더(일~토)를 찾지 못했습니다.</div>';
      return;
    }

    const header = rows[headerRowIdx].map(s => String(s || '').trim());

    // 4) 컬럼 인덱스 정의
    const COL_START = 0;  // A열: 시작시간
    const COL_END = 2;  // C열: 끝시간

    const dayCols = header
      .map((v, idx) => ({ v, idx }))
      .filter(o => isDayCell(o.v) && o.idx >= 3)
      .map(o => o.idx);

    // 5) 데이터 행 만들기 
    const dataRows = rows.slice(headerRowIdx + 1).map(r => r.map(s => String(s || '').trim()));

    const grid = [];
    for (const r of dataRows) {
      const start = toHHMM(r[COL_START]);
      const end = toHHMM(r[COL_END]);
      if (!start || !end) continue;

      const rowObj = { time: `${start}–${end}`, cells: [] };
      dayCols.forEach(c => rowObj.cells.push(r[c] || ''));
      grid.push(rowObj);
    }

    // ==========================================
    // [추가된 부분 2] 6) 렌더링 시작 전 로딩 스피너 지우기
    // ==========================================
    container.innerHTML = ''; // 여기서 스피너가 깨끗하게 지워집니다!
    container.style.alignItems = '';
    container.style.display = 'grid'; // 아까 flex로 바꾼 걸 원래대로(Grid) 원상복구
    container.style.gridTemplateColumns = `var(--time-width, 120px) repeat(${dayCols.length}, 1fr)`;
    // ==========================================

    // 좌상단 빈칸
    const emptyHead = document.createElement('div');
    emptyHead.className = 'cell head';
    container.appendChild(emptyHead);

    // 요일 헤더
    dayCols.forEach(idx => {
      const el = document.createElement('div');
      el.className = 'cell head';
      el.textContent = header[idx];
      container.appendChild(el);
    });

    // 본문(시간 + 각 요일 셀)
    grid.forEach(row => {
      const t = document.createElement('div');
      t.className = 'cell time';
      t.textContent = row.time;
      container.appendChild(t);

      row.cells.forEach(txt => {
        const el = document.createElement('div');
        el.className = 'cell';

        if (txt) {
          const [first, ...rest] = txt.split(/\n/);
          el.innerHTML = `<strong>${escapeHTML(first)}</strong>${rest.length ? `<div>${escapeHTML(rest.join('\n'))}</div>` : ''
            }`;

          const color = getColorForText(first.trim());
          el.style.backgroundColor = color;
        } else {
          el.classList.add('empty');
        }

        container.appendChild(el);
      });

      // 색상 생성 함수
      function getColorForText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) * 50 % 360;
        return `hsl(${hue}, 40%, 70%)`;
      }
    });

  } catch (err) {
    // [추가된 부분 3] 네트워크 에러 등으로 데이터를 못 가져왔을 때의 안전장치
    console.error("시간표 로딩 에러:", err);
    container.innerHTML = '<div style="color: #ff4d4d; padding: 50px;">시간표를 불러오는 중 오류가 발생했습니다.</div>';
  }

  // ===== 유틸 =====
  function toHHMM(raw) {
    if (!raw) return '';
    let s = String(raw).trim();
    s = s.replace(/오전/gi, 'AM').replace(/오후/gi, 'PM');

    const ampmMatch = s.match(/\b(AM|PM)\b/i);
    const ampm = ampmMatch ? ampmMatch[1].toUpperCase() : null;

    const tm = s.match(/([0-2]?\d):([0-5]\d)(?::\d{1,2})?/);
    if (!tm) return '';

    let h = parseInt(tm[1], 10);
    const m = tm[2];

    if (ampm) {
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  function escapeHTML(x) {
    return String(x).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }
})();