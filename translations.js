// Translation System for Daily Proverbs
// Supports multiple languages with UI strings and metadata

const translations = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        locale: 'en-US',
        bibleVersion: 'WEB',
        ui: {
            // Header
            appName: 'Daily Proverbs',

            // Navigation
            navToday: 'Today',
            navBrowse: 'Browse',
            navFavorites: 'Favorites',

            // Daily View
            loading: 'Loading...',
            loadingVerse: 'Loading verse...',
            errorLoading: 'Failed to load verses. Please refresh the page.',

            // Buttons & Actions
            toggleTheme: 'Toggle theme',
            addToFavorites: 'Add to favorites',
            removeFromFavorites: 'Remove from favorites',
            shareVerse: 'Share verse',
            selectLanguage: 'Select language',

            // Browse View
            selectChapter: 'Select a Chapter',
            selectedVersesNote: 'Selected verses from each chapter (not the full book).',
            backToChapters: 'Back to Chapters',
            proverbsChapter: 'Proverbs',

            // Favorites View
            favoriteVerses: 'Favorite Verses',
            noFavorites: 'No favorite verses yet.',
            tapHeart: 'Tap the heart icon to save verses.',

            // Legal
            scriptureNotice: 'English Scripture: World English Bible (WEB), public domain. Other languages: see About.',
            aboutTitle: 'About',

            // Share
            verseCopied: 'Verse copied to clipboard!',
            copyFailed: 'Failed to copy verse',

            // Date formatting
            dateOptions: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        }
    },

    zh: {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        direction: 'ltr',
        locale: 'zh-CN',
        bibleVersion: '和合本',
        ui: {
            // Header
            appName: '每日箴言',

            // Navigation
            navToday: '今日',
            navBrowse: '浏览',
            navFavorites: '收藏',

            // Daily View
            loading: '加载中...',
            loadingVerse: '加载经文...',
            errorLoading: '加载失败，请刷新页面。',

            // Buttons & Actions
            toggleTheme: '切换主题',
            addToFavorites: '添加到收藏',
            removeFromFavorites: '从收藏中移除',
            shareVerse: '分享经文',
            selectLanguage: '选择语言',

            // Browse View
            selectChapter: '选择章节',
            selectedVersesNote: '各章精选经文（非全书全文）。',
            backToChapters: '返回章节',
            proverbsChapter: '箴言',

            // Favorites View
            favoriteVerses: '收藏的经文',
            noFavorites: '还没有收藏的经文。',
            tapHeart: '点击心形图标保存经文。',

            // Legal
            scriptureNotice: '英文经文：World English Bible（WEB），公有领域。其他语言译本见关于说明。',
            aboutTitle: '关于',

            // Share
            verseCopied: '经文已复制到剪贴板！',
            copyFailed: '复制失败',

            // Date formatting
            dateOptions: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            }
        }
    },

    es: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        locale: 'es-ES',
        bibleVersion: 'RVR',
        ui: {
            // Header
            appName: 'Proverbios Diarios',

            // Navigation
            navToday: 'Hoy',
            navBrowse: 'Explorar',
            navFavorites: 'Favoritos',

            // Daily View
            loading: 'Cargando...',
            loadingVerse: 'Cargando versículo...',
            errorLoading: 'Error al cargar los versículos. Por favor, actualice la página.',

            // Buttons & Actions
            toggleTheme: 'Cambiar tema',
            addToFavorites: 'Añadir a favoritos',
            removeFromFavorites: 'Quitar de favoritos',
            shareVerse: 'Compartir versículo',
            selectLanguage: 'Seleccionar idioma',

            // Browse View
            selectChapter: 'Seleccionar un Capítulo',
            selectedVersesNote: 'Versículos seleccionados de cada capítulo (no el libro completo).',
            backToChapters: 'Volver a Capítulos',
            proverbsChapter: 'Proverbios',

            // Favorites View
            favoriteVerses: 'Versículos Favoritos',
            noFavorites: 'Aún no hay versículos favoritos.',
            tapHeart: 'Toca el ícono del corazón para guardar versículos.',

            // Legal
            scriptureNotice: 'Escritura en inglés: World English Bible (WEB), dominio público. Otros idiomas: ver Acerca de.',
            aboutTitle: 'Acerca de',

            // Share
            verseCopied: '¡Versículo copiado al portapapeles!',
            copyFailed: 'Error al copiar versículo',

            // Date formatting
            dateOptions: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        }
    },

    fr: {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        locale: 'fr-FR',
        bibleVersion: 'LSG',
        ui: {
            // Header
            appName: 'Proverbes Quotidiens',

            // Navigation
            navToday: "Aujourd'hui",
            navBrowse: 'Parcourir',
            navFavorites: 'Favoris',

            // Daily View
            loading: 'Chargement...',
            loadingVerse: 'Chargement du verset...',
            errorLoading: 'Échec du chargement des versets. Veuillez actualiser la page.',

            // Buttons & Actions
            toggleTheme: 'Changer le thème',
            addToFavorites: 'Ajouter aux favoris',
            removeFromFavorites: 'Retirer des favoris',
            shareVerse: 'Partager le verset',
            selectLanguage: 'Sélectionner la langue',

            // Browse View
            selectChapter: 'Sélectionner un Chapitre',
            selectedVersesNote: 'Versets sélectionnés de chaque chapitre (pas le livre entier).',
            backToChapters: 'Retour aux Chapitres',
            proverbsChapter: 'Proverbes',

            // Favorites View
            favoriteVerses: 'Versets Favoris',
            noFavorites: 'Aucun verset favori pour le moment.',
            tapHeart: "Appuyez sur l'icône du cœur pour enregistrer des versets.",

            // Legal
            scriptureNotice: 'Écriture en anglais : World English Bible (WEB), domaine public. Autres langues : voir À propos.',
            aboutTitle: 'À propos',

            // Share
            verseCopied: 'Verset copié dans le presse-papiers !',
            copyFailed: 'Échec de la copie du verset',

            // Date formatting
            dateOptions: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        }
    }
};

// Helper function to get translation
function getTranslation(lang, key) {
    const keys = key.split('.');
    let value = translations[lang]?.ui;

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    return value || key;
}

// Get available languages
function getAvailableLanguages() {
    return Object.keys(translations).map(code => ({
        code,
        name: translations[code].name,
        nativeName: translations[code].nativeName
    }));
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, getTranslation, getAvailableLanguages };
}
