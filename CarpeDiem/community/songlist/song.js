const table = document.getElementById('coverTable');
const thead = table.querySelector('thead');
const tbody = table.querySelector('tbody');
const rowsPerSel = document.getElementById('rowsPerPage');
const pager = document.getElementById('pagination');
const csvInput = document.getElementById('csvInput');

const API_BASE = 'http://localhost:8080/api/song';

let filters = {};
let sortState = { key: "publishedAt", dir: 1 };
let page = 0, rowsPerPage = parseInt(rowsPerSel.value, 10);

rowsPerSel.addEventListener('change', () => {
  rowsPerPage = parseInt(rowsPerSel.value, 10) || 10; // 선택값 반영
  page = 0;                                           // 첫 페이지로 이동
  fetchSongs(0);                                  // 다시 그리기
});

// ▼▼▼ 헤더 정렬: 위임 방식 (버튼 눌러도 정렬 안 걸리게 예외 처리)
thead.addEventListener('click', (e) => {
  // 필터 토글 버튼 클릭은 정렬 무시
  const th = e.target.closest('th');               // 클릭된 곳의 th 찾기
  if (!th || !th.dataset.key) return;
  const key = th.dataset.key;

  if (sortState.key === key) sortState.dir *= -1;
  else { sortState.key = key; sortState.dir = 1; }

  // asc/desc 클래스 표시
  thead.querySelectorAll('th').forEach(h => h.classList.remove('asc', 'desc'));
  th.classList.add(sortState.dir === 1 ? 'desc' : 'asc');

  //render();
  fetchSongs(0);
});

// 로그인 상태 확인

