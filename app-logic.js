/**
 * Pure app logic for Daily Proverbs — no DOM, no localStorage.
 * Usable in the browser (global) and in Node tests (module.exports).
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.AppLogic = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const VALID_LANGUAGES = ['en', 'zh', 'es', 'fr'];

    function isValidLanguage(lang) {
        return VALID_LANGUAGES.includes(lang);
    }

    /**
     * Deterministic seed from calendar date + language.
     * Same inputs always produce the same non-negative integer.
     */
    function stableDaySeed(date, language) {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}:${language}`;
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0; // 32-bit int
        }
        return Math.abs(hash);
    }

    /**
     * Normalize a favorite from storage. Legacy entries without language → en.
     * Returns null for invalid records.
     */
    function normalizeFavorite(fav) {
        if (!fav || typeof fav !== 'object') return null;
        const chapter = Number(fav.chapter);
        const verse = Number(fav.verse);
        if (!Number.isFinite(chapter) || !Number.isFinite(verse) || typeof fav.text !== 'string') {
            return null;
        }
        const language = isValidLanguage(fav.language) ? fav.language : 'en';
        return { chapter, verse, text: fav.text, language };
    }

    function parseFavorites(rawJson) {
        try {
            const raw = typeof rawJson === 'string' ? JSON.parse(rawJson || '[]') : rawJson;
            if (!Array.isArray(raw)) return [];
            return raw.map(normalizeFavorite).filter(Boolean);
        } catch {
            return [];
        }
    }

    function favoriteKey(fav) {
        return `${fav.language}:${fav.chapter}:${fav.verse}`;
    }

    function isFavorite(favorites, verse) {
        if (!verse) return false;
        const key = favoriteKey(verse);
        return favorites.some(fav => favoriteKey(fav) === key);
    }

    function favoritesForLanguage(favorites, language) {
        return favorites.filter(fav => fav.language === language);
    }

    /**
     * Toggle a verse in the favorites list. Returns a new array (immutable).
     */
    function toggleFavoriteInList(favorites, verse) {
        if (!verse) return favorites.slice();
        const normalized = normalizeFavorite({
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
            language: verse.language
        });
        if (!normalized) return favorites.slice();

        const key = favoriteKey(normalized);
        const existingIndex = favorites.findIndex(fav => favoriteKey(fav) === key);
        if (existingIndex >= 0) {
            return favorites.filter((_, i) => i !== existingIndex);
        }
        return favorites.concat([normalized]);
    }

    /**
     * Pick today's verse: chapter by day-of-month, verse by stable seed.
     * @returns {{ chapter: number, verse: number, text: string, language: string } | null}
     */
    function getTodayVerse(proverbsData, date, language) {
        if (!proverbsData || !Array.isArray(proverbsData.chapters) || proverbsData.chapters.length === 0) {
            return null;
        }
        if (!isValidLanguage(language)) {
            language = 'en';
        }

        const dayOfMonth = date.getDate(); // 1-31
        const chapterIndex = Math.min(dayOfMonth, 31) - 1;
        const chapter = proverbsData.chapters[chapterIndex];

        if (!chapter || !Array.isArray(chapter.verses) || chapter.verses.length === 0) {
            return null;
        }

        const seed = stableDaySeed(date, language);
        const verseIndex = seed % chapter.verses.length;
        const verse = chapter.verses[verseIndex];

        return {
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
            language
        };
    }

    return {
        VALID_LANGUAGES,
        isValidLanguage,
        stableDaySeed,
        normalizeFavorite,
        parseFavorites,
        favoriteKey,
        isFavorite,
        favoritesForLanguage,
        toggleFavoriteInList,
        getTodayVerse
    };
});
