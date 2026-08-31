const imageInput = document.getElementById('imageFile');
const imageElement = document.getElementById('image-to-crop');
let cropper;
imageInput.addEventListener('change', function (e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();

        // 파일을 다 읽었을 때 실행되는 함수
        reader.onload = function (e) {
            // 이미지 태그의 src를 읽은 파일 내용으로 변경
            imageElement.src = e.target.result;
            
            // 기존에 열려있는 크로퍼가 있다면 제거 (초기화)
            if (cropper) {
                cropper.destroy();
            }

            // Cropper.js 적용 및 설정
            cropper = new Cropper(imageElement, {
                aspectRatio: 1 / 1, // 1:1 비율로 고정 (정사각형). 자유롭게 하려면 이 줄 삭제.
                viewMode: 1,        // 이미지가 컨테이너 밖으로 나가지 않게 제한
                autoCropArea: 0.8,  // 초기에 선택되는 영역 크기 (80%)
            });
            console.log(cropper);
        };
        // 파일을 Data URL 형태로 읽기 시작
        reader.readAsDataURL(file);
    }
});