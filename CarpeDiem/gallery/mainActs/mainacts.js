// 연도 토글
{
const wrap = document.getElementById('yearSwitch');
const btn  = document.getElementById('yearToggle');
const menu = document.getElementById('yearMenu');

function openMenu() {
    wrap.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
}

btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    wrap.classList.contains('open') ? closeMenu() : openMenu();
});

// 메뉴 클릭 시 자동 닫기 (이동 전/후 상관없이)
menu.addEventListener('click', ()=> closeMenu());

// 바깥 클릭 시 닫기
document.addEventListener('click', (e)=>{
    if(!wrap.contains(e.target)) closeMenu();
});

// ESC 닫기
document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeMenu();
});


const toggleBtn = document.getElementById('toggle-btn');
const formContainer = document.getElementById('form-container');

toggleBtn.addEventListener('click', () => {
    // 1. 폼 열고 닫기 (클래스 토글)
    formContainer.classList.toggle('open');
    
    // 2. 버튼 텍스트 변경 (+ 활동 추가 <-> - 닫기)
    const isOpen = formContainer.classList.contains('open');
    const span = toggleBtn.querySelector('span');
    
    if (isOpen) {
        span.innerText = '닫기';
        toggleBtn.style.borderColor = '#ff4d4d'; // 닫을 땐 빨간색 계열로 변경 (선택사항)
        toggleBtn.style.backgroundColor = '#ff4d4d';
    } else {
        span.innerText = '업로드';
        toggleBtn.style.borderColor = '#4032ff'; // 다시 파란색
        toggleBtn.style.backgroundColor = '#4032ff';
    }
});

}

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
        title: '수정 권한 없음',
        text: `사용자의 게시물 수정 권한이 없음`
    });
    // 프로필 숨기고 버튼 보이기
    if(loginBtn) loginBtn.style.display = 'block'; // flex 대신 block 권장 (내부 정렬 때문)
    if(userProfile) userProfile.style.display = 'none'; 
}



document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    // 1. 폼의 기본 동작(페이지 이동)을 막습니다.
    event.preventDefault();
    const rtn = await checkEditAuth();
    if(!rtn) return;

    // 2. 폼 데이터를 자동으로 가져옵니다. (이미지 파일 포함)
    let formData = new FormData();
    const title = document.getElementById('imageTitle').value;
    const date = document.getElementById('imageDate').value;
    if (!(title) || !(date)||!(cropper)){
        console.log("?");
        Swal.fire({text: '내용을 모두 입력해주세요!', icon:'error', confirmButtonColor: '#4032ff'});
        return;
    }
    


    formData.append("title", title);
    formData.append("date", date);
    formData.append("category", "activity");
    formData.append("generation", "none");

    cropper.getCroppedCanvas().toBlob(async (blob) => {
        try{
            // 혹시 모를 변환 실패 대비 (드문 경우)
            if (!blob) {
                Swal.fire('오류', '이미지 변환에 실패했습니다.', 'error');
                return;
            }

            formData.append("file", blob, 'cropped.jpg');

            // 서버 전송 로직 (fetch)
            const response = await fetch('https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/api/photos/upload', {
                method: 'POST',
                // [중요!] body에 formData를 넣으면
                // Content-Type 헤더는 브라우저가 알아서 'multipart/form-data'로 설정합니다.
                // 직접 헤더를 설정하면 오히려 에러가 납니다.
                body: formData
            });

            // 4. 응답 처리
            if (response.ok) {
                // 성공 시 (200 OK)
                const data = await response.json(); // 백엔드가 반환한 이미지 데이터
                console.log('성공:', data);
                
                // 성공 알림창
                Swal.fire({
                    icon: 'success',
                    title: '업로드 성공!',
                    text: '이미지가 저장되었습니다.'
                });
                
                // (선택) 타임라인 새로고침 로직 추가
                document.getElementById("mainTxt").textContent=date.substring(0, 4);
                fetchAndUpdateImages(date.substring(0, 4));
                
                // 버튼 toggle
                const toggleBtn = document.getElementById('toggle-btn');
                const formContainer = document.getElementById('form-container');
                formContainer.classList.toggle('open');
                const span = toggleBtn.querySelector('span');
    
                span.innerText = '업로드';
                toggleBtn.style.borderColor = '#4032ff'; // 다시 파란색
                toggleBtn.style.backgroundColor = '#4032ff';
                

            } else {
                // 실패 시 (403, 500 등)
                console.error('실패 상태 코드:', response.status);
                
                Swal.fire({
                    icon: 'error',
                    title: '업로드 실패',
                    text: `에러 코드: ${response.status} (권한이 없거나 서버 오류)`
                });
            }
        } catch (error) {
            // 네트워크 오류 등
            console.error('네트워크 에러:', error);
            Swal.fire({
                icon: 'error',
                title: '네트워크 오류',
                text: '서버와 연결할 수 없습니다.'
            });
        }

    }, 'image/jpeg', 0.9);

});

