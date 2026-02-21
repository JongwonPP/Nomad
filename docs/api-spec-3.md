# Monad API 명세 — 이미지 첨부 & 예외 처리 개선

> 기본 CRUD API는 [api-spec.md](api-spec.md), 검색/정렬/좋아요는 [api-spec-2.md](api-spec-2.md) 참고

---

## 에러 응답 체계 변경

기존에 대부분 `400`으로 처리하던 에러를 의미에 맞는 HTTP 상태 코드로 분리하였다.

### 에러 상태 코드 매핑

| HTTP Status | 의미 | 발생 상황 |
|-------------|------|----------|
| 400 | 잘못된 요청 | 입력값 검증 실패, 도메인 규칙 위반 (파일 형식 불가, 크기 초과, 대대댓글 시도 등) |
| 401 | 인증 실패 | 토큰 없음/만료, 로그인 실패 (이메일/비밀번호 불일치) |
| 403 | 권한 없음 | 본인의 리소스가 아닌 경우 (글 수정/삭제, 이미지 첨부/삭제, 댓글 수정/삭제) |
| 404 | 리소스 없음 | 게시글/게시판/회원/댓글/이미지 조회 실패 |
| 409 | 중복 | 이메일/닉네임/게시판명 중복 |
| 500 | 서버 오류 | 예상치 못한 서버 에러 |

### 에러 응답 형식 (변경 없음)

```json
{ "message": "에러 메시지" }
```

### 기존 API 에러 코드 변경 내역

| API | 에러 상황 | 이전 | 변경 |
|-----|----------|------|------|
| `PUT /api/v1/boards/{boardId}/posts/{postId}` | 본인의 글이 아님 | 400 | **403** |
| `DELETE /api/v1/boards/{boardId}/posts/{postId}` | 본인의 글이 아님 | 400 | **403** |
| `PUT /api/v1/posts/{postId}/comments/{commentId}` | 본인의 댓글이 아님 | 400 | **403** |
| `DELETE /api/v1/posts/{postId}/comments/{commentId}` | 본인의 댓글이 아님 | 400 | **403** |
| `POST /api/v1/members` | 이메일/닉네임 중복 | 400 | **409** |
| `POST /api/v1/boards` | 게시판 이름 중복 | 400 | **409** |
| `POST /api/v1/auth/login` | 이메일/비밀번호 불일치 | 400 | **401** |
| 모든 인증 필요 API | 토큰 없이 접근 | HTML 응답 | **401 JSON** |

---

## 기존 API 변경사항

### 게시글 조회 — `images` 추가

`GET /api/v1/boards/{boardId}/posts/{postId}` 응답에 이미지 목록이 포함된다.

**변경된 Response**:
```json
{
  "id": 1,
  "boardId": 1,
  "title": "게시글 제목",
  "content": "게시글 본문 내용입니다",
  "memberId": 1,
  "nickname": "홍길동",
  "viewCount": 43,
  "likeCount": 5,
  "liked": true,
  "createdAt": "2025-01-15T10:30:00",
  "images": [
    {
      "id": 1,
      "imageUrl": "/api/v1/images/550e8400-e29b-41d4-a716-446655440000.jpg",
      "originalFilename": "photo.jpg"
    },
    {
      "id": 2,
      "imageUrl": "/api/v1/images/6ba7b810-9dad-11d1-80b4-00c04fd430c8.png",
      "originalFilename": "screenshot.png"
    }
  ]
}
```

| 추가 필드 | 타입 | 설명 |
|----------|------|------|
| images | array | 첨부 이미지 목록 (최대 5장, 없으면 빈 배열) |
| images[].id | number | 이미지 ID (삭제 시 사용) |
| images[].imageUrl | string | 이미지 조회 URL (`/api/v1/images/{storedFilename}`) |
| images[].originalFilename | string | 원본 파일명 |

### 게시글 삭제 — 이미지 cascade 삭제

`DELETE /api/v1/boards/{boardId}/posts/{postId}` 시 해당 게시글에 첨부된 모든 이미지(메타데이터 + 파일)가 함께 삭제된다. 기존 응답 형식(`204 No Content`)은 변경 없음.

---

## 1. 이미지 업로드

```
POST /api/v1/posts/{postId}/images
```

**인증**: 필요 (본인 글만)

**Content-Type**: `multipart/form-data`

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| postId | number | 게시글 ID |

