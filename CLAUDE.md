# Nomad

## Tech Stack

- HTML + Vanilla JavaScript (ES Modules)
- Vite (build tool, dev server)
- CSR (Client-Side Rendering) with History API router

## Commands

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run preview` — 빌드 결과 미리보기

## Project Structure

```
src/
  main.js          — 앱 진입점, 라우터 초기화
  router.js        — History API 기반 CSR 라우터
  style.css        — 글로벌 스타일
  pages/           — 페이지 컴포넌트 (라우트 단위)
```

## Conventions

### Routing

- 라우터는 `src/router.js`의 `createRouter(routes)` 사용
- 새 페이지 추가 시: `src/pages/`에 컴포넌트 생성 → `main.js`에 라우트 등록
- 내부 링크는 반드시 `<a href="/path" data-link>` 형태로 작성 (data-link 필수)

### Page Components

- 각 페이지는 `(container) => void` 시그니처의 named export 함수
- `container.innerHTML`로 렌더링
- 파일명은 PascalCase (e.g. `Home.js`, `About.js`)

### Styling

- 글로벌 스타일은 `src/style.css`
- 페이지별 스타일이 필요하면 `.page-name` 클래스로 스코핑

### Code Style

- ES Modules (`import`/`export`) 사용
- 세미콜론 사용
- 작은따옴표(single quote) 사용