/**
 * 수정 버튼 클릭 핸들러
 * @param {number} id - 이미지 ID
 */
async function handleEdit(id) {
    console.log('수정 요청, ID:', id);
    // 예: 수정 팝업 띄우기 또는 수정 페이지로 이동
    // Swal.fire(...) 등을 사용해서 제목 수정 입력창을 띄울 수 있습니다.

    const rtn = await checkEditAuth();
    if(!rtn) return;

    Swal.fire({
       title: '활동 내역 수정',
       html: `
            <input id="edit-input-title" class="swal2-input" placeholder="활동 제목">
            <input id="edit-input-date" type="date" class="swal2-input" >
       `,
       focusConfirm: false,
       showCancelButton: true,
       cancelButtonText: '취소',
        preConfirm: () => {
        const title = document.getElementById('edit-input-title').value;
        const date = document.getElementById('edit-input-date').value;

        if (!title || !date) {
            Swal.showValidationMessage('제목과 날짜를 모두 입력해주세요.');
            return false;
        }

        return { title: title, date: date };
    }
    }).then((result) => {
        if (result.isConfirmed) {
            const data = result.value;
            
            // 날짜는 "YYYY-MM-DD" 형태의 문자열로 반환됩니다 (예: "2025-11-23")
            console.log('제목:', data.title);
            console.log('날짜:', data.date);
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('date', data.date);
            fetch(`https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/api/photos/patch/${id}`, {
                method: 'PATCH',
                // ⚠️ 주의: FormData를 보낼 때는 'Content-Type' 헤더를 직접 적지 마세요!
                // 브라우저가 알아서 'multipart/form-data'로 설정해줍니다.
                body: formData 
            })
            .then(response => {
                if (response.ok) {
                    Swal.fire('수정 완료', `${data.title}(${data.date})`, 'success');
                    fetchAndUpdateImages(document.getElementById("mainTxt").textContent);
                } else {
                    Swal.fire('수정 실패', '등록 중 오류가 발생했습니다.', 'error');
                }
            });
        }

    });
}   

/**
 * 삭제 버튼 클릭 핸들러
 * @param {number} id - 이미지 ID
 */
async function handleDelete(id) {

    const rtn = await checkEditAuth();
    if(!rtn) return;

    Swal.fire({
        title: '정말 삭제하시겠습니까?',
        text: "삭제하면 복구할 수 없습니다!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4032ff',
        confirmButtonText: '삭제',
        cancelButtonText: '취소'
    }).then((result) => {
        if (result.isConfirmed) {
                delOperation(id);        
        }
    });
    
}

async function delOperation(id){
    try{
        // 실제 서버로 삭제 요청 (DELETE API)
        const rst = await fetch(`${'https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/api/photos/delete'}/${id}`, { method: 'DELETE' });
        if(rst.ok){
            console.log(id);
            console.log('삭제 요청, ID:', id);
            
            // 삭제 성공 시 UI 업데이트 (예: 새로고침)
            
            Swal.fire('삭제됨!', '파일이 삭제되었습니다.', 'success');
            fetchAndUpdateImages(document.getElementById("mainTxt").textContent);
        }
        else{
            Swal.fire('실패', '삭제에 실패했습니다.', 'error');
        }
    } catch(err){
        console.error('에러 발생:', err);
    }
}

// [중요] 화면의 아무 곳이나 클릭하면 열려있는 메뉴 닫기
window.addEventListener('click', (e) => {
    if (!e.target.matches('.menu-btn')) {
        const dropdowns = document.querySelectorAll('.menu-dropdown');
        dropdowns.forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });
    }
});


// 이미지를 추가할 부모 컨테이너 요소를 가져옵니다.
const imageContainer = document.getElementById('image-container');

