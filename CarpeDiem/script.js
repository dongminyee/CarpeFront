  
  const menuBtns = document.querySelectorAll('.menu-btn');
  const hovermenu = document.getElementById('megaDropdown');
  const headerContainer = document.querySelector('header .container');
  let dropdownTimeout = null;

  menuBtns.forEach(btn => {
    btn.addEventListener('mouseenter', showDropdown);
    btn.addEventListener('focus', showDropdown);
  });
  headerContainer.addEventListener('mouseleave', hideDropdown);
  hovermenu.addEventListener('mouseleave', hideDropdown);

  hovermenu.addEventListener('mouseenter', () => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
  });

  function showDropdown() {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    hovermenu.classList.add('active');
  }
  function hideDropdown() {
    dropdownTimeout = setTimeout(() => {
      hovermenu.classList.remove('active');
    }, 120); // 0.12초 뒤에 닫힘
  }

  const clubroomBtn = document.querySelector('.dropCommu li:nth-child(2) a');
  clubroomBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // 🚨 [핵심 해결책] 비동기 작업(await)을 시작하기 전에, 목적지 주소를 미리 안전한 변수에 저장해 둡니다!
    const targetUrl = e.currentTarget.href; 
    // (또는 const targetUrl = clubroomBtn.href; 도 좋습니다)

    try {
        // 2. then 대신 await를 써서 코드를 깔끔하게 만듭니다.
        const isAuthorized = await checkEditAuth();
        console.log("권한 확인 결과:", isAuthorized);

        // 3. 권한이 있을 때(true) 이동하도록 로직 수정
        if (isAuthorized) {
            window.location.href = targetUrl; // 아까 미리 저장해 둔 주소 사용!
        } else {
            // 권한이 없을 때
            console.log("권한이 없어서 이동을 차단합니다.");
            // Swal.fire('권한이 없습니다!'); // (선택) 아까 배운 SweetAlert2 띄우기
        }
    } catch (error) {
        console.error("인증 체크 중 에러 발생:", error);
    }
});


// 로그인 상태 확인

async function checkEditAuth() {
    const accessToken = localStorage.getItem('accessToken');
    
    // 토큰 없으면 바로 로그아웃 처리
    if (accessToken==null) {
        notAuthed();
        return false;
    }

    try {
        // 1. 서버에 상태 확인 요청
        const response = await fetch('https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/api/auth/status', {
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
                if(role=="ROLE_ADMIN") return true;
                break;

            case 'TOKEN_REFRESHED':
                // [상태 2] 갱신됨 -> 로컬스토리지 갈아끼우기 + UI 업데이트
                if (result.newAccessToken) {
                    localStorage.setItem('accessToken', result.newAccessToken);
                    localStorage.setItem('refreshToken', result.refreshToken);
                    console.log("토큰이 갱신되었습니다.");
                }
                if(role=="ROLE_ADMIN") return true;
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
    Swal.fire({
        icon: 'error',
        title: '접근 권한 없음',
        text: `사용자의 게시물 접근 권한이 없음`
    });
    // 프로필 숨기고 버튼 보이기
    if(loginBtn) loginBtn.style.display = 'block'; // flex 대신 block 권장 (내부 정렬 때문)
    if(userProfile) userProfile.style.display = 'none'; 
}