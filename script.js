document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. 데스크톱 메가 드롭다운 로직
  // ==========================================
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
    }, 120);
  }

  // ==========================================
  // 2. 모바일 햄버거 메뉴 애니메이션 로직
  // ==========================================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn = document.getElementById('mobile-close-btn');

  if (hamburgerBtn && mobileNav && closeBtn) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    });

    closeBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });

    // 배경 클릭 시 닫기
    mobileNav.addEventListener('click', (e) => {
      if (e.target === mobileNav) {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================
  // 3. 통합 권한 체크 로직 (데스크톱 & 모바일 모두 적용)
  // ==========================================
  // 🚨 querySelectorAll을 써서 requires-auth 클래스를 가진 모든 버튼을 잡아옵니다.
  const authRequiredBtns = document.querySelectorAll('.requires-auth');

  authRequiredBtns.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const targetUrl = e.currentTarget.href;

      try {
        const isAuthorized = await checkEditAuth();
        console.log("권한 확인 결과:", isAuthorized);

        if (isAuthorized) {
          window.location.href = targetUrl;
        } else {
          console.log("권한이 없어서 이동을 차단합니다.");
          // 권한 없을 때 모바일 메뉴가 열려있다면 닫아주는 센스!
          if (mobileNav.classList.contains('open')) {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
          }
        }
      } catch (error) {
        console.error("인증 체크 중 에러 발생:", error);
      }
    });
  });
});

// ==========================================
// 4. JWT 인증 함수 (기존 로직 유지)
// ==========================================
async function checkEditAuth() {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken == null) {
    notAuthed();
    return false;
  }

  try {
    const response = await fetch('https://carpespring.onrender.com/api/auth/status', {
      method: 'GET',
      headers: {
        'accessToken': localStorage.getItem('accessToken'),
        'refreshToken': localStorage.getItem('refreshToken'),
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    let role = result.role;

    switch (result.status) {
      case 'LOGIN_SUCCESS':
        if (role == "ROLE_ADMIN") return true;
        else {
          Swal.fire({
            icon: 'error',
            title: '접근 권한 없음',
            text: `사용자의 게시물 접근 권한이 없음`
          });
          return false;
        }

      case 'TOKEN_REFRESHED':
        if (result.newAccessToken) {
          localStorage.setItem('accessToken', result.newAccessToken);
          localStorage.setItem('refreshToken', result.refreshToken);
        }
        if (role == "ROLE_ADMIN") return true;
        else {
          Swal.fire({
            icon: 'error',
            title: '접근 권한 없음',
            text: `사용자의 게시물 접근 권한이 없음`
          });
          return false;
        }

      case 'LOGOUT_REQUIRED':
      default:
        notAuthed();
        return false;
    }
    notAuthed();
    return false;

  } catch (error) {
    console.error("인증 체크 중 서버 에러:", error);
    Swal.fire({
      icon: 'error',
      title: '로그인 실패',
      text: `인증 중 서버 에러`
    });
    return false;
  }
}

function notAuthed() {
  localStorage.clear();
  const loginBtn = document.getElementById('login-btn');
  const userProfile = document.getElementById('user-profile');
  const loginBtnMobile = document.getElementById('login-btn-mobile');
  const userProfileMobile = document.getElementById('user-profile-mobile');
  Swal.fire({
    icon: 'error',
    title: '접근 권한 없음',
    text: `사용자의 게시물 접근 권한이 없음`
  });

  if (loginBtn) loginBtn.style.display = 'block';
  if (userProfile) userProfile.style.display = 'none';
  if (loginBtnMobile) loginBtnMobile.style.display = 'block';
  if (userProfileMobile) userProfileMobile.style.display = 'none';
}