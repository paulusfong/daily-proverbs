#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

console.log('🧪 Daily Proverbs - Language Testing Suite\n');
console.log('Testing app at: http://localhost:8080\n');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
};

function addResult(name, status, details = {}) {
  testResults.tests.push({ name, status, details });
  testResults.summary[status === 'PASS' ? 'passed' : status === 'WARN' ? 'warnings' : 'failed']++;
}

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8080${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  try {
    // Test 1: Server is running
    console.log('📡 Test 1: Server Availability');
    try {
      const res = await makeRequest('/');
      if (res.status === 200) {
        console.log('  ✓ Server is responding (HTTP 200)');
        addResult('Server Availability', 'PASS');
      } else {
        console.log(`  ✗ Server returned HTTP ${res.status}`);
        addResult('Server Availability', 'FAIL', { status: res.status });
      }
    } catch (e) {
      console.log('  ✗ Server not accessible:', e.message);
      addResult('Server Availability', 'FAIL', { error: e.message });
      throw e;
    }
    
    // Test 2: HTML Structure
    console.log('\n📄 Test 2: HTML Structure');
    const indexRes = await makeRequest('/');
    const html = indexRes.data;
    
    const checks = {
      'Has DOCTYPE': /<!DOCTYPE html>/i.test(html),
      'Has language selector': /id="languageSelector"/i.test(html),
      'Has theme toggle': /id="themeToggle"/i.test(html),
      'Has navigation': /class="nav"/i.test(html),
      'Has verse container': /class="verse-container"/i.test(html),
      'Has daily container': /class="daily-container"/i.test(html),
      'Has browse container': /class="browse-container"/i.test(html),
      'Has favorites container': /class="favorites-container"/i.test(html)
    };
    
    let allPassed = true;
    Object.entries(checks).forEach(([check, result]) => {
      console.log(`  ${result ? '✓' : '✗'} ${check}`);
      if (!result) allPassed = false;
    });
    
    addResult('HTML Structure', allPassed ? 'PASS' : 'FAIL', checks);
    
    // Test 3: Required Files
    console.log('\n📦 Test 3: Required Files');
    const requiredFiles = [
      '/styles.css',
      '/app.js',
      '/translations.js',
      '/manifest.json',
      '/data/proverbs-en.json',
      '/data/proverbs-zh.json',
      '/data/proverbs-es.json',
      '/data/proverbs-fr.json'
    ];
    
    const fileResults = {};
    for (const file of requiredFiles) {
      try {
        const res = await makeRequest(file);
        const exists = res.status === 200;
        fileResults[file] = { exists, status: res.status, size: res.data.length };
        console.log(`  ${exists ? '✓' : '✗'} ${file} ${exists ? `(${res.data.length} bytes)` : `(HTTP ${res.status})`}`);
      } catch (e) {
        fileResults[file] = { exists: false, error: e.message };
        console.log(`  ✗ ${file} (${e.message})`);
      }
    }
    
    const allFilesExist = Object.values(fileResults).every(r => r.exists);
    addResult('Required Files', allFilesExist ? 'PASS' : 'FAIL', fileResults);
    
    // Test 4: Language Data Files Validation
    console.log('\n🌐 Test 4: Language Data Validation');
    const languages = ['en', 'zh', 'es', 'fr'];
    const dataValidation = {};
    
    for (const lang of languages) {
      try {
        const res = await makeRequest(`/data/proverbs-${lang}.json`);
        if (res.status === 200) {
          try {
            const data = JSON.parse(res.data);
            const isValid = data.book && data.version && Array.isArray(data.chapters);
            const chapterCount = data.chapters?.length || 0;
            
            dataValidation[lang] = {
              valid: isValid,
              book: data.book,
              version: data.version,
              chapters: chapterCount
            };
            
            console.log(`  ${isValid ? '✓' : '✗'} ${lang}: ${data.book} (${data.version}) - ${chapterCount} chapters`);
            
            if (lang === 'zh') {
              // Extra validation for Chinese
              const hasChineseText = data.chapters[0]?.verses[0]?.text?.match(/[\u4e00-\u9fa5]/);
              if (hasChineseText) {
                console.log(`    ✓ Contains Chinese characters`);
                console.log(`    Sample: ${data.chapters[0].verses[0].text.substring(0, 30)}...`);
              } else {
                console.log(`    ⚠ No Chinese characters detected`);
                dataValidation[lang].warning = 'No Chinese characters detected';
              }
            }
          } catch (e) {
            dataValidation[lang] = { valid: false, error: 'Invalid JSON: ' + e.message };
            console.log(`  ✗ ${lang}: Invalid JSON - ${e.message}`);
          }
        } else {
          dataValidation[lang] = { valid: false, status: res.status };
          console.log(`  ✗ ${lang}: HTTP ${res.status}`);
        }
      } catch (e) {
        dataValidation[lang] = { valid: false, error: e.message };
        console.log(`  ✗ ${lang}: ${e.message}`);
      }
    }
    
    const allDataValid = Object.values(dataValidation).every(d => d.valid);
    addResult('Language Data', allDataValid ? 'PASS' : 'FAIL', dataValidation);
    
    // Test 5: Translations File
    console.log('\n🗣️ Test 5: Translations Configuration');
    try {
      const res = await makeRequest('/translations.js');
      if (res.status === 200) {
        const content = res.data;
        
        const translationChecks = {
          'Has translations object': /const translations = {/.test(content),
          'Has English (en)': /en:\s*{/.test(content),
          'Has Chinese (zh)': /zh:\s*{/.test(content),
          'Has Spanish (es)': /es:\s*{/.test(content),
          'Has French (fr)': /fr:\s*{/.test(content),
          'Has getTranslation function': /function getTranslation/.test(content),
          'Has Chinese nativeName': /nativeName:\s*['"]中文['"]/.test(content)
        };
        
        let allChecksPass = true;
        Object.entries(translationChecks).forEach(([check, result]) => {
          console.log(`  ${result ? '✓' : '✗'} ${check}`);
          if (!result) allChecksPass = false;
        });
        
        addResult('Translations Config', allChecksPass ? 'PASS' : 'FAIL', translationChecks);
      }
    } catch (e) {
      console.log(`  ✗ Error loading translations: ${e.message}`);
      addResult('Translations Config', 'FAIL', { error: e.message });
    }
    
    // Test 6: CSS - Chinese Font Support
    console.log('\n🎨 Test 6: CSS Chinese Font Support');
    try {
      const res = await makeRequest('/styles.css');
      if (res.status === 200) {
        const css = res.data;
        
        const cssChecks = {
          'Has Noto Sans SC': css.includes('Noto Sans SC'),
          'Has Noto Serif SC': css.includes('Noto Serif SC'),
          'Has Microsoft YaHei': css.includes('Microsoft YaHei') || css.includes('微软雅黑'),
          'Has PingFang SC': css.includes('PingFang SC'),
          'Has Chinese lang selector': /html\[lang="zh"\]/.test(css),
          'Has Chinese verse styles': /html\[lang="zh"\].*\.verse-text/.test(css),
          'Has letter-spacing for Chinese': css.includes('letter-spacing') && /html\[lang="zh"\]/.test(css)
        };
        
        let allChecksPass = true;
        Object.entries(cssChecks).forEach(([check, result]) => {
          console.log(`  ${result ? '✓' : '✗'} ${check}`);
          if (!result) allChecksPass = false;
        });
        
        addResult('CSS Chinese Fonts', allChecksPass ? 'PASS' : 'WARN', cssChecks);
      }
    } catch (e) {
      console.log(`  ✗ Error loading CSS: ${e.message}`);
      addResult('CSS Chinese Fonts', 'FAIL', { error: e.message });
    }
    
    // Test 7: JavaScript Validation
    console.log('\n⚙️ Test 7: JavaScript Validation');
    try {
      const res = await makeRequest('/app.js');
      if (res.status === 200) {
        const js = res.data;
        
        const jsChecks = {
          'Has init function': /function init|async function init/.test(js),
          'Has changeLanguage function': /function changeLanguage|async function changeLanguage/.test(js),
          'Has updateUITranslations function': /function updateUITranslations/.test(js),
          'Has language whitelist': /VALID_LANGUAGES/.test(js),
          'Has favorites management': /favorites/.test(js) && /localStorage/.test(js),
          'Has theme toggle': /toggleTheme/.test(js),
          'Has service worker registration': /serviceWorker/.test(js)
        };
        
        let allChecksPass = true;
        Object.entries(jsChecks).forEach(([check, result]) => {
          console.log(`  ${result ? '✓' : '✗'} ${check}`);
          if (!result) allChecksPass = false;
        });
        
        addResult('JavaScript Functions', allChecksPass ? 'PASS' : 'FAIL', jsChecks);
      }
    } catch (e) {
      console.log(`  ✗ Error loading JavaScript: ${e.message}`);
      addResult('JavaScript Functions', 'FAIL', { error: e.message });
    }
    
  } catch (error) {
    console.error('\n❌ Fatal test error:', error.message);
    addResult('Test Execution', 'FAIL', { error: error.message });
  }
  
  // Print Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✓ Passed:   ${testResults.summary.passed}`);
  console.log(`⚠ Warnings: ${testResults.summary.warnings}`);
  console.log(`✗ Failed:   ${testResults.summary.failed}`);
  console.log('='.repeat(70));
  
  // Save results
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  console.log('\n💾 Full results saved to: test-results.json');
  
  // Language-specific summary
  console.log('\n🌍 LANGUAGE SUPPORT SUMMARY:');
  console.log('─'.repeat(70));
  
  const langTest = testResults.tests.find(t => t.name === 'Language Data');
  if (langTest && langTest.details) {
    Object.entries(langTest.details).forEach(([lang, info]) => {
      const status = info.valid ? '✓' : '✗';
      const langNames = { en: 'English', zh: 'Chinese (中文)', es: 'Spanish', fr: 'French' };
      console.log(`${status} ${langNames[lang]}: ${info.book || 'N/A'} - ${info.chapters || 0} chapters`);
      if (info.version) console.log(`  Version: ${info.version}`);
      if (info.warning) console.log(`  ⚠ ${info.warning}`);
    });
  }
  
  console.log('\n📌 Next Steps:');
  console.log('  • Open http://localhost:8080 in a browser');
  console.log('  • Test language switching using the dropdown');
  console.log('  • Verify Chinese fonts render correctly');
  console.log('  • Test theme toggle (light/dark)');
  console.log('  • Test navigation between Today/Browse/Favorites');
  console.log('  • Test on mobile viewport (resize browser)\n');
  
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
