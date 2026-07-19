// Constants (pure logic lives in app-logic.js → AppLogic)
const VALID_LANGUAGES = AppLogic.VALID_LANGUAGES;
const FAVORITES_STORAGE_KEY = 'favorites';

// App State
let proverbsData = null;
let currentView = 'daily';
let currentChapter = null;
/** @type {{ chapter: number, verse: number, text: string, language: string } | null} */
let currentVerse = null;
let theme = localStorage.getItem('theme') || 'light';
let currentLanguage = localStorage.getItem('language') || 'en';
let favorites = loadFavorites();

// Validate stored language on startup
if (!AppLogic.isValidLanguage(currentLanguage)) {
    console.warn('Invalid language in localStorage:', currentLanguage);
    currentLanguage = 'en';
    localStorage.setItem('language', 'en');
}

// --- Favorites helpers (thin wrappers around AppLogic + localStorage) ---

function loadFavorites() {
    try {
        return AppLogic.parseFavorites(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    } catch (error) {
        console.warn('Failed to parse favorites; resetting', error);
        return [];
    }
}

function isFavorite(verse) {
    return AppLogic.isFavorite(favorites, verse);
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function favoritesForCurrentLanguage() {
    return AppLogic.favoritesForLanguage(favorites, currentLanguage);
}

// --- i18n helpers ---

function t(key) {
    return getTranslation(currentLanguage, key);
}

function getCurrentLanguageMeta() {
    return translations[currentLanguage];
}

function formatReference(chapter, verse) {
    return `${t('proverbsChapter')} ${chapter}:${verse}`;
}

// --- Data loading ---

async function loadProverbsData(lang) {
    const dataFile = `data/proverbs-${lang}.json`;
    const response = await fetch(dataFile);
    if (!response.ok) {
        throw new Error(`Failed to load ${dataFile} (${response.status})`);
    }
    return response.json();
}

// Initialize App
async function init() {
    try {
        proverbsData = await loadProverbsData(currentLanguage);

        applyTheme(theme);
        updateUITranslations();
        displayDailyVerse();
        setupEventListeners();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(() => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed', err));
        }
    } catch (error) {
        console.error('Failed to load Proverbs data:', error);
        document.getElementById('verseText').textContent = t('errorLoading');
    }
}

let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast || !message) return;

    toast.textContent = message;
    toast.hidden = false;
    // Force reflow so transition runs when re-showing
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => {
            if (!toast.classList.contains('is-visible')) {
                toast.hidden = true;
            }
        }, 250);
    }, 2400);
}

function setVerseLoading(isLoading) {
    const card = document.getElementById('verseCard');
    if (!card) return;
    card.classList.toggle('is-loading', Boolean(isLoading));
}

function setUseHref(useEl, iconId) {
    if (!useEl) return;
    useEl.setAttribute('href', iconId);
    useEl.setAttribute('xlink:href', iconId);
}

// Change language
async function changeLanguage(lang) {
    if (!AppLogic.isValidLanguage(lang)) {
        console.warn('Invalid language attempted:', lang);
        return;
    }

    currentLanguage = lang;
    localStorage.setItem('language', lang);
    setVerseLoading(true);

    try {
        proverbsData = await loadProverbsData(currentLanguage);
        updateUITranslations();

        if (currentView === 'daily') {
            displayDailyVerse();
        } else if (currentView === 'browse') {
            if (currentChapter) {
                displayChapterVerses(currentChapter);
            } else {
                displayChapters();
            }
        } else if (currentView === 'favorites') {
            displayFavorites();
        }
    } catch (error) {
        console.error('Failed to load language data:', error);
        showToast(t('errorLoading'));
    } finally {
        setVerseLoading(false);
    }
}

