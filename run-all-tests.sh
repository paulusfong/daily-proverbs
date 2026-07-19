#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🔒 DAILY PROVERBS - SECURITY & FUNCTIONALITY TEST SUITE"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "📍 Server Status:"
if curl -s http://localhost:8080 > /dev/null; then
    echo -e "${GREEN}✓${NC} Server running on http://localhost:8080"
else
    echo -e "${RED}✗${NC} Server NOT running"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1: Security Improvements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1.1: Content Security Policy (no unsafe-inline styles)
echo -n "1.1 Content Security Policy... "
if grep -q "Content-Security-Policy" index.html && ! grep -q "style-src[^;]*'unsafe-inline'" index.html; then
    echo -e "${GREEN}✓ PASS${NC}"
    CSP_PASS=1
else
    echo -e "${RED}✗ FAIL${NC}"
    CSP_PASS=0
fi

# Test 1.1b: No inline styles in HTML
echo -n "1.1b No inline style attributes... "
if ! grep -qE 'style="' index.html; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    CSP_PASS=0
fi

# Test 1.2: Language Validation (whitelist lives in app-logic.js)
echo -n "1.2 Language Input Validation... "
if grep -q "VALID_LANGUAGES" app-logic.js && grep -q "isValidLanguage" app.js app-logic.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    VALIDATION_PASS=1
else
    echo -e "${RED}✗ FAIL${NC}"
    VALIDATION_PASS=0
fi

# Test 1.3: XSS Prevention
echo -n "1.3 XSS Prevention (textContent)... "
TEXTCONTENT_COUNT=$(grep -c "textContent" app.js || true)
UNSAFE_PATTERNS=$(grep -cE "eval\(|Function\(|innerHTML\s*=" app.js 2>/dev/null || true)
UNSAFE_PATTERNS=${UNSAFE_PATTERNS:-0}
if [ "$TEXTCONTENT_COUNT" -gt 10 ] && [ "$UNSAFE_PATTERNS" -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} (textContent: ${TEXTCONTENT_COUNT}x)"
    XSS_PASS=1
else
    echo -e "${YELLOW}⚠ WARN${NC}"
    XSS_PASS=0
fi

# Test 1.4: No Dangerous JavaScript
echo -n "1.4 No eval/Function... "
if ! grep -qE "eval\(|new Function\(" app.js service-worker.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    NOEVAL_PASS=1
else
    echo -e "${RED}✗ FAIL${NC}"
    NOEVAL_PASS=0
fi

SECURITY_SCORE=$((CSP_PASS + VALIDATION_PASS + XSS_PASS + NOEVAL_PASS))
echo ""
echo -e "Security Score: ${SECURITY_SCORE}/4"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 2: Service Worker Updates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2.1: Cache Version
echo -n "2.1 Cache Version v5... "
if grep -q "daily-proverbs-v5" service-worker.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    CACHE_V2=1
else
    echo -e "${RED}✗ FAIL${NC}"
    CACHE_V2=0
fi

# Test 2.1b: app-logic.js precached
echo -n "2.1b app-logic.js in precache... "
if grep -q "app-logic.js" service-worker.js; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2.1c: Network-first for HTML/JS
echo -n "2.1c Network-first for shell assets... "
if grep -q "networkFirst" service-worker.js && grep -q "isNetworkFirst" service-worker.js; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2.2: All Language Files Cached
echo -n "2.2 All Language Files in Cache... "
LANG_FILES=("proverbs-en.json" "proverbs-zh.json" "proverbs-es.json" "proverbs-fr.json")
ALL_CACHED=1
for file in "${LANG_FILES[@]}"; do
    if ! grep -q "$file" service-worker.js; then
        ALL_CACHED=0
        break
    fi
done