async function checkEditAuth() {
  const accessToken = localStorage.getItem('accessToken');

  // 토큰 없으면 바로 로그아웃 처리
  if (accessToken == null) {
    notAuthed();
    return false;
  }

  try {
    // 1. 서버에 상태 확인 요청
    const response = await fetch('http://localhost:8080/api/auth/status', {
      method: 'GET',
      headers: {
        'accessToken': localStorage.getItem('accessToken'),
        'refreshToken': localStorage.getItem('refreshToken'),
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log("인증 상태:", result.status);
    let role = result.role;
    console.log(role);

    // 2. 상태별 분기 처리 (Switch-Case)
    switch (result.status) {
      case 'LOGIN_SUCCESS':
        // [상태 1] 정상 -> UI만 업데이트
        if (role == "ROLE_ADMIN") return true;
        else return false;
        break;

      case 'TOKEN_REFRESHED':
        // [상태 2] 갱신됨 -> 로컬스토리지 갈아끼우기 + UI 업데이트
        if (result.newAccessToken) {
          localStorage.setItem('accessToken', result.newAccessToken);
          localStorage.setItem('refreshToken', result.refreshToken);
          console.log("토큰이 갱신되었습니다.");
        }
        if (role == "ROLE_ADMIN") return true;
        else return false;
        break;

      case 'LOGOUT_REQUIRED':
      default:
        // [상태 3] 만료/비정상 -> 데이터 날리고 로그아웃 화면
        notAuthed();
        return false;
        break;
    }
    notAuthed();
    return false;

  } catch (error) {
    console.error("인증 체크 중 서버 에러:", error);
    Swal.fire({
      icon: 'error',
      title: '로그인 실패',
      text: `인증 중 서버 에러`
    }); // 에러 나면 안전하게 로그아웃
    return false;
  }
}

function notAuthed() {
  // 저장소 비우기
  localStorage.clear();
  const loginBtn = document.getElementById('login-btn');
  const userProfile = document.getElementById('user-profile');
  // 프로필 숨기고 버튼 보이기
  if (loginBtn) loginBtn.style.display = 'block'; // flex 대신 block 권장 (내부 정렬 때문)
  if (userProfile) userProfile.style.display = 'none';
}

// ------- 나머지 기존 로직(필터/페이지/CSV/렌더)은 그대로 두세요 -------
// (아래 함수들은 기존 코드와 동일)

async function fetchSongs(nextPage) {
  page = nextPage
  const keyword = document.getElementById('keyword').value.trim();
  const params = new URLSearchParams({
    page,
    size: rowsPerPage,
    sort: sortState.key,
    direction: (sortState.dir == 1 ? 'desc' : 'asc'),
    ...(keyword && { keyword })
  });

  const isAdmin = await checkEditAuth();
  console.log(isAdmin);
  const additive = isAdmin ? "&auth=admin" : "&auth=user";
  const response = await fetch(`${API_BASE}/get?${params}` + additive);
  console.log(`${API_BASE}/get?${params}` + additive);
  const data = await response.json();
  console.log(data);

  renderTable(data.content, isAdmin);
  renderPagination(data.number, data.totalPages);
  document.getElementById('info').textContent = `총 ${data.totalElements}개`;
}

// 테이블 렌더링
function renderTable(songs, isAdmin) {
  const tb = document.getElementById('song-list');
  if (songs.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#aaa;">검색 결과가 없습니다</td></tr>';
    return;
  }
  tb.innerHTML = songs.map(song => `
    <tr>
      <td>
        <a class="thumb" href="https://www.youtube.com/watch?v=${song.videoId}" target="_blank" rel="noopener">
          <img src="${song.thumbnailUrl}" alt="${song.title}"><span class="play">▶</span>
        </a>
      </td>
      <td data-key="title">${song.title}</td>
      <td data-key="artist">${song.artist}</td>
      <td data-key="gen">${song.generation}</td>
      <td data-key="stage">${song.concert}</td>
      <td data-key="year">${song.date}</td>`
    + (isAdmin ? `
      <td class="action-col">
        <button class="btn-edit" onclick="editSong(this, '${song.videoId}')">수정</button>
      </td>`: "")
    + `
    </tr>
  `).join('');
}

// 페이지네이션 렌더링
function renderPagination(current, total) {
  const container = document.getElementById('pagination');
  if (total <= 1) { container.innerHTML = ''; return; }

  let html = `<button ${current === 0 ? 'disabled' : ''}
    onclick="fetchSongs(${current - 1})">이전</button>`;

  // 현재 페이지 주변 5개만 표시
  const start = Math.max(0, current - 2);
  const end = Math.min(total - 1, current + 2);

  for (let i = start; i <= end; i++) {
    html += `<button class="${i === current ? 'active' : ''}"
      onclick="fetchSongs(${i})">${i + 1}</button>`;
  }

  html += `<button ${current === total - 1 ? 'disabled' : ''}
    onclick="fetchSongs(${current + 1})">다음</button>`;

  container.innerHTML = html;
}



// 엔터키 검색
document.getElementById('keyword').addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchSongs(0);
});

async function editSong(buttonElement, videoId) {
  console.log('수정 요청, ID:', videoId);
  // 예: 수정 팝업 띄우기 또는 수정 페이지로 이동
  // Swal.fire(...) 등을 사용해서 제목 수정 입력창을 띄울 수 있습니다.

  const tr = buttonElement.closest('tr');

  const title = tr.querySelector('[data-key="title"]').innerText;
  const artist = tr.querySelector('[data-key="artist"]').innerText;
  const generation = tr.querySelector('[data-key="gen"]').innerText;
  const concert = tr.querySelector('[data-key="stage"]').innerText;
  const year = tr.querySelector('[data-key="year"]').innerText;

  Swal.fire({
    title: '노래 정보 수정',
    html: `
            <div class="edit-form-container">
              <label for="edit-input-title">곡 제목</label>
              <input id="edit-input-title" class="swal2-input" value="${title}">

              <label for="edit-input-artist">아티스트</label>
              <input id="edit-input-artist" class="swal2-input" value="${artist}">

              <label for="edit-input-generation">기수</label>
              <input id="edit-input-generation" class="swal2-input" value="${generation}">

              <label for="edit-input-concert">공연</label>
              <input id="edit-input-concert" class="swal2-input" value="${concert}">

              <label for="edit-input-year">연도</label>
              <input id="edit-input-year" class="swal2-input" value="${year}">

              <label for="editStatus">공개 상태</label>
              <select id="edit-input-status" class="swal2-select custom-select">
                <option value="PENDING">검토 대기 (Pending)</option>
                <option value="PUBLISHED">전체 공개 (Published)</option>
                <option value="HIDDEN">숨김 처리 (Hidden)</option>
              </select>
            </div>
       `,
    focusConfirm: false,
    showCancelButton: true,
    cancelButtonText: '취소',
    preConfirm: () => {
      const inputConcert = document.getElementById('edit-input-concert').value;
      const inputTitle = document.getElementById('edit-input-title').value;
      const inputArtist = document.getElementById('edit-input-artist').value;
      const inputGeneration = document.getElementById('edit-input-generation').value;
      const inputDate = document.getElementById('edit-input-year').value;
      const inputStatus = document.getElementById('edit-input-status').value;


      if (!inputTitle || !inputArtist || !inputGeneration || !inputDate || !inputStatus || !inputConcert) {
        Swal.showValidationMessage('값을 모두 입력해주세요.');
        return false;
      }

      return {
        videoId: videoId, title: inputTitle, artist: inputArtist, generation: inputGeneration,
        concert: inputConcert, date: inputDate, status: inputStatus
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const data = result.value;

      const params = new URLSearchParams({
        videoId: data.videoId,
        title: data.title,
        artist: data.artist,
        generation: data.generation,
        concert: data.concert,
        date: data.date,
        status: data.status
      })
      fetch(`http://localhost:8080/api/song/patch?${params.toString()}`, {
        method: 'PATCH'
      })
        .then(response => {
          if (response.ok) {
            Swal.fire('수정 완료', `${data.title}`, 'success');
            fetchSongs(page);
          } else {
            Swal.fire('수정 실패', '등록 중 오류가 발생했습니다.', 'error');
          }
        });
    }

  });
}

fetchSongs(0);