# Monad API 명세 — 검색, 정렬, 좋아요, 마이페이지

> 기본 CRUD API는 [api-spec.md](api-spec.md) 참고

---

## 기존 API 변경사항

### 게시글 목록 — `sort`, `likeCount` 추가

`GET /api/v1/boards/{boardId}/posts` 에 정렬 파라미터가 추가되고, 응답에 `likeCount`가 포함된다.

**추가된 Query Parameter**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| sort | string | latest | `latest`(최신순), `oldest`(오래된순), `views`(조회수순), `likes`(좋아요순) |

**변경된 Response** — PostItem:
```json
{
  "id": 1,
  "title": "게시글 제목",
  "memberId": 1,
  "nickname": "홍길동",
  "viewCount": 42,
  "likeCount": 5,
  "createdAt": "2025-01-15T10:30:00"
}
```

| 추가 필드 | 타입 | 설명 |
|----------|------|------|
| likeCount | number | 좋아요 수 |

---

### 게시글 조회 — `likeCount`, `liked` 추가

`GET /api/v1/boards/{boardId}/posts/{postId}` 응답에 좋아요 정보가 포함된다.
로그인 상태라면 현재 사용자의 좋아요 여부(`liked`)를 제공한다.

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
  "createdAt": "2025-01-15T10:30:00"
}
```

| 추가 필드 | 타입 | 설명 |
|----------|------|------|
| likeCount | number | 좋아요 수 |
| liked | boolean | 현재 사용자의 좋아요 여부 (비로그인 시 `false`) |

---

### 댓글 목록 — `likeCount` 추가

`GET /api/v1/posts/{postId}/comments` 응답의 댓글/대댓글에 `likeCount`가 포함된다.

**변경된 Response** — CommentItem:
```json
{
  "id": 1,
  "memberId": 1,
  "nickname": "홍길동",
  "content": "댓글 내용",
  "mentions": [],
  "likeCount": 3,
  "createdAt": "2025-01-15T10:30:00",
  "replies": [
    {
      "id": 3,
      "memberId": 2,
      "nickname": "김철수",
      "content": "@홍길동 동의합니다",
      "mentions": ["홍길동"],
      "likeCount": 1,
      "createdAt": "2025-01-15T10:35:00"
    }
  ]
}
```

| 추가 필드 | 타입 | 설명 |
|----------|------|------|
| likeCount | number | 댓글/대댓글 좋아요 수 |

---

## 1. 검색

### 1.1 게시글 검색

```
GET /api/v1/posts/search?keyword=검색어&boardId=1&page=0&size=20
```

**인증**: 불필요

게시글 제목 또는 본문에 키워드가 포함된 게시글을 검색한다.
`boardId`를 지정하면 해당 게시판 내에서만 검색한다.

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| keyword | string | O | - | 검색 키워드 (제목+본문) |
| boardId | number | X | - | 특정 게시판 내 검색 (미지정 시 전체 검색) |
| page | number | X | 0 | 페이지 번호 |
| size | number | X | 20 | 페이지 크기 |

**Response** `200 OK`:
```json
{
  "posts": [
    {
      "id": 1,
      "boardId": 1,
      "boardName": "자유게시판",
      "title": "검색어가 포함된 제목",
      "memberId": 1,
      "nickname": "홍길동",
      "viewCount": 42,
      "createdAt": "2025-01-15T10:30:00"
    }
  ],
  "totalCount": 15,
  "page": 0,
  "size": 20
}
```

---

## 2. 좋아요

### 2.1 게시글 좋아요

```
POST /api/v1/posts/{postId}/likes
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| postId | number | 게시글 ID |

**Response** `201 Created`:
```json
{
  "postId": 1,
  "liked": true,
  "likeCount": 6
}
```

**에러**:
- `400` — 이미 좋아요한 게시글
- `404` — 게시글 없음

---

### 2.2 게시글 좋아요 취소

```
DELETE /api/v1/posts/{postId}/likes
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| postId | number | 게시글 ID |

**Response** `200 OK`:
```json
{
  "postId": 1,
  "liked": false,
  "likeCount": 5
}
```

**에러**:
- `400` — 좋아요하지 않은 게시글
- `404` — 게시글 없음

---

### 2.3 댓글 좋아요

```
POST /api/v1/comments/{commentId}/likes
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| commentId | number | 댓글 ID |

**Response** `201 Created`:
```json
{
  "commentId": 1,
  "liked": true,
  "likeCount": 4
}
```

**에러**:
- `400` — 이미 좋아요한 댓글
- `404` — 댓글 없음

---

### 2.4 댓글 좋아요 취소

```
DELETE /api/v1/comments/{commentId}/likes
```

**인증**: 필요

**Path Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| commentId | number | 댓글 ID |

**Response** `200 OK`:
```json
{
  "commentId": 1,
  "liked": false,
  "likeCount": 3
}
```

**에러**:
- `400` — 좋아요하지 않은 댓글
- `404` — 댓글 없음

---

## 3. 마이페이지

### 3.1 내가 쓴 글 조회

```
GET /api/v1/members/me/posts?page=0&size=20
```

**인증**: 필요

현재 로그인한 사용자가 작성한 게시글 목록을 조회한다.

**Query Parameters**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 0 | 페이지 번호 |
| size | number | 20 | 페이지 크기 |

**Response** `200 OK`:
```json
{
  "posts": [
    {
      "id": 1,
      "boardId": 1,
      "boardName": "자유게시판",
      "title": "내가 쓴 글 제목",
      "viewCount": 42,
      "createdAt": "2025-01-15T10:30:00"
    }
  ],
  "totalCount": 10,
  "page": 0,
  "size": 20
}
```

---

### 3.2 내가 쓴 댓글 조회

```
GET /api/v1/members/me/comments?page=0&size=20
```

**인증**: 필요

현재 로그인한 사용자가 작성한 댓글 목록을 조회한다.

**Query Parameters**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 0 | 페이지 번호 |
| size | number | 20 | 페이지 크기 |

**Response** `200 OK`:
```json
{
  "comments": [
    {
      "id": 5,
      "postId": 1,
      "postTitle": "원본 게시글 제목",
      "content": "내가 쓴 댓글 내용",
      "mentions": ["홍길동"],
      "createdAt": "2025-01-15T10:35:00"
    }
  ],
  "totalCount": 8,
  "page": 0,
  "size": 20
}
```

---

## 도메인 규칙 요약

### Like (좋아요)
- 게시글/댓글 각각 좋아요 가능
- 한 사용자가 같은 게시글/댓글에 중복 좋아요 불가
- 좋아요하지 않은 상태에서 취소 불가

### Search (검색)
- 제목 + 본문 키워드 검색 (LIKE 패턴)
- 특정 게시판 또는 전체 게시판 범위 선택 가능

### Sort (정렬)
- `latest`: 최신순 (기본값)
- `oldest`: 오래된순
- `views`: 조회수순 (내림차순)
- `likes`: 좋아요순 (내림차순)