// 테스트용 API URL (10개의 사진 데이터를 요청)
// 실제 사용 시에는 백엔드 API 주소를 넣으세요.
const API_URL = 'https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/api/photos';

/**
 * API를 호출하고 화면을 업데이트하는 함수
 */
async function fetchAndUpdateImages(year) {
    console.log('이미지 업데이트 중...');
    const flkty = Flickity.data(imageContainer);
    
    try {
        //1. API로 데이터 요청
        const response = await fetch(API_URL+"/activity?year="+year);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const images = await response.json(); // JSON 데이터를 JS 객체로 변환

        //2. 기존 이미지 목록 삭제 (화면 클리어)
        
        
        const currentCells = flkty.getCellElements();
        flkty.remove(currentCells);
 

        //3. 받아온 데이터로 새 <div>와 <img> 생성
        const newCellList = images.map(imageData => {
            // 각 이미지를 감쌀 <div> 생성
            const div = document.createElement('div');
            div.classList.add('carousel-cell'); // CSS 클래스 추가

            const imgMenuContainer = document.createElement('div');
            imgMenuContainer.classList.add('img-menu-container');

            const imgMenuBtn = document.createElement('button');
            imgMenuBtn.classList.add('img-menu-btn');
            imgMenuBtn.innerHTML = '&#8942;';

            // 2) 드롭다운 메뉴 (수정/삭제)
            const dropdown = document.createElement('div');
            dropdown.classList.add('img-menu-dropdown');

            // 버튼 클릭 시 드롭다운 토글
            imgMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 클릭 이벤트가 부모로 전파되는 것 방지 (중요)
                // 현재 열려있는 다른 모든 메뉴 닫기 (선택사항)
                document.querySelectorAll('.img-menu-dropdown').forEach(el => {
                    if(el !== dropdown) el.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });


            // 수정 버튼
            const imgEditBtn = document.createElement('button');
            imgEditBtn.innerText = '수정';
            imgEditBtn.addEventListener('click', () => handleEdit(imageData.id)); // ID 전달

            // 삭제 버튼
            const imgDeleteBtn = document.createElement('button');
            imgDeleteBtn.innerText = '삭제';
            imgDeleteBtn.classList.add('delete-btn');
            imgDeleteBtn.addEventListener('click', () => handleDelete(imageData.id)); // ID 전달

            // 조립
            dropdown.appendChild(imgEditBtn);
            dropdown.appendChild(imgDeleteBtn);
            imgMenuContainer.appendChild(imgMenuBtn);
            imgMenuContainer.appendChild(dropdown);
            
            // 최종적으로 카드(div)에 메뉴 추가
            div.appendChild(imgMenuContainer);

            const time = document.createElement('time');
            console.log(imageData.imageUrl);
            time.setAttribute('datetime', imageData.date);
            time.innerHTML  = '<span>'+imageData.date+'</span> '+imageData.title;

            // <img> 태그 생성
            const img = document.createElement('img');
            img.src = 'https://effective-space-waffle-46x5j4xvv56fqvp5-8080.app.github.dev/gallery/'+imageData.imageUrl; // API 응답에 맞는 이미지 URL
            const div2 = document.createElement('div');
            div2.classList.add('img-wrapper');
            div2.appendChild(img);

            // div에 img를 자식으로 추가
            div.appendChild(time);           
            div.appendChild(div2);
            
            // 컨테이너에 최종 div를 추가
            return div;
        });


        flkty.append(newCellList);
        flkty.reloadCells();
        flkty.select(0, false, true);
        flkty.resize();

    } catch (error) {
        console.error('이미지 로딩 중 오류 발생:', error);
        imageContainer.innerHTML = '<p>이미지를 불러오는 데 실패했습니다.</p>';
    }
    
    
}

// 페이지가 처음 로드될 때 즉시 한 번 실행
document.addEventListener('DOMContentLoaded', ()=>{
    mainTxt.textContent = "2025";
    fetchAndUpdateImages(2025);
    initButtons();
});

const initButtons = ()=>{
    const container = document.getElementById("yearMenu");
    const mainTxt = document.getElementById("mainTxt");

    for(let i=2026;i>=2021;i--){
        const btn = document.createElement("button");
        btn.textContent = `${i}`;

        btn.onclick = ()=>{
            mainTxt.textContent=`${i}`;
            fetchAndUpdateImages(i);
        }

        container.appendChild(btn);
    }
}
