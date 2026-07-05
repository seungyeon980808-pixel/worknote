# WorkNote

기록하고, 분류하고, 잊지 않는 업무 허브. ADHD 친화적인 "일단 캡처 → 나중에 분류" 구조.

## 핵심 개념

- 모든 기록은 **하나의 아이템 저장소**에 들어간다. 오늘/주간/검색 화면은 같은 데이터를 다르게 보여주는 창문일 뿐이다.
- 위 캡처 바에 무엇이든 적으면 **인박스(미분류)** 에 즉시 저장된다. `#태그` 를 붙이면 태그가 자동 분리된다.
- 인박스에서 "분류"를 누르면 할 일 / 프로젝트 / 루틴 / 메모 중 하나로 정리한다.
- 할 일을 프로젝트에 연결하면 프로젝트 진행률이 자동 계산된다.
- 금고 내용은 기기에서 AES-GCM으로 암호화된 뒤에만 서버로 전송된다.

## 구조

```
index.html          앱 골격 (로그인, 캡처 바, 네비게이션)
manifest.json, sw.js   PWA (홈 화면 설치, 오프라인 캐시)
css/base.css        색·버튼·폼·모달 등 공통 스타일
css/layout.css      화면별 레이아웃
js/firebase.js      Firebase 초기화 (Auth + Firestore 오프라인 캐시)
js/model.js         통합 아이템 모델, 날짜 유틸
js/store.js         Firestore 읽기/쓰기
js/crypto.js        금고 암호화 (PBKDF2 + AES-GCM)
js/ui.js            공용 UI (모달, 편집기, 행 렌더링)
js/app.js           진입점 (인증, 캡처, 라우팅)
js/views/           오늘 / 주간 / 인박스 / 검색 / 금고
```

## 로컬 실행

ES 모듈을 쓰므로 파일을 직접 열면(file://) 동작하지 않는다. 폴더에서:

```
python -m http.server 8000
```

후 `http://localhost:8000` 접속.

## Firebase 콘솔 설정 (최초 1회)

프로젝트: `edunote-96bd7`

1. **Authentication → Sign-in method** 에서 **Google** 사용 설정
2. **Authentication → Settings → 승인된 도메인** 에 `seungyeon980808-pixel.github.io` 추가 (`localhost`는 기본 포함)
3. **Firestore → 규칙** 을 `firestore.rules` 내용으로 교체 후 게시

## 배포

GitHub Pages, main 브랜치 기준. 저장소 Settings → Pages → Branch: main.

## 버전

- v1.1.0 (2026-07-05) — 오늘 뷰를 하루 허브로 확장: 빠른 메모, 정보 검색기, 교시별 할 일(perfect_work 계승). 날짜/시각을 키보드 숫자 입력(24시간제)으로 전환.
- v1.0.0 (2026-07-05) — Phase 1 MVP: 캡처 인박스, 통합 아이템, 오늘/주간 뷰, 태그 검색, 금고, 실시간 동기화, PWA
