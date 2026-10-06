import { describe, expect, it } from 'vitest';
import { formatChatListTime, formatDayLabel, isDifferentDay } from './dates';

// Local-time dates, so the tests don't depend on the machine's timezone.
// Exact Intl output varies a little between ICU versions, hence the regexes.
const now = new Date(2026, 9, 6, 15, 30);         // Tue 6 Oct 2026, 15:30
const at = (...args) => new Date(...args).toISOString();

describe('formatDayLabel', () => {
    it('labels today and yesterday by name', () => {
        expect(formatDayLabel(at(2026, 9, 6, 0, 5), now)).toBe('Today');
        expect(formatDayLabel(at(2026, 9, 5, 23, 59), now)).toBe('Yesterday');
    });

    it('shows weekday and date for older days', () => {
        expect(formatDayLabel(at(2026, 9, 1, 12), now, 'en-GB')).toMatch(/^Thu,? 1 Oct$/);
    });

    it('adds the year for previous years', () => {
        expect(formatDayLabel(at(2025, 11, 31, 12), now, 'en-GB')).toMatch(/^Wed,? 31 Dec 2025$/);
    });
});

describe('formatChatListTime', () => {
    it('shows the time for messages from today', () => {
        expect(formatChatListTime(at(2026, 9, 6, 9, 7), now, 'en-GB')).toBe('09:07');
    });

    it('shows "Yesterday", then the weekday within a week', () => {
        expect(formatChatListTime(at(2026, 9, 5, 9), now, 'en-GB')).toBe('Yesterday');
        expect(formatChatListTime(at(2026, 9, 2, 9), now, 'en-GB')).toBe('Fri');
    });

    it('shows the date for older messages', () => {
        expect(formatChatListTime(at(2026, 8, 20, 9), now, 'en-GB')).toMatch(/^20 Sept?$/);
    });
});

describe('isDifferentDay', () => {
    it('compares calendar days, not 24-hour periods', () => {
        expect(isDifferentDay(at(2026, 9, 5, 23, 59), at(2026, 9, 6, 0, 1))).toBe(true);
        expect(isDifferentDay(at(2026, 9, 6, 0, 1), at(2026, 9, 6, 23, 59))).toBe(false);
    });
});
