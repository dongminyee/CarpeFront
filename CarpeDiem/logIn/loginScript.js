const params = new URLSearchParams(window.location.search);

const loginData = {
    accessToken: params.get('accessToken'),
    refreshToken: params.get('refreshToken'),
    name: params.get('name'),
    picture: params.get('picture')
};

if(window.opener && loginData.accessToken){
    window.opener.postMessage({
        type: 'LOGIN_SUCCESS',
        payload: loginData
    }, '*');
    window.close();
}


// login 팝업창 띄우기
let loginBtn = document.getElementsByClassName("loginButton")[0];
let loginEvent = ()=>{
    const width = 500;
    const height = 600;

    // 2. 화면 정중앙 위치 계산
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    // 3. 구글 로그인 URL (Spring Security 기본 설정 경로)
    // 만약 백엔드 경로가 다르다면 수정하세요.
    const url = 'https://obscure-memory-9wpr7vp5wg5377xj-8080.app.github.dev/oauth2/authorization/google'; 

    // 4. 윈도우 옵션 설정 (크기, 위치, 스크롤바 등)
    const windowFeatures = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`;

    // 5. 새 창 열기
    window.open(url, 'google-login-popup', windowFeatures);
};
loginBtn.addEventListener("click",loginEvent);