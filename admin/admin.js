// 버튼의 ID가 'sync-btn'이라고 가정합니다. HTML에 맞춰 수정해주세요.
const syncBtn = document.getElementById('sync-btn');

if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
        // 1. 로컬 스토리지에서 토큰 꺼내기
        const token = localStorage.getItem('accessToken');

        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        // 2. 중복 클릭 방지 (버튼 비활성화 및 텍스트 변경)
        syncBtn.disabled = true;
        const originalText = syncBtn.textContent;
        syncBtn.textContent = "동기화 진행 중...";

        try {
            // 3. 백엔드로 POST 요청 보내기 (경로는 컨트롤러 설정에 맞게 조절하세요)
            const response = await fetch('https://carpespring.onrender.com/admin/sync-sheet', {
                method: 'POST',
                headers: {
                    'accessToken': token // 백엔드 JwtFilter가 기다리는 헤더 이름
                }
            });

            // 4. 응답 상태에 따른 처리
            if (response.ok) {
                // 성공 (HTTP 200)
                const successMessage = await response.text();
                alert(successMessage);
            } else if (response.status === 401) {
                // 토큰 만료 또는 없음
                alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
            } else if (response.status === 403) {
                // 권한 없음 (ADMIN 아님)
                alert("동기화 권한이 없습니다. 관리자 계정으로 로그인해주세요.");
            } else {
                // 기타 서버 에러 (HTTP 500 등)
                const errorMessage = await response.text();
                alert(errorMessage);
            }
        } catch (error) {
            // 네트워크 단절이나 서버 다운 시
            console.error("동기화 요청 실패:", error);
            alert("서버와 통신하는 도중 문제가 발생했습니다.");
        } finally {
            // 5. 완료 후 버튼 상태 원래대로 복구
            syncBtn.disabled = false;
            syncBtn.textContent = originalText;
        }
    });
}


const syncSongBtn = document.getElementById('sync-song-btn');
const periodSelect = document.getElementById('period-select'); // 🌟 드롭다운 요소 선택

if (syncSongBtn && periodSelect) {
    syncSongBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        // 🌟 핵심: 클릭하는 순간에 유저가 선택한 옵션의 value('all' 또는 'recent')를 읽어옵니다.
        const period = periodSelect.value;

        // 버튼 비활성화 (중복 클릭 방지)
        syncSongBtn.disabled = true;
        const originalText = syncSongBtn.textContent;
        syncSongBtn.textContent = "노래 동기화 진행 중...";

        try {
            // 🌟 동적으로 읽어온 period 값을 주소에 삽입합니다.
            const response = await fetch(`https://carpespring.onrender.com/api/song/sync?period=${period}`, {
                method: 'POST',
                headers: {
                    'accessToken': token
                }
            });

            if (response.ok) {
                // 성공 시 어떤 방식으로 동기화했는지 알림창에 같이 띄워주면 UX가 좋습니다.
                const typeName = period === 'all' ? '전체' : '최근';
                alert(`성공적으로 ${typeName} 노래 동기화를 완료했습니다.`);
            } else if (response.status === 401) {
                alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
            } else if (response.status === 403) {
                alert("관리자 권한이 필요합니다.");
            } else {
                alert("동기화 실패: 서버에 문제가 발생했습니다.");
            }
        } catch (error) {
            console.error("노래 동기화 실패:", error);
            alert("서버와 통신하는 도중 문제가 발생했습니다.");
        } finally {
            // 완료 후 버튼 원상 복구
            syncSongBtn.disabled = false;
            syncSongBtn.textContent = originalText;
        }
    });
}