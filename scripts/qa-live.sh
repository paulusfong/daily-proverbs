#!/usr/bin/env bash
# Live-site smoke QA for Daily Proverbs
# Usage: ./scripts/qa-live.sh [base-url]
set -euo pipefail

BASE="${1:-https://paulusfong.github.io/daily-proverbs}"
BASE="${BASE%/}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0

check() {
  local name="$1"
  shift
  if "$@"; then
    echo -e "${GREEN}✓${NC} $name"
    pass=$((pass + 1))
  else
    echo -e "${RED}✗${NC} $name"
    fail=$((fail + 1))
  fi
}

echo "════════════════════════════════════════"
echo "  Daily Proverbs — live QA"
echo "  $BASE"
echo "════════════════════════════════════════"
echo ""

PATHS=(
  "/"
  "/index.html"
  "/app.js"
  "/app-logic.js"
  "/styles.css"
  "/translations.js"
  "/service-worker.js"
  "/manifest.json"
  "/data/proverbs-en.json"
  "/data/proverbs-zh.json"
  "/data/proverbs-es.json"
  "/data/proverbs-fr.json"
  "/icons/icon-192.png"
)

echo "HTTP assets"
for path in "${PATHS[@]}"; do
  code=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 20 "${BASE}${path}" || echo "000")
  check "GET ${path} → ${code}" test "$code" = "200"
done

echo ""
echo "App shell markers"
html=$(curl -sL --max-time 20 "${BASE}/")
check "SVG icon sprite" grep -q 'id="icon-book"' <<<"$html"
check "Toast region" grep -q 'id="toast"' <<<"$html"
check "Language selector" grep -q 'id="languageSelector"' <<<"$html"
check "app-logic.js" grep -q 'app-logic.js' <<<"$html"
check "CSP meta" grep -q 'Content-Security-Policy' <<<"$html"

echo ""
echo "Service worker"
sw=$(curl -sL --max-time 20 "${BASE}/service-worker.js")
check "Cache name present" grep -q 'daily-proverbs-v' <<<"$sw"
check "Scope-relative precache" grep -q 'registration.scope' <<<"$sw"
check "Network-first shell" grep -q 'networkFirst' <<<"$sw"

echo ""
echo "Language data parity"
expected=142
for lang in en zh es fr; do
  count=$(curl -sL --max-time 20 "${BASE}/data/proverbs-${lang}.json" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(len(c['verses']) for c in d['chapters']))" 2>/dev/null || echo 0)
  check "${lang} verses == ${expected} (got ${count})" test "$count" = "$expected"
done

echo ""
echo "Response headers (informational)"
headers=$(curl -sI --max-time 20 "${BASE}/" || true)
if echo "$headers" | grep -qi 'content-security-policy:'; then
  echo -e "${GREEN}✓${NC} CSP HTTP header present"
  pass=$((pass + 1))
else
  echo -e "${YELLOW}⚠${NC} CSP HTTP header missing (meta CSP only — expected on GitHub Pages)"
fi
if echo "$headers" | grep -qi 'strict-transport-security:'; then
  echo -e "${GREEN}✓${NC} HSTS present"
  pass=$((pass + 1))
else
  echo -e "${YELLOW}⚠${NC} HSTS not present"
fi

echo ""
echo "════════════════════════════════════════"
echo "  Passed: $pass   Failed: $fail"
if [ "$fail" -eq 0 ]; then
  echo -e "  Status: ${GREEN}OK${NC}"
  exit 0
fi
echo -e "  Status: ${RED}FAILED${NC}"
exit 1
