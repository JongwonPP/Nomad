# Monad 커뮤니티 게시판 API 명세

## 개요

커뮤니티 게시판 백엔드 REST API. 회원가입, JWT 인증, 게시판/게시글/댓글 CRUD를 제공한다.

- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token (`Authorization: Bearer {accessToken}`)
- **날짜 형식**: ISO 8601 (`2025-01-15T10:30:00`)

---

## 인증

JWT 기반 인증. 로그인 시 Access Token(30분)과 Refresh Token(7일)을 발급받는다.

인증이 필요한 API 요청 시 헤더에 Access Token을 포함해야 한다:
```
Authorization: Bearer {accessToken}
```

토큰 만료 시 Refresh Token으로 새 Access Token을 발급받는다.

### Access Token Payload (참고)
```json
{
  "memberId": 1,
  "email": "user@example.com",
  "nickname": "홍길동"
}
```

---

## 에러 응답 형식

모든 에러는 아래 형식으로 반환된다:

```json
{ "message": "에러 메시지" }
```

**유효성 검증 에러** (400):
```json
{
  "message": "입력값이 올바르지 않습니다",
  "errors": ["title: 게시글 제목은 필수입니다", "content: 게시글 본문은 필수입니다"]
}
```

| HTTP Status | 의미 |
|-------------|------|
| 400 | 잘못된 요청 (유효성 검증 실패, 도메인 규칙 위반) |
| 401 | 인증 필요 (토큰 없음 또는 만료) |
| 403 | 접근 거부 (권한 없음) |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |

---

## 1. Auth (인증)

### 1.1 로그인

```
POST /api/v1/auth/login
```

**인증**: 불필요

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | O | 이메일 |
| password | string | O | 비밀번호 |

**Response** `200 OK`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**에러**:
- `401` — 이메일 또는 비밀번호 불일치

---

### 1.2 토큰 갱신

```
POST /api/v1/auth/refresh
```

**인증**: 불필요

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| refreshToken | string | O | 리프레시 토큰 |

**Response** `200 OK`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**에러**:
- `401` — 유효하지 않은 리프레시 토큰

---

## 2. Member (회원)

### 2.1 회원가입

```
POST /api/v1/members
```

**인증**: 불필요

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| email | string | O | 이메일 형식 (@ 포함), 최대 100자, 중복 불가 |
| password | string | O | 최소 8자, 최대 100자 |
| nickname | string | O | 최소 2자, 최대 20자, 중복 불가 |

**Response** `201 Created`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "createdAt": "2025-01-15T10:30:00"
}
```

**에러**:
- `400` — 유효성 검증 실패, 이메일/닉네임 중복

---

### 2.2 프로필 조회

```
GET /api/v1/members/{id}
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | number | 회원 ID |

