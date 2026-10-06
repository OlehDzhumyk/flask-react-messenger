const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole calendar days between two dates (0 = same day, 1 = yesterday). */
const daysBetween = (earlier, later) =>
    Math.round((startOfDay(later) - startOfDay(earlier)) / DAY_MS);

/** "14:05" */
export const formatTime = (iso, locale) =>
    new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

/** Separator label in a conversation: "Today", "Yesterday" or "Mon, 5 Oct". */
export const formatDayLabel = (iso, now = new Date(), locale) => {
    const date = new Date(iso);
    const days = daysBetween(date, now);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    });
};

/** Compact time for the chat list: time today, then "Yesterday", weekday, or date. */
export const formatChatListTime = (iso, now = new Date(), locale) => {
    const date = new Date(iso);
    const days = daysBetween(date, now);
    if (days === 0) return formatTime(iso, locale);
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString(locale, { weekday: 'short' });
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

/** True when two timestamps fall on different calendar days (local time). */
export const isDifferentDay = (isoA, isoB) => daysBetween(new Date(isoA), new Date(isoB)) !== 0;
