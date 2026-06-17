#!/usr/bin/env bash
# GitHub origin(main) 동기화 헬퍼
# 사용: bash scripts/push-github.sh
# - gh 토큰을 credential 파일에 주입 후 로컬 main을 GitHub origin/main에 push
# - fast-forward 가능 여부를 먼저 검증해 강제 push 없이 안전하게 반영
set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH="${1:-main}"

echo "===== [1/4] gh 토큰 주입 ====="
TOKEN="$(gh auth token 2>/dev/null || true)"
if [ -z "$TOKEN" ]; then
  echo "❌ gh 토큰을 가져올 수 없습니다. 먼저 GitHub 인증(setup_github_environment)을 확인하세요."
  exit 1
fi
echo "https://x-access-token:${TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
git config credential.helper store >/dev/null 2>&1 || true
echo "✅ 토큰 주입 완료"

echo "===== [2/4] origin fetch & 안전성 검증 ====="
git fetch origin "$BRANCH" 2>&1 || true
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  if git merge-base --is-ancestor "origin/$BRANCH" HEAD; then
    echo "✅ fast-forward 가능 (안전한 push)"
  else
    echo "⚠️  origin/$BRANCH 가 로컬과 분기됨. 강제 push가 필요할 수 있어 중단합니다."
    echo "    수동 확인: git log --oneline origin/$BRANCH..HEAD"
    exit 2
  fi
else
  echo "ℹ️  origin/$BRANCH 없음 → 신규 브랜치로 push"
fi

echo "===== [3/4] push ====="
git push origin "$BRANCH" 2>&1

echo "===== [4/4] 동기화 검증 ====="
REMOTE="$(git ls-remote origin "$BRANCH" | awk '{print $1}')"
LOCAL="$(git rev-parse HEAD)"
if [ "$REMOTE" = "$LOCAL" ]; then
  echo "✅ 완전 동기화: GitHub origin/$BRANCH == 로컬 == $LOCAL"
else
  echo "❌ 불일치: origin=$REMOTE local=$LOCAL"
  exit 3
fi
