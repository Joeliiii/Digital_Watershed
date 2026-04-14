// Shared localStorage-based view tracking for the Recently Viewed widget

const STORAGE_KEY = 'watershed_view_history';

export interface ViewHistoryEntry {
  mediaId: string;
  viewedAt: string;
  viewCount: number;
}

/**
 * Record a view of a media item. Call this from any page that
 * displays a media detail (e.g. MediaDetailPage).
 */
export function recordMediaView(mediaId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: ViewHistoryEntry[] = raw ? JSON.parse(raw) : [];

    const existing = history.find(h => h.mediaId === mediaId);
    let updated: ViewHistoryEntry[];

    if (existing) {
      updated = history.map(h =>
        h.mediaId === mediaId
          ? { ...h, viewedAt: new Date().toISOString(), viewCount: h.viewCount + 1 }
          : h
      );
    } else {
      updated = [
        ...history,
        { mediaId, viewedAt: new Date().toISOString(), viewCount: 1 },
      ];
    }

    // Keep only the most recent 100 entries to prevent unbounded growth
    if (updated.length > 100) {
      updated.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
      updated = updated.slice(0, 100);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently ignore localStorage errors (e.g. private browsing, quota)
  }
}

/**
 * Read back the full view history, sorted most-recent-first.
 */
export function getViewHistory(): ViewHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const history: ViewHistoryEntry[] = JSON.parse(raw);
    return history.sort(
      (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );
  } catch {
    return [];
  }
}
