import { FileText, Image, Video, Music, Code, File, FileSpreadsheet, Archive, Presentation } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Extracts the broad category from a MIME type string.
 * Handles both full MIME types ("video/mp4") and legacy category names ("video").
 */
export function getMediaCategory(mimeType: string): string {
    if (!mimeType) return 'other';

    // If it's already a simple category (legacy data), return as-is
    const legacyCategories = ['document', 'image', 'video', 'audio', 'code'];
    const lower = mimeType.toLowerCase();
    if (legacyCategories.includes(lower)) return lower;

    // Extract category from MIME type
    const primary = lower.split('/')[0];

    switch (primary) {
        case 'image':
            return 'image';
        case 'video':
            return 'video';
        case 'audio':
            return 'audio';
        case 'text':
            if (isCodeMimeType(lower)) return 'code';
            return 'document';
        case 'application':
            return getApplicationCategory(lower);
        default:
            return 'other';
    }
}

/**
 * Returns a human-readable label for a MIME type.
 * "video/mp4" → "Video (MP4)"
 * "document" → "Document"
 */
export function getMediaLabel(mimeType: string): string {
    if (!mimeType) return 'Unknown';

    const lower = mimeType.toLowerCase();

    // Legacy simple categories
    const legacyLabels: Record<string, string> = {
        document: 'Document',
        image: 'Image',
        video: 'Video',
        audio: 'Audio',
        code: 'Code',
    };
    if (legacyLabels[lower]) return legacyLabels[lower];

    // Full MIME type
    const parts = lower.split('/');
    if (parts.length < 2) return mimeType;

    const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const subtype = parts[1]
        .replace(/^x-/, '')
        .replace(/^vnd\./, '')
        .toUpperCase();

    return `${category} (${subtype})`;
}

/**
 * Checks if a MIME type can be previewed inline in the browser.
 */
export function isPreviewable(mimeType: string): boolean {
    if (!mimeType) return false;
    const category = getMediaCategory(mimeType);
    const lower = mimeType.toLowerCase();

    if (['image', 'video', 'audio'].includes(category)) return true;
    if (lower === 'application/pdf') return true;
    if (category === 'code' || category === 'document') {
        if (lower.startsWith('text/')) return true;
    }
    return false;
}

/**
 * Returns the appropriate Lucide icon component for a MIME type.
 */
export function getMediaIcon(mimeType: string): LucideIcon {
    const category = getMediaCategory(mimeType);
    const lower = (mimeType || '').toLowerCase();

    switch (category) {
        case 'image':
            return Image;
        case 'video':
            return Video;
        case 'audio':
            return Music;
        case 'code':
            return Code;
        case 'document':
            if (lower === 'application/pdf') return FileText;
            if (lower.includes('spreadsheet') || lower.includes('csv') || lower.includes('excel'))
                return FileSpreadsheet;
            if (lower.includes('presentation') || lower.includes('powerpoint'))
                return Presentation;
            return FileText;
        case 'other':
            if (lower.includes('zip') || lower.includes('tar') || lower.includes('rar') || lower.includes('7z'))
                return Archive;
            return File;
        default:
            return File;
    }
}

/**
 * Returns Tailwind color classes for a MIME type's category.
 */
export function getTypeColor(mimeType: string): string {
    const category = getMediaCategory(mimeType);

    switch (category) {
        case 'document':
            return 'bg-blue-100 text-blue-700';
        case 'image':
            return 'bg-purple-100 text-purple-700';
        case 'video':
            return 'bg-red-100 text-red-700';
        case 'audio':
            return 'bg-yellow-100 text-yellow-700';
        case 'code':
            return 'bg-green-100 text-green-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

// ─── Internal Helpers ─────────────────────────────────────────

function isCodeMimeType(mime: string): boolean {
    const codeSubtypes = [
        'javascript', 'typescript', 'json', 'xml', 'html', 'css',
        'csv', 'yaml', 'markdown', 'x-python', 'x-java', 'x-c',
        'x-shellscript', 'x-ruby', 'x-go', 'x-rust',
    ];
    const subtype = mime.split('/')[1] || '';
    return codeSubtypes.some(s => subtype.includes(s));
}

function getApplicationCategory(mime: string): string {
    if (mime === 'application/pdf') return 'document';
    if (mime === 'application/json') return 'code';
    if (mime.includes('xml')) return 'code';

    if (
        mime.includes('word') || mime.includes('document') ||
        mime.includes('opendocument.text') || mime.includes('rtf')
    ) return 'document';

    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
        return 'document';

    if (mime.includes('presentation') || mime.includes('powerpoint'))
        return 'document';

    if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip') ||
        mime.includes('rar') || mime.includes('7z'))
        return 'other';

    if (mime.includes('javascript') || mime.includes('typescript'))
        return 'code';

    return 'other';
}
