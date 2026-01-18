// App State
let proverbsData = null;
let currentView = 'daily';
let currentChapter = null;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let theme = localStorage.getItem('theme') || 'light';

// Initialize App
async function init() {
    // Load Proverbs data
    try {
        const response = await fetch('data/proverbs-esv.json');
        proverbsData = await response.json();

        // Set theme
        applyTheme(theme);

        // Display daily verse
        displayDailyVerse();

        // Setup event listeners
        setupEventListeners();

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed'));
        }
    } catch (error) {
        console.error('Failed to load Proverbs data:', error);
        document.getElementById('verseText').textContent = 'Failed to load verses. Please refresh the page.';
    }
}

// Get today's verse based on day of month
function getTodayVerse() {
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1-31

    // Get chapter based on day (1-31)
    const chapterIndex = Math.min(dayOfMonth, 31) - 1;
    const chapter = proverbsData.chapters[chapterIndex];

    // Get a random verse from the chapter
    const randomVerseIndex = Math.floor(Math.random() * chapter.verses.length);
    const verse = chapter.verses[randomVerseIndex];

    return {
        chapter: chapter.chapter,
        verse: verse.verse,
        text: verse.text
    };
}

// Display daily verse
function displayDailyVerse() {
    const todayVerse = getTodayVerse();
    const today = new Date();

    document.getElementById('verseDate').textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('verseReference').textContent = `Proverbs ${todayVerse.chapter}:${todayVerse.verse}`;
    document.getElementById('verseText').textContent = todayVerse.text;

    // Update favorite button state
    updateFavoriteButton(todayVerse);
}

// Update favorite button
function updateFavoriteButton(verse) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    const verseKey = `${verse.chapter}:${verse.verse}`;
    const isFavorite = favorites.some(fav => `${fav.chapter}:${fav.verse}` === verseKey);

    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.textContent = '❤️';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.textContent = '🤍';
    }
}

// Toggle favorite
function toggleFavorite() {
    const reference = document.getElementById('verseReference').textContent;
    const text = document.getElementById('verseText').textContent;
    const [book, chapterVerse] = reference.split(' ');
    const [chapter, verse] = chapterVerse.split(':').map(Number);

    const verseKey = `${chapter}:${verse}`;
    const existingIndex = favorites.findIndex(fav => `${fav.chapter}:${fav.verse}` === verseKey);

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({ chapter, verse, text });
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton({ chapter, verse });

    // Refresh favorites view if active
    if (currentView === 'favorites') {
        displayFavorites();
    }
}

// Share verse
async function shareVerse() {
    const reference = document.getElementById('verseReference').textContent;
    const text = document.getElementById('verseText').textContent;
    const shareText = `${text}\n\n— ${reference} (ESV)`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Daily Proverbs',
                text: shareText
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareText);
            }
        }
    } else {
        copyToClipboard(shareText);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Verse copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy verse');
    });
}

// Theme management
function applyTheme(newTheme) {
    theme = newTheme;
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
}

// Navigation
function switchView(viewName) {
    currentView = viewName;

    // Hide all views
    document.getElementById('dailyView').classList.remove('active');
    document.getElementById('browseView').classList.remove('active');
    document.getElementById('favoritesView').classList.remove('active');

    // Remove active state from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected view
    const viewMap = {
        'daily': 'dailyView',
        'browse': 'browseView',
        'favorites': 'favoritesView'
    };

    document.getElementById(viewMap[viewName]).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Load view content
    if (viewName === 'browse') {
        displayChapters();
    } else if (viewName === 'favorites') {
        displayFavorites();
    }
}

// Display chapters
function displayChapters() {
    const chapterGrid = document.getElementById('chapterGrid');
    chapterGrid.innerHTML = '';

    // Show chapter select, hide verse select
    document.getElementById('chapterSelect').classList.remove('hidden');
    document.getElementById('verseSelect').classList.add('hidden');

    proverbsData.chapters.forEach(chapter => {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn';
        btn.textContent = chapter.chapter;
        btn.onclick = () => displayChapterVerses(chapter.chapter);
        chapterGrid.appendChild(btn);
    });
}

// Display verses for a chapter
function displayChapterVerses(chapterNum) {
    currentChapter = chapterNum;
    const chapter = proverbsData.chapters.find(ch => ch.chapter === chapterNum);

    document.getElementById('chapterTitle').textContent = `Proverbs ${chapterNum}`;
    document.getElementById('chapterSelect').classList.add('hidden');
    document.getElementById('verseSelect').classList.remove('hidden');

    const verseList = document.getElementById('verseList');
    verseList.innerHTML = '';

    chapter.verses.forEach(verse => {
        const item = document.createElement('div');
        item.className = 'verse-item';
        item.innerHTML = `
      <div class="verse-item-ref">Proverbs ${chapterNum}:${verse.verse}</div>
      <div class="verse-item-text">${verse.text}</div>
    `;
        item.onclick = () => {
            // Show verse in daily view
            document.getElementById('verseReference').textContent = `Proverbs ${chapterNum}:${verse.verse}`;
            document.getElementById('verseText').textContent = verse.text;
            updateFavoriteButton({ chapter: chapterNum, verse: verse.verse });
            switchView('daily');
        };
        verseList.appendChild(item);
    });
}

// Display favorites
function displayFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const emptyState = document.getElementById('emptyFavorites');

    if (favorites.length === 0) {
        favoritesList.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        favoritesList.innerHTML = '';

        favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'verse-item';
            item.innerHTML = `
        <div class="verse-item-ref">Proverbs ${fav.chapter}:${fav.verse}</div>
        <div class="verse-item-text">${fav.text}</div>
      `;
            item.onclick = () => {
                // Show verse in daily view
                document.getElementById('verseReference').textContent = `Proverbs ${fav.chapter}:${fav.verse}`;
                document.getElementById('verseText').textContent = fav.text;
                updateFavoriteButton(fav);
                switchView('daily');
            };
            favoritesList.appendChild(item);
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);

    // Share button
    document.getElementById('shareBtn').addEventListener('click', shareVerse);

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Back to chapters
    document.getElementById('backToChapters').addEventListener('click', displayChapters);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
