//login 성공 message가 왔을 때 localStorag 토큰 저장 후 홈화면으로 이동하기
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        const data = event.data.payload;
        console.log("로그인 성공 신호 수신:", data);

        // 토큰 및 정보 저장
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userPicture', data.picture);
        localStorage.setItem('email', data.username);

        window.location.replace('/CarpeDiem/index.html');

        // UI 즉시 업데이트
        //updateProfileUI(data.name, data.picture);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndUI();
});

async function checkAuthAndUI() {
    const accessToken = localStorage.getItem('accessToken');

    // 토큰 없으면 바로 로그아웃 처리
    if (accessToken == null) {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn.style.display == 'none') logout();
        return;
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

        // 2. 상태별 분기 처리 (Switch-Case)
        switch (result.status) {
            case 'LOGIN_SUCCESS':
                // [상태 1] 정상 -> UI만 업데이트
                updateLoginUI();
                break;

            case 'TOKEN_REFRESHED':
                // [상태 2] 갱신됨 -> 로컬스토리지 갈아끼우기 + UI 업데이트
                if (result.newAccessToken) {
                    localStorage.setItem('accessToken', result.newAccessToken);
                    localStorage.setItem('refreshToken', result.newRefreshToken);
                    console.log("토큰이 갱신되었습니다.");
                }
                updateLoginUI();
                break;

            case 'LOGOUT_REQUIRED':
            default:
                // [상태 3] 만료/비정상 -> 데이터 날리고 로그아웃 화면
                logout();
                break;
        }

    } catch (error) {
        console.error("인증 체크 중 서버 에러:", error);
        logout(); // 에러 나면 안전하게 로그아웃
    }
}

function updateLoginUI() {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');

    // 버튼 숨기고 프로필 보이기
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'flex';
        document.getElementById('profile-name').textContent = localStorage.getItem("userName");
        document.getElementById('profile-img').src = localStorage.getItem("userPicture");
    }
}

async function logout() {
    // 저장소 비우기
    await fetch('http://localhost:8080/api/auth/logout', {
        method: 'DELETE',
        headers: {
            'username': localStorage.getItem('email'),
            'Content-Type': 'application/json'
        }
    });
    localStorage.clear();
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    location.reload();
    // 프로필 숨기고 버튼 보이기
    if (loginBtn) loginBtn.style.display = 'block'; // flex 대신 block 권장 (내부 정렬 때문)
    if (userProfile) userProfile.style.display = 'none';
}





function updateProfileUI(name, picture) {
    // HTML에 해당 ID가 있을 때만 동작 (에러 방지)
    const loginArea = document.getElementById('login-area');
    const userProfile = document.getElementById('user-profile');
    const profileImg = document.getElementById('profile-img');
    const profileName = document.getElementById('profile-name');

    if (loginArea && userProfile) {
        loginArea.style.display = 'none';
        userProfile.style.display = 'flex';
        if (profileName) profileName.textContent = name;
        if (profileImg) profileImg.src = picture;
    }
}




// 다른 탭에서 로컬스토리지(로그인 정보)가 바뀌면 나도 따라 바뀜!
window.addEventListener('storage', (event) => {
    if (event.key === 'accessToken') {
        // 누가 토큰을 저장했네? 나도 UI 업데이트 해야지!
        const name = localStorage.getItem('userName');
        const picture = localStorage.getItem('userPicture');

        if (event.newValue) { // 로그인 됨
            updateProfileUI(name, picture);
        } else { // 로그아웃 됨 (값이 null이 됨)
            location.reload();
        }
    }
});