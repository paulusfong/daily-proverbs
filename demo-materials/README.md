# Daily Proverbs - Demo Materials

This directory contains demo materials for the Daily Proverbs PWA.

## 📸 Screenshots

Screenshots are organized by feature:
- `screenshots/` - App screenshots in different languages and themes

## 🎥 Demo Video Script

See `demo-script.md` for a detailed walkthrough script.

## 📱 Features to Highlight

1. **Multi-Language Support**
   - English, Chinese (中文), Spanish (Español), French (Français)
   - Seamless language switching
   - Optimized typography for each language

2. **Beautiful Design**
   - Glassmorphism UI with purple-gold gradients
   - Light and dark themes
   - Smooth animations and transitions

3. **Progressive Web App**
   - Install on any device
   - Works offline
   - Fast and responsive

4. **Daily Inspiration**
   - New verse every day (1-31 chapters)
   - Browse all chapters
   - Save favorites

## 🔧 How to Create Screenshots

### Option 1: Browser DevTools (Recommended)
1. Open http://localhost:8080
2. Press F12 to open DevTools
3. Click device toolbar (Ctrl+Shift+M)
4. Select device (iPhone 14 Pro, Pixel 7, etc.)
5. Take screenshot: Ctrl+Shift+P → "Capture screenshot"

### Option 2: Using Puppeteer (Automated)
```bash
# From repo root, serve the app first:
python3 -m http.server 8080

# In another terminal:
cd demo-materials
npm install
npm run screenshots
```

The script switches languages via `#languageSelector` (the app does not read `?lang=` query params).

### Option 3: Manual Screenshots
1. Open app in browser
2. Use OS screenshot tool:
   - Mac: Cmd+Shift+4
   - Windows: Win+Shift+S
   - Linux: Shift+PrtSc

## 📐 Recommended Screenshot Sizes

- **Desktop:** 1920x1080
- **Tablet:** 1024x768
- **Mobile:** 375x812 (iPhone), 360x800 (Android)

## 🎬 Video Recording Tools

- **OBS Studio** (Free, cross-platform)
- **QuickTime Player** (Mac)
- **Xbox Game Bar** (Windows)
- **SimpleScreenRecorder** (Linux)

## 📋 Screenshot Checklist

- [ ] Daily verse view (English, light theme)
- [ ] Daily verse view (Chinese, light theme)
- [ ] Daily verse view (Spanish, dark theme)
- [ ] Daily verse view (French, dark theme)
- [ ] Browse chapters view
- [ ] Individual chapter view with verses
- [ ] Favorites view (empty state)
- [ ] Favorites view (with saved verses)
- [ ] Language selector dropdown
- [ ] Theme toggle demonstration
- [ ] Mobile viewport (375x812)
- [ ] Tablet viewport (768x1024)
- [ ] Desktop viewport (1920x1080)
- [ ] Installation prompt (if applicable)

