/**
 * Lightweight unit tests for pure verse/favorites logic.
 * Run: node --test tests/app-logic.test.js
 * Requires Node 18+ (built-in node:test).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const AppLogic = require('../app-logic.js');

const sampleData = {
    book: 'Proverbs',
    version: 'WEB',
    chapters: [
        {
            chapter: 1,
            verses: [
                { verse: 1, text: 'First verse of chapter 1' },
                { verse: 2, text: 'Second verse of chapter 1' },
                { verse: 3, text: 'Third verse of chapter 1' }
            ]
        },
        {
            chapter: 2,
            verses: [
                { verse: 6, text: 'Only verse in chapter 2' }
            ]
        },
        // day 3 → empty chapter (edge case)
        { chapter: 3, verses: [] }
    ]
};

// Pad so day-of-month 19 maps to a real chapter in fuller fixture below
function buildMonthData() {
    const chapters = [];
    for (let c = 1; c <= 31; c++) {
        chapters.push({
            chapter: c,
            verses: [
                { verse: 1, text: `Ch ${c} v1` },
                { verse: 2, text: `Ch ${c} v2` },
                { verse: 5, text: `Ch ${c} v5` }
            ]
        });
    }
    return { book: 'Proverbs', version: 'WEB', chapters };
}

describe('stableDaySeed', () => {
    it('is stable for the same date and language', () => {
        const d = new Date(2026, 6, 19); // July 19, 2026
        assert.equal(AppLogic.stableDaySeed(d, 'en'), AppLogic.stableDaySeed(d, 'en'));
    });

    it('differs by language', () => {
        const d = new Date(2026, 6, 19);
        assert.notEqual(AppLogic.stableDaySeed(d, 'en'), AppLogic.stableDaySeed(d, 'zh'));
    });

    it('differs by calendar day', () => {
        const a = new Date(2026, 6, 19);
        const b = new Date(2026, 6, 20);
        assert.notEqual(AppLogic.stableDaySeed(a, 'en'), AppLogic.stableDaySeed(b, 'en'));
    });

    it('returns a non-negative integer', () => {
        const seed = AppLogic.stableDaySeed(new Date(2026, 0, 1), 'es');
        assert.ok(Number.isInteger(seed));
        assert.ok(seed >= 0);
    });
});

describe('getTodayVerse', () => {
    const data = buildMonthData();

    it('picks chapter by day of month', () => {
        const d = new Date(2026, 6, 19); // day 19 → chapter 19
        const result = AppLogic.getTodayVerse(data, d, 'en');
        assert.equal(result.chapter, 19);
        assert.equal(result.language, 'en');
        assert.ok(result.text.includes('Ch 19'));
    });

    it('returns the same verse on repeated calls for the same day', () => {
        const d = new Date(2026, 6, 19);
        const a = AppLogic.getTodayVerse(data, d, 'en');
        const b = AppLogic.getTodayVerse(data, d, 'en');
        assert.deepEqual(a, b);
    });

    it('can return a different verse for another language on the same day', () => {
        const d = new Date(2026, 6, 19);
        const en = AppLogic.getTodayVerse(data, d, 'en');
        const zh = AppLogic.getTodayVerse(data, d, 'zh');
        // Same chapter (day-based), seed may pick different verse index
        assert.equal(en.chapter, zh.chapter);
        assert.equal(en.language, 'en');
        assert.equal(zh.language, 'zh');
    });

    it('returns null for empty chapter', () => {
        const d = new Date(2026, 0, 3); // day 3 → empty in sampleData
        const result = AppLogic.getTodayVerse(sampleData, d, 'en');
        assert.equal(result, null);
    });

    it('returns null for missing data', () => {
        assert.equal(AppLogic.getTodayVerse(null, new Date(), 'en'), null);
        assert.equal(AppLogic.getTodayVerse({ chapters: [] }, new Date(), 'en'), null);
    });

    it('falls back invalid language to en for selection', () => {
        const d = new Date(2026, 6, 1);
        const result = AppLogic.getTodayVerse(data, d, 'xx');
        assert.equal(result.language, 'en');
        assert.equal(result.chapter, 1);
    });

    it('works against real English proverbs data', () => {
        const enPath = path.join(__dirname, '..', 'data', 'proverbs-en.json');
        const real = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        const d = new Date(2026, 6, 19);
        const a = AppLogic.getTodayVerse(real, d, 'en');
        const b = AppLogic.getTodayVerse(real, d, 'en');
        assert.ok(a);
        assert.equal(a.chapter, 19);
        assert.deepEqual(a, b);
        assert.ok(typeof a.text === 'string' && a.text.length > 0);
    });
});

describe('normalizeFavorite / parseFavorites', () => {
    it('normalizes a valid favorite', () => {
        const fav = AppLogic.normalizeFavorite({
            chapter: 3,
            verse: 5,
            text: 'Trust in the LORD',
            language: 'en'
        });
        assert.deepEqual(fav, {
            chapter: 3,
            verse: 5,
            text: 'Trust in the LORD',
            language: 'en'
        });
    });

    it('migrates legacy favorites without language to en', () => {
        const fav = AppLogic.normalizeFavorite({
            chapter: 1,
            verse: 7,
            text: 'Fear of the LORD'
        });
        assert.equal(fav.language, 'en');
    });

    it('rejects invalid favorites', () => {
        assert.equal(AppLogic.normalizeFavorite(null), null);
        assert.equal(AppLogic.normalizeFavorite({ chapter: 1 }), null);
        assert.equal(AppLogic.normalizeFavorite({ chapter: 'x', verse: 1, text: 'a' }), null);
    });

    it('parses JSON array and drops bad entries', () => {
        const raw = JSON.stringify([
            { chapter: 1, verse: 1, text: 'ok', language: 'zh' },
            { broken: true },
            { chapter: 2, verse: 2, text: 'legacy' }
        ]);
        const list = AppLogic.parseFavorites(raw);
        assert.equal(list.length, 2);
        assert.equal(list[0].language, 'zh');
        assert.equal(list[1].language, 'en');
    });

    it('returns empty array on invalid JSON', () => {
        assert.deepEqual(AppLogic.parseFavorites('not-json'), []);
        assert.deepEqual(AppLogic.parseFavorites('{}'), []);
    });
});

describe('favoriteKey / isFavorite / favoritesForLanguage', () => {
    const list = [
        { chapter: 1, verse: 1, text: 'a', language: 'en' },
        { chapter: 1, verse: 1, text: '甲', language: 'zh' },
        { chapter: 3, verse: 5, text: 'b', language: 'en' }
    ];

    it('keys include language so same ref differs by lang', () => {
        assert.equal(AppLogic.favoriteKey(list[0]), 'en:1:1');
        assert.equal(AppLogic.favoriteKey(list[1]), 'zh:1:1');
        assert.notEqual(AppLogic.favoriteKey(list[0]), AppLogic.favoriteKey(list[1]));
    });

    it('isFavorite matches by language+chapter+verse', () => {
        assert.equal(AppLogic.isFavorite(list, { chapter: 1, verse: 1, language: 'en' }), true);
        assert.equal(AppLogic.isFavorite(list, { chapter: 1, verse: 1, language: 'fr' }), false);
        assert.equal(AppLogic.isFavorite(list, null), false);
    });

    it('filters favorites by language', () => {
        const en = AppLogic.favoritesForLanguage(list, 'en');
        const zh = AppLogic.favoritesForLanguage(list, 'zh');
        assert.equal(en.length, 2);
        assert.equal(zh.length, 1);
        assert.equal(zh[0].text, '甲');
    });
});

describe('toggleFavoriteInList', () => {
    const verse = { chapter: 3, verse: 5, text: 'Trust', language: 'en' };

    it('adds a verse when not present', () => {
        const next = AppLogic.toggleFavoriteInList([], verse);
        assert.equal(next.length, 1);
        assert.deepEqual(next[0], {
            chapter: 3,
            verse: 5,
            text: 'Trust',
            language: 'en'
        });
    });

    it('removes a verse when already present', () => {
        const withFav = AppLogic.toggleFavoriteInList([], verse);
        const without = AppLogic.toggleFavoriteInList(withFav, verse);
        assert.equal(without.length, 0);
    });

    it('does not mutate the original array', () => {
        const original = [];
        const next = AppLogic.toggleFavoriteInList(original, verse);
        assert.equal(original.length, 0);
        assert.equal(next.length, 1);
    });

    it('keeps other languages intact when toggling', () => {
        const start = [
            { chapter: 3, verse: 5, text: '信靠', language: 'zh' }
        ];
        const next = AppLogic.toggleFavoriteInList(start, verse);
        assert.equal(next.length, 2);
        assert.ok(next.some(f => f.language === 'zh'));
        assert.ok(next.some(f => f.language === 'en'));
    });

    it('returns a copy when verse is null', () => {
        const start = [{ chapter: 1, verse: 1, text: 'a', language: 'en' }];
        const next = AppLogic.toggleFavoriteInList(start, null);
        assert.deepEqual(next, start);
        assert.notEqual(next, start);
    });
});

describe('isValidLanguage', () => {
    it('accepts supported codes only', () => {
        assert.equal(AppLogic.isValidLanguage('en'), true);
        assert.equal(AppLogic.isValidLanguage('zh'), true);
        assert.equal(AppLogic.isValidLanguage('de'), false);
        assert.equal(AppLogic.isValidLanguage(''), false);
    });
});
