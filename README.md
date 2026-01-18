# Daily Proverbs - ESV Bible

A beautiful Progressive Web App that delivers daily inspirational verses from the Book of Proverbs (ESV Bible).

![Daily Proverbs App](icons/icon-192.png)

## ✨ Features

- **📖 Daily Verses**: Automatically displays verses from Proverbs based on the day of the month (1-31)
- **🎨 Beautiful Design**: Premium glassmorphism UI with vibrant purple-gold gradients
- **📚 Browse Mode**: Explore all 31 chapters of Proverbs
- **❤️ Favorites**: Save and access your favorite verses
- **🌓 Dark/Light Themes**: Toggle between beautiful light and dark modes
- **📱 Offline Support**: Full functionality without internet connection
- **🏠 Installable**: Add to your phone's home screen like a native app

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local development server)

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/daily-proverbs.git
   cd daily-proverbs
   ```

2. Start a local server:
   ```bash
   python -m http.server 8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Installing as PWA

**On Desktop (Chrome/Edge):**
1. Click the install icon in the address bar
2. Click "Install" in the prompt
3. App opens in standalone window

**On Mobile (iOS/Android):**
1. Open in Safari (iOS) or Chrome (Android)
2. Tap Share → Add to Home Screen
3. App icon appears on home screen
4. Opens like a native app

## 📁 Project Structure

```
daily-proverbs/
├── index.html              # Main HTML structure
├── styles.css              # Design system with glassmorphism
├── app.js                  # Application logic
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline functionality
├── data/
│   └── proverbs-esv.json  # ESV Proverbs data (31 chapters)
└── icons/
    ├── icon-192.png       # App icon (192x192)
    └── icon-512.png       # App icon (512x512)
```

## 🎨 Design Features

- **Glassmorphism Effects**: Frosted glass cards with backdrop blur
- **Vibrant Gradients**: Purple to gold gradient theme
- **Premium Typography**: Serif fonts for verse text, sans-serif for UI
- **Smooth Animations**: Fade-in transitions and hover effects
- **Responsive Layout**: Mobile-first design that scales beautifully

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Custom properties, gradients, animations
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Service Workers**: Offline functionality
- **Web App Manifest**: PWA capabilities
- **LocalStorage**: Persistent favorites and preferences

## 📖 Bible Version

This app uses the **English Standard Version (ESV)** of the Bible for all Proverbs verses.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- ESV Bible text
- Inspired by the wisdom of the Book of Proverbs
- Built with modern web technologies

## 📱 Screenshots

### Light Mode
Beautiful gradient background with glassmorphism card design.

### Dark Mode
Elegant dark theme with high contrast for comfortable reading.

### Browse Mode
Explore all 31 chapters of Proverbs in an accessible grid layout.

---

**Made with ❤️ for daily inspiration from God's Word**