**Request Body** (multipart/form-data):

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| file | file | O | JPEG, PNG, GIF, WEBP만 허용. 최대 5MB |

**요청 예시** (cURL):
```bash
curl -X POST http://localhost:8080/api/v1/posts/1/images \
  -H "Authorization: Bearer {accessToken}" \
  -F "file=@photo.jpg"
```

**요청 예시** (JavaScript fetch):
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/posts/1/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

**Response** `201 Created`:
```json
{
  "id": 1,
  "postId": 1,
  "originalFilename": "photo.jpg",
  "storedFilename": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "imageUrl": "/api/v1/images/550e8400-e29b-41d4-a716-446655440000.jpg",
  "fileSize": 204800,
  "contentType": "image/jpeg",
  "createdAt": "2025-01-15T10:30:00"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 이미지 ID |
| postId | number | 게시글 ID |
| originalFilename | string | 원본 파일명 |
| storedFilename | string | 서버 저장 파일명 (UUID + 확장자) |
| imageUrl | string | 이미지 조회 URL |
| fileSize | number | 파일 크기 (bytes) |
| contentType | string | MIME 타입 (`image/jpeg`, `image/png`, `image/gif`, `image/webp`) |
| createdAt | string | 업로드 일시 (ISO 8601) |

**에러**:
- `400` — 허용되지 않는 파일 형식, 파일 크기 초과(5MB), 이미지 5장 초과
- `403` — 본인의 글이 아님
- `404` — 게시글 없음

---

## 2. 이미지 조회 (서빙)

```
GET /api/v1/images/{storedFilename}
```

**인증**: 불필요

이미지 바이너리를 직접 응답한다. `<img>` 태그의 `src` 속성에 바로 사용 가능.

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| storedFilename | string | 서버 저장 파일명 (업로드 응답의 `storedFilename` 또는 게시글 조회의 `imageUrl` 경로) |

**Response** `200 OK`:

| 헤더 | 값 |
|------|-----|
| Content-Type | `image/jpeg`, `image/png`, `image/gif`, `image/webp` (원본 타입) |

Body: 이미지 바이너리

**사용 예시** (HTML):
```html
<img src="/api/v1/images/550e8400-e29b-41d4-a716-446655440000.jpg" alt="첨부 이미지" />
```

**에러**:
- `404` — 이미지 없음

---

## 3. 이미지 삭제

```
DELETE /api/v1/posts/{postId}/images/{imageId}
```

**인증**: 필요 (본인 글만)

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| postId | number | 게시글 ID |
| imageId | number | 이미지 ID (업로드 응답 또는 게시글 조회의 `images[].id`) |

**Response** `204 No Content`

**에러**:
- `400` — 해당 게시글의 이미지가 아님
- `403` — 본인의 글이 아님
- `404` — 게시글 없음, 이미지 없음

---

## 도메인 규칙 요약

### Image (이미지)
- 허용 형식: JPEG, PNG, GIF, WEBP
- 최대 파일 크기: 5MB
- 게시글 당 최대 5장
- 업로드: 본인 글에만 가능
- 삭제: 본인 글의 이미지만 가능
- 게시글 삭제 시 첨부 이미지 전체 cascade 삭제
- 이미지 조회(서빙)는 인증 불필요

### 프론트엔드 연동 흐름

1. **게시글 작성 후 이미지 첨부**: 게시글을 먼저 생성(`POST /api/v1/boards/{boardId}/posts`)하고, 반환된 `postId`로 이미지를 업로드(`POST /api/v1/posts/{postId}/images`)
2. **이미지 표시**: 게시글 조회 시 `images[].imageUrl`을 `<img src>` 속성에 사용
3. **이미지 삭제**: `images[].id`와 `postId`로 삭제 요청

### 프론트엔드 에러 핸들링 가이드

```javascript
const response = await fetch(url, options);

if (!response.ok) {
  const error = await response.json();
  switch (response.status) {
    case 400: // 입력값 오류 → 사용자에게 메시지 표시
      showValidationError(error.message);
      break;
    case 401: // 인증 실패 → 로그인 페이지로 리다이렉트
      redirectToLogin();
      break;
    case 403: // 권한 없음 → "권한이 없습니다" 표시
      showForbiddenError(error.message);
      break;
    case 404: // 리소스 없음 → 목록으로 이동
      showNotFoundError(error.message);
      break;
    case 409: // 중복 → 입력값 수정 유도
      showDuplicateError(error.message);
      break;
  }
}
```