// Update all UI translations
function updateUITranslations() {
    const langMeta = getCurrentLanguageMeta();

    document.querySelector('.logo span').textContent = t('appName');
    document.getElementById('themeToggle').setAttribute('aria-label', t('toggleTheme'));
    document.getElementById('themeToggle').setAttribute('title', t('toggleTheme'));
    document.getElementById('languageSelector').setAttribute('aria-label', t('selectLanguage'));

    document.querySelector('[data-view="daily"] span:last-child').textContent = t('navToday');
    document.querySelector('[data-view="browse"] span:last-child').textContent = t('navBrowse');
    document.querySelector('[data-view="favorites"] span:last-child').textContent = t('navFavorites');

    const favoriteBtn = document.getElementById('favoriteBtn');
    const favorited = isFavorite(currentVerse);
    favoriteBtn.setAttribute(
        'title',
        favorited ? t('removeFromFavorites') : t('addToFavorites')
    );
    favoriteBtn.setAttribute(
        'aria-label',
        favorited ? t('removeFromFavorites') : t('addToFavorites')
    );

    document.getElementById('shareBtn').setAttribute('title', t('shareVerse'));
    document.getElementById('shareBtn').setAttribute('aria-label', t('shareVerse'));

    const chapterSelectHeader = document.querySelector('#chapterSelect h2');
    if (chapterSelectHeader) {
        chapterSelectHeader.textContent = t('selectChapter');
    }

    const browseNote = document.getElementById('browseNote');
    if (browseNote) {
        browseNote.textContent = t('selectedVersesNote');
    }

    const backLabel = document.getElementById('backToChaptersLabel');
    if (backLabel) {
        backLabel.textContent = t('backToChapters');
    }

    const favoritesHeader = document.querySelector('#favoritesView > h2');
    if (favoritesHeader) {
        favoritesHeader.textContent = t('favoriteVerses');
    }

    const emptyStateText = document.querySelector('.empty-state-text');
    if (emptyStateText) {
        emptyStateText.replaceChildren();
        emptyStateText.appendChild(document.createTextNode(t('noFavorites')));
        emptyStateText.appendChild(document.createElement('br'));
        emptyStateText.appendChild(document.createTextNode(t('tapHeart')));
    }

    // Keep displayed reference/version in sync when language changes
    // while a non-daily verse is showing (browse/favorites selection).
    if (currentVerse && currentVerse.language === currentLanguage) {
        document.getElementById('verseReference').textContent =
            formatReference(currentVerse.chapter, currentVerse.verse);
        document.querySelector('.verse-version').textContent = langMeta.bibleVersion;
    }

    document.documentElement.setAttribute('lang', langMeta.code);
}

function getTodayVerse() {
    return AppLogic.getTodayVerse(proverbsData, new Date(), currentLanguage);
}

function setCurrentVerse(verse) {
    currentVerse = verse
        ? {
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
            language: verse.language || currentLanguage
        }
        : null;
}

function showVerse(verse) {
    setCurrentVerse(verse);
    const langMeta = getCurrentLanguageMeta();

    document.getElementById('verseReference').textContent =
        formatReference(verse.chapter, verse.verse);
    document.getElementById('verseText').textContent = verse.text;
    document.querySelector('.verse-version').textContent = langMeta.bibleVersion;
    updateFavoriteButton(verse);
}

// Display daily verse
function displayDailyVerse() {
    const todayVerse = getTodayVerse();
    const today = new Date();
    const langMeta = getCurrentLanguageMeta();

    document.getElementById('verseDate').textContent =
        today.toLocaleDateString(langMeta.locale, langMeta.ui.dateOptions);

    if (!todayVerse) {
        document.getElementById('verseReference').textContent = '';
        document.getElementById('verseText').textContent = t('errorLoading');
        document.querySelector('.verse-version').textContent = langMeta.bibleVersion;
        setCurrentVerse(null);
        updateFavoriteButton(null);
        return;
    }

    showVerse(todayVerse);
}

// Update favorite button (SVG icon, not emoji)
function updateFavoriteButton(verse) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favorited = isFavorite(verse);
    const useEl = favoriteBtn.querySelector('use');

    favoriteBtn.classList.toggle('active', favorited);
    setUseHref(useEl, favorited ? '#icon-heart-filled' : '#icon-heart');
    favoriteBtn.setAttribute(
        'title',
        favorited ? t('removeFromFavorites') : t('addToFavorites')
    );
    favoriteBtn.setAttribute(
        'aria-label',
        favorited ? t('removeFromFavorites') : t('addToFavorites')
    );
    favoriteBtn.setAttribute('aria-pressed', favorited ? 'true' : 'false');
}

// Toggle favorite from structured currentVerse (never parse DOM)
function toggleFavorite() {
    if (!currentVerse) return;

    favorites = AppLogic.toggleFavoriteInList(favorites, currentVerse);
    saveFavorites();
    updateFavoriteButton(currentVerse);

    if (currentView === 'favorites') {
        displayFavorites();
    }
}

