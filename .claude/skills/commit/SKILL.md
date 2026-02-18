---
name: commit
description: Stage changes and create a git commit with a conventional commit message
disable-model-invocation: true
allowed-tools: Bash
---

## Git 커밋 생성

아래 순서를 따라 커밋을 생성한다.

### 1. 현재 상태 파악

아래 명령어를 **병렬로** 실행한다:

- `git status` — 변경/추가/삭제된 파일 목록 확인
- `git diff --staged` + `git diff` — staged/unstaged 변경 내용 확인
- `git log --oneline -5` — 최근 커밋 메시지 스타일 참고

### 2. 커밋 메시지 작성

**Conventional Commits** 형식을 따른다:

```
<type>(<scope>): <subject>
```

| type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 (기능 변경 없음) |
| test | 테스트 추가/수정 |
| docs | 문서 변경 |
| chore | 빌드, 설정 등 기타 |

규칙:
- subject는 **영어**, 소문자로 시작, 마침표 없음
- 50자 이내로 간결하게
- "what"보다 "why"에 집중
- scope는 변경 대상 도메인이나 모듈 (예: member, board, auth, global)

### 3. 스테이징 + 커밋

- 관련 파일만 선택적으로 `git add` (민감 파일 `.env`, `credentials` 등 제외)
- HEREDOC으로 커밋 메시지 전달:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### 4. 결과 확인

커밋 후 `git status`로 정상 완료 확인.

### 주의사항

- push는 하지 않는다 (사용자가 명시적으로 요청한 경우만)
- pre-commit hook 실패 시 --amend 하지 않고 새 커밋을 만든다
- 변경 사항이 없으면 커밋하지 않는다