if [ $ALL_CACHED -eq 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2.3: Translations.js Cached
echo -n "2.3 translations.js in Cache... "
if grep -q "translations.js" service-worker.js; then
    echo -e "${GREEN}✓ PASS${NC}"
    TRANS_CACHED=1
else
    echo -e "${RED}✗ FAIL${NC}"
    TRANS_CACHED=0
fi

SW_SCORE=$((CACHE_V2 + ALL_CACHED + TRANS_CACHED))
echo ""
echo -e "Service Worker Score: ${SW_SCORE}/3"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 3: Language Data Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LANG_SCORE=0

# Test each language file
for lang in en zh es fr; do
    echo -n "3.$((LANG_SCORE + 1)) ${lang} data file... "
    if [ -f "data/proverbs-${lang}.json" ]; then
        # Try to parse JSON
        if node -e "JSON.parse(require('fs').readFileSync('data/proverbs-${lang}.json', 'utf8'))" 2>/dev/null; then
            CHAPTERS=$(node -e "const d=JSON.parse(require('fs').readFileSync('data/proverbs-${lang}.json','utf8')); console.log(d.chapters.length)")
            echo -e "${GREEN}✓ PASS${NC} (${CHAPTERS} chapters)"
            LANG_SCORE=$((LANG_SCORE + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (File not found)"
    fi
done

echo ""
echo -e "Language Data Score: ${LANG_SCORE}/4"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 4: Chinese Font Support"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4.1: Chinese Font Stack
echo -n "4.1 Chinese Font Stack... "
if grep -q "Noto Sans SC" styles.css && grep -q "Microsoft YaHei" styles.css; then
    echo -e "${GREEN}✓ PASS${NC}"
    FONT_STACK=1
else
    echo -e "${RED}✗ FAIL${NC}"
    FONT_STACK=0
fi

# Test 4.2: Language Selector
echo -n "4.2 CSS Language Selector... "
if grep -q 'html\[lang="zh"\]' styles.css; then
    echo -e "${GREEN}✓ PASS${NC}"
    LANG_SELECTOR=1
else
    echo -e "${RED}✗ FAIL${NC}"
    LANG_SELECTOR=0
fi

# Test 4.3: Letter Spacing
echo -n "4.3 Chinese Letter Spacing... "
if grep -q "letter-spacing.*0.05em" styles.css; then
    echo -e "${GREEN}✓ PASS${NC}"
    LETTER_SPACE=1
else
    echo -e "${RED}✗ FAIL${NC}"
    LETTER_SPACE=0
fi

FONT_SCORE=$((FONT_STACK + LANG_SELECTOR + LETTER_SPACE))
echo ""
echo -e "Font Support Score: ${FONT_SCORE}/3"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 5: Accessibility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 5.1: Touch Targets
echo -n "5.1 Touch Target Size (44px)... "
if grep -q "44px" styles.css; then
    echo -e "${GREEN}✓ PASS${NC}"
    TOUCH_TARGET=1
else
    echo -e "${RED}✗ FAIL${NC}"
    TOUCH_TARGET=0
fi

# Test 5.2: Focus Visible
echo -n "5.2 Focus-Visible States... "
if grep -q "focus-visible" styles.css; then
    echo -e "${GREEN}✓ PASS${NC}"
    FOCUS_VIS=1
else
    echo -e "${RED}✗ FAIL${NC}"
    FOCUS_VIS=0
fi

A11Y_SCORE=$((TOUCH_TARGET + FOCUS_VIS))
echo ""
echo -e "Accessibility Score: ${A11Y_SCORE}/2"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📊 FINAL RESULTS"
echo "════════════════════════════════════════════════════════════"
echo ""

TOTAL_SCORE=$((SECURITY_SCORE + SW_SCORE + LANG_SCORE + FONT_SCORE + A11Y_SCORE))
TOTAL_TESTS=16

echo "Security Improvements:    ${SECURITY_SCORE}/4"
echo "Service Worker Updates:   ${SW_SCORE}/3"
echo "Language Data:            ${LANG_SCORE}/4"
echo "Chinese Font Support:     ${FONT_SCORE}/3"
echo "Accessibility:            ${A11Y_SCORE}/2"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PERCENTAGE=$((TOTAL_SCORE * 100 / TOTAL_TESTS))
echo -e "Overall Score: ${BLUE}${TOTAL_SCORE}/${TOTAL_TESTS}${NC} (${PERCENTAGE}%)"

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "Status: ${GREEN}🎉 PERFECT! ALL TESTS PASSED${NC}"
    GRADE="A+"
elif [ $PERCENTAGE -ge 90 ]; then
    echo -e "Status: ${GREEN}✓ EXCELLENT${NC}"
    GRADE="A"
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "Status: ${GREEN}✓ GOOD${NC}"
    GRADE="B+"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "Status: ${YELLOW}⚠ ACCEPTABLE${NC}"
    GRADE="B"
else
    echo -e "Status: ${RED}✗ NEEDS IMPROVEMENT${NC}"
    GRADE="C"
fi

echo -e "Grade: ${BLUE}${GRADE}${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "  • Manual testing: http://localhost:8080"
echo "  • Language suite: node test-languages-simple.js (server must be running)"
echo "  • Check console for CSP violations"
echo ""
echo "📄 Documentation:"
echo "  • SECURITY-AUDIT.md - Full security analysis"
echo "  • SECURITY-COMPLETE.md - Executive summary"
echo "  • demo-materials/ - Demo scripts and screenshot tooling"
echo ""