**Response** `200 OK`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "홍길동",
  "createdAt": "2025-01-15T10:30:00"
}
```

**에러**:
- `404` — 회원 없음

---

### 2.3 프로필 수정

```
PUT /api/v1/members/{id}
```

**인증**: 필요 (본인만)

**Request Body**:
```json
{
  "nickname": "새닉네임"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| nickname | string | O | 최소 2자, 최대 20자 |

**Response** `200 OK`:
```json
{
  "id": 1,
  "nickname": "새닉네임",
  "updatedAt": "2025-01-15T11:00:00"
}
```

---

### 2.4 비밀번호 변경

```
PATCH /api/v1/members/{id}/password
```

**인증**: 필요 (본인만)

**Request Body**:
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| oldPassword | string | O | 현재 비밀번호 |
| newPassword | string | O | 최소 8자, 최대 100자 |

**Response** `200 OK`:
```json
{}
```

**에러**:
- `400` — 기존 비밀번호 불일치, 유효성 검증 실패

---

### 2.5 회원 탈퇴

```
DELETE /api/v1/members/{id}
```

**인증**: 필요 (본인만)

**Response** `204 No Content`

**에러**:
- `404` — 회원 없음

---

## 3. Board (게시판)

### 3.1 게시판 생성

```
POST /api/v1/boards
```

**인증**: 필요

**Request Body**:
```json
{
  "name": "자유게시판",
  "description": "자유롭게 이야기하는 공간입니다"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| name | string | O | 최대 50자, 중복 불가 |
| description | string | X | 설명 |

**Response** `201 Created`:
```json
{
  "id": 1,
  "name": "자유게시판",
  "description": "자유롭게 이야기하는 공간입니다",
  "createdAt": "2025-01-15T10:30:00"
}
```

---

### 3.2 게시판 목록

```
GET /api/v1/boards
```

**인증**: 불필요

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "자유게시판",
    "description": "자유롭게 이야기하는 공간입니다"
  },
  {
    "id": 2,
    "name": "질문게시판",
    "description": "질문과 답변"
  }
]
```

---

### 3.3 게시판 조회

```
GET /api/v1/boards/{id}
```

**인증**: 불필요

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "자유게시판",
  "description": "자유롭게 이야기하는 공간입니다",
  "createdAt": "2025-01-15T10:30:00"
}
```

---

### 3.4 게시판 수정

```
PUT /api/v1/boards/{id}
```

**인증**: 필요

**Request Body**:
```json
{
  "name": "수정된 게시판명",
  "description": "수정된 설명"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| name | string | O | 최대 50자 |
| description | string | X | 설명 |

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "수정된 게시판명",
  "description": "수정된 설명",
  "updatedAt": "2025-01-15T11:00:00"
}
```

---

### 3.5 게시판 삭제

```
DELETE /api/v1/boards/{id}
```

**인증**: 필요

**Response** `204 No Content`

---

## 4. Post (게시글)

### 4.1 게시글 작성

```
POST /api/v1/boards/{boardId}/posts
```

**인증**: 필요 (작성자는 토큰에서 자동 추출)

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| boardId | number | 게시판 ID |

**Request Body**:
```json
{
  "title": "게시글 제목",
  "content": "게시글 본문 내용입니다"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| title | string | O | 최대 200자 |
| content | string | O | 빈 값 불가 |

**Response** `201 Created`:
```json
{
  "id": 1,
  "boardId": 1,
  "title": "게시글 제목",
  "content": "게시글 본문 내용입니다",
  "memberId": 1,
  "createdAt": "2025-01-15T10:30:00"
}
```

**에러**:
- `404` — 게시판 없음

---

### 4.2 게시글 목록 (페이징)

```
GET /api/v1/boards/{boardId}/posts?page=0&size=20
```

**인증**: 불필요

**Query Parameters**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 0 | 페이지 번호 (0부터 시작) |
| size | number | 20 | 페이지 크기 |

**Response** `200 OK`:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "게시글 제목",
      "memberId": 1,
      "nickname": "홍길동",
      "viewCount": 42,
      "createdAt": "2025-01-15T10:30:00"
    }
  ],
  "totalCount": 150,
  "page": 0,
  "size": 20
}
```

---

### 4.3 게시글 조회

```
GET /api/v1/boards/{boardId}/posts/{postId}
```

**인증**: 불필요

요청할 때마다 조회수가 1 증가한다.

**Response** `200 OK`:
```json
{
  "id": 1,
  "boardId": 1,
  "title": "게시글 제목",
  "content": "게시글 본문 내용입니다",
  "memberId": 1,
  "nickname": "홍길동",
  "viewCount": 43,
  "createdAt": "2025-01-15T10:30:00"
}
```

**에러**:
- `404` — 게시글 없음

---

### 4.4 게시글 수정

```
PUT /api/v1/boards/{boardId}/posts/{postId}
```

**인증**: 필요 (본인 글만 수정 가능)

**Request Body**:
```json
{
  "title": "수정된 제목",
  "content": "수정된 본문"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| title | string | O | 최대 200자 |
| content | string | O | 빈 값 불가 |

**Response** `200 OK`:
```json
{
  "id": 1,
  "title": "수정된 제목",
  "content": "수정된 본문",
  "updatedAt": "2025-01-15T11:00:00"
}
```

**에러**:
- `400` — 본인의 글이 아님
- `404` — 게시글 없음

---

### 4.5 게시글 삭제

```
DELETE /api/v1/boards/{boardId}/posts/{postId}
```

**인증**: 필요 (본인 글만 삭제 가능)

**Response** `204 No Content`

**에러**:
- `400` — 본인의 글이 아님
- `404` — 게시글 없음

---

## 5. Comment (댓글/대댓글)

댓글은 1단계 대댓글까지 지원한다 (대대댓글 없음).
내용에 `@닉네임`을 포함하면 멘션으로 처리된다. 존재하지 않는 닉네임은 무시된다.

### 5.1 댓글 작성

```
POST /api/v1/posts/{postId}/comments
```

**인증**: 필요 (작성자는 토큰에서 자동 추출)

**Request Body**:
```json
{
  "content": "@홍길동 좋은 글이네요!"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| content | string | O | 최대 500자, `@닉네임` 멘션 가능 |

**Response** `201 Created`:
```json
{
  "id": 1,
  "postId": 1,
  "memberId": 2,
  "content": "@홍길동 좋은 글이네요!",
  "mentions": ["홍길동"],
  "createdAt": "2025-01-15T10:30:00"
}
```

**에러**:
- `404` — 게시글 없음

---

### 5.2 대댓글 작성

```
POST /api/v1/posts/{postId}/comments/{commentId}/replies
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| postId | number | 게시글 ID |
| commentId | number | 부모 댓글 ID |

**Request Body**:
```json
{
  "content": "@작성자 저도 동의해요"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| content | string | O | 최대 500자, `@닉네임` 멘션 가능 |

**Response** `201 Created`:
```json
{
  "id": 3,
  "postId": 1,
  "parentId": 1,
  "memberId": 3,
  "content": "@작성자 저도 동의해요",
  "mentions": ["작성자"],
  "createdAt": "2025-01-15T10:35:00"
}
```

**에러**:
- `400` — 대댓글에 대한 대댓글 시도 (depth 제한)
- `404` — 게시글 또는 부모 댓글 없음

---

### 5.3 댓글 목록 (계층 구조)

```
GET /api/v1/posts/{postId}/comments
```

**인증**: 불필요

댓글과 대댓글을 계층 구조로 반환한다. 대댓글은 부모 댓글의 `replies` 배열에 포함된다.

**Response** `200 OK`:
```json
{
  "comments": [
    {
      "id": 1,
      "memberId": 1,
      "nickname": "홍길동",
      "content": "첫 번째 댓글입니다",
      "mentions": [],
      "createdAt": "2025-01-15T10:30:00",
      "replies": [
        {
          "id": 3,
          "memberId": 2,
          "nickname": "김철수",
          "content": "@홍길동 동의합니다",
          "mentions": ["홍길동"],
          "createdAt": "2025-01-15T10:35:00"
        }
      ]
    },
    {
      "id": 2,
      "memberId": 3,
      "nickname": "이영희",
      "content": "두 번째 댓글",
      "mentions": [],
      "createdAt": "2025-01-15T10:32:00",
      "replies": []
    }
  ],
  "totalCount": 3
}
```

`totalCount`는 대댓글을 포함한 전체 댓글 수이다.

---

### 5.4 댓글 수정

```
PUT /api/v1/posts/{postId}/comments/{commentId}
```

**인증**: 필요 (본인 댓글만 수정 가능)

**Request Body**:
```json
{
  "content": "수정된 댓글 내용 @홍길동"
}
```

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|------|----------|
| content | string | O | 최대 500자, 멘션 재파싱됨 |

**Response** `200 OK`:
```json
{
  "id": 1,
  "content": "수정된 댓글 내용 @홍길동",
  "mentions": ["홍길동"],
  "updatedAt": "2025-01-15T11:00:00"
}
```

**에러**:
- `400` — 본인의 댓글이 아님
- `404` — 댓글 없음

---

### 5.5 댓글 삭제

```
DELETE /api/v1/posts/{postId}/comments/{commentId}
```

**인증**: 필요 (본인 댓글만 삭제 가능)

부모 댓글 삭제 시 대댓글도 함께 삭제된다.

**Response** `204 No Content`

**에러**:
- `400` — 본인의 댓글이 아님
- `404` — 댓글 없음

---

## 도메인 규칙 요약

### Member
- email: `@` 포함 필수, 최대 100자, 중복 불가
- password: 최소 8자, 최대 100자
- nickname: 최소 2자, 최대 20자, 중복 불가

### Board
- name: 빈 값 불가, 최대 50자, 중복 불가
- description: 선택

### Post
- title: 빈 값 불가, 최대 200자
- content: 빈 값 불가
- 수정/삭제: 본인만 가능

### Comment
- content: 빈 값 불가, 최대 500자
- 멘션: `@닉네임` 패턴 (닉네임 규칙: 2~20자, 한글/영문/숫자/밑줄)
- 대댓글: 1단계까지만 (대대댓글 불가)
- 수정/삭제: 본인만 가능
- 부모 댓글 삭제 시 대댓글 cascade 삭제