// Share verse from state
async function shareVerse() {
    if (!currentVerse) return;

    const langMeta = getCurrentLanguageMeta();
    const reference = formatReference(currentVerse.chapter, currentVerse.verse);
    const shareText = `${currentVerse.text}\n\n— ${reference} (${langMeta.bibleVersion})`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: t('appName'),
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(t('verseCopied'));
    }).catch(() => {
        showToast(t('copyFailed'));
    });
}

// Theme management
function applyTheme(newTheme) {
    theme = newTheme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeUse = document.querySelector('#themeIcon use');
    // In dark mode, offer sun (switch to light); in light mode, offer moon
    setUseHref(themeUse, theme === 'dark' ? '#icon-sun' : '#icon-moon');
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
}

// Navigation
function switchView(viewName) {
    currentView = viewName;

    document.getElementById('dailyView').classList.remove('active');
    document.getElementById('browseView').classList.remove('active');
    document.getElementById('favoritesView').classList.remove('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const viewMap = {
        daily: 'dailyView',
        browse: 'browseView',
        favorites: 'favoritesView'
    };

    document.getElementById(viewMap[viewName]).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    if (viewName === 'browse') {
        displayChapters();
    } else if (viewName === 'favorites') {
        displayFavorites();
    }
}

function clearElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

/** Build a safe verse list row without innerHTML. */
function createVerseItem(chapter, verseNum, text, onSelect) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'verse-item';

    const ref = document.createElement('div');
    ref.className = 'verse-item-ref';
    ref.textContent = formatReference(chapter, verseNum);

    const body = document.createElement('div');
    body.className = 'verse-item-text';
    body.textContent = text;

    item.appendChild(ref);
    item.appendChild(body);
    item.addEventListener('click', onSelect);
    return item;
}

// Display chapters
function displayChapters() {
    const chapterGrid = document.getElementById('chapterGrid');
    clearElement(chapterGrid);

    document.getElementById('chapterSelect').classList.remove('hidden');
    document.getElementById('verseSelect').classList.add('hidden');

    const browseNote = document.getElementById('browseNote');
    if (browseNote) {
        browseNote.textContent = t('selectedVersesNote');
    }

    proverbsData.chapters.forEach(chapter => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chapter-btn';
        btn.textContent = String(chapter.chapter);
        btn.setAttribute(
            'aria-label',
            `${t('proverbsChapter')} ${chapter.chapter} (${chapter.verses.length})`
        );
        btn.addEventListener('click', () => displayChapterVerses(chapter.chapter));
        chapterGrid.appendChild(btn);
    });
}

// Display verses for a chapter
function displayChapterVerses(chapterNum) {
    currentChapter = chapterNum;
    const chapter = proverbsData.chapters.find(ch => ch.chapter === chapterNum);

    document.getElementById('chapterTitle').textContent =
        `${t('proverbsChapter')} ${chapterNum}`;
    document.getElementById('chapterSelect').classList.add('hidden');
    document.getElementById('verseSelect').classList.remove('hidden');

    const verseList = document.getElementById('verseList');
    clearElement(verseList);

    if (!chapter || !chapter.verses) return;

    chapter.verses.forEach(verse => {
        const item = createVerseItem(chapterNum, verse.verse, verse.text, () => {
            showVerse({
                chapter: chapterNum,
                verse: verse.verse,
                text: verse.text,
                language: currentLanguage
            });
            switchView('daily');
        });
        verseList.appendChild(item);
    });
}

// Display favorites for the current language only
function displayFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const emptyState = document.getElementById('emptyFavorites');
    const langFavorites = favoritesForCurrentLanguage();

    clearElement(favoritesList);

    if (langFavorites.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    langFavorites.forEach(fav => {
        const item = createVerseItem(fav.chapter, fav.verse, fav.text, () => {
            showVerse(fav);
            switchView('daily');
        });
        favoritesList.appendChild(item);
    });
}

// Setup event listeners
function setupEventListeners() {
    const languageSelector = document.getElementById('languageSelector');
    languageSelector.value = currentLanguage;
    languageSelector.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite);
    document.getElementById('shareBtn').addEventListener('click', shareVerse);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    document.getElementById('backToChapters').addEventListener('click', displayChapters);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
