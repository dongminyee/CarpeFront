# CarpeDiem Web - Frontend

KAIST 팝밴드 **까르페디엠(CarpeDiem)**의 웹 서비스 프론트엔드 레포지토리입니다.  
동아리 소개, 구글 OAuth 기반 로그인/인증, 실시간 동방 이용 시간표, 역대 선곡 리스트, 연도별 갤러리 기능을 제공합니다.

---

## Key Features

- **반응형 동방 이용 시간표 (Dynamic Timetable Grid)**
  - Google Sheets CSV 데이터를 PapaParse로 실시간 파싱하여 격자형 시간표 자동 생성
  - 모바일 환경에서 표가 부드럽게 좌우 스와이프되는 전용 스크롤 래퍼 및 Sticky 헤더 적용
- **🔐 Google OAuth2 연동 및 유저 프로필**
  - 백엔드 REST API 연동을 통한 구글 로그인 및 세션 관리
  - 모바일 네비게이션 메뉴 내 커스텀 유저 프로필 카드 및 로그아웃 기능 지원
- **Map 연동**
  - Kakao Map API를 이용해 동방 위치 및 길안내를 제공

---

## 🛠 Tech Stack

* JavaScript (ES6+)
* HTML5 / CSS3
* Flickity
