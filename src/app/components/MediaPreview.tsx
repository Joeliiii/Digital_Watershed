import { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { getMediaCategory, getMediaIcon, getMediaLabel, isPreviewable } from '../utils/mediaUtils';

import { API_URL } from '../services/constants';

interface MediaPreviewProps {
    itemId: string;
    mimeType: string;
    fileName?: string;
    fileSize?: number;
}

/**
 * Renders the appropriate media player/viewer based on MIME type.
 * Streams content from `/api/items/:id/file`.
 */
const MediaPreview = ({ itemId, mimeType, fileName, fileSize }: MediaPreviewProps) => {
    const fileUrl = `${API_URL}/items/${itemId}/file`;
    const category = getMediaCategory(mimeType);

    if (!isPreviewable(mimeType)) {
        return <GenericFileCard mimeType={mimeType} fileName={fileName} fileSize={fileSize} fileUrl={fileUrl} />;
    }

    switch (category) {
        case 'video':
            return <VideoPreview src={fileUrl} mimeType={mimeType} />;
        case 'audio':
            return <AudioPreview src={fileUrl} mimeType={mimeType} />;
        case 'image':
            return <ImagePreview src={fileUrl} fileName={fileName} />;
        case 'document':
            if (mimeType?.toLowerCase() === 'application/pdf') {
                return <PdfPreview src={fileUrl} />;
            }
            return <TextPreview src={fileUrl} fileName={fileName} />;
        case 'code':
            return <TextPreview src={fileUrl} fileName={fileName} />;
        default:
            return <GenericFileCard mimeType={mimeType} fileName={fileName} fileSize={fileSize} fileUrl={fileUrl} />;
    }
};

// ─── Video Player ─────────────────────────────────────────────

const VideoPreview = ({ src, mimeType }: { src: string; mimeType: string }) => (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
        <video
            controls
            className="w-full max-h-[500px] object-contain"
            preload="metadata"
        >
            <source src={src} type={mimeType} />
            Your browser does not support video playback.
        </video>
    </div>
);

// ─── Audio Player ─────────────────────────────────────────────

const AudioPreview = ({ src, mimeType }: { src: string; mimeType: string }) => (
    <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.68-.35-1.47-.55-2.5-.55C7.01 13 5 14.79 5 17s2.01 4 4.5 4c2.49 0 4.5-1.79 4.5-4V7h4V3h-6z" />
            </svg>
        </div>
        <audio controls className="w-full max-w-lg" preload="metadata">
            <source src={src} type={mimeType} />
            Your browser does not support audio playback.
        </audio>
    </div>
);

// ─── Image Viewer ─────────────────────────────────────────────

const ImagePreview = ({ src, fileName }: { src: string; fileName?: string }) => {
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-full bg-red-50 rounded-lg p-8 flex flex-col items-center gap-2 text-red-600">
                <AlertCircle className="size-8" />
                <p className="text-sm">Failed to load image</p>
            </div>
        );
    }

    return (
        <>
            <div
                className="relative w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group"
                onClick={() => setExpanded(true)}
            >
                <img
                    src={src}
                    alt={fileName || 'Preview'}
                    className="max-h-[500px] max-w-full object-contain"
                    onError={() => setError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                        Click to expand
                    </span>
                </div>
            </div>

            {/* Lightbox overlay */}
            {expanded && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setExpanded(false)}
                >
                    <img
                        src={src}
                        alt={fileName || 'Full size'}
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                    />
                </div>
            )}
        </>
    );
};

// ─── PDF Embed ────────────────────────────────────────────────

const PdfPreview = ({ src }: { src: string }) => (
    <div className="w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <iframe
            src={src}
            title="PDF Preview"
            className="w-full h-[600px]"
            style={{ border: 'none' }}
        />
    </div>
);

// ─── Text / Code Viewer ───────────────────────────────────────

const TextPreview = ({ src, fileName }: { src: string; fileName?: string }) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchText = async () => {
            try {
                const res = await fetch(src);
                if (!res.ok) throw new Error('Failed to fetch');
                const text = await res.text();
                // Limit displayed content to prevent performance issues
                setContent(text.length > 50000 ? text.slice(0, 50000) + '\n\n... (truncated)' : text);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchText();
    }, [src]);

    if (loading) {
        return (
            <div className="w-full bg-gray-50 rounded-lg p-8 text-center text-gray-500 animate-pulse">
                Loading file contents...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-red-50 rounded-lg p-8 flex flex-col items-center gap-2 text-red-600">
                <AlertCircle className="size-8" />
                <p className="text-sm">Failed to load file contents</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
            {fileName && (
                <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-b border-gray-700 font-mono">
                    {fileName}
                </div>
            )}
            <pre className="p-4 text-sm text-gray-100 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap break-words">
                {content}
            </pre>
        </div>
    );
};

// ─── Generic File Card (non-previewable) ──────────────────────

const GenericFileCard = ({ mimeType, fileName, fileSize, fileUrl }: {
    mimeType: string;
    fileName?: string;
    fileSize?: number;
    fileUrl: string;
}) => {
    const Icon = getMediaIcon(mimeType);
    const label = getMediaLabel(mimeType);

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                <Icon className="size-8 text-gray-600" />
            </div>
            <div className="text-center">
                {fileName && <p className="font-medium text-gray-900 mb-1">{fileName}</p>}
                <p className="text-sm text-gray-500">{label}</p>
                {fileSize && <p className="text-xs text-gray-400 mt-1">{formatSize(fileSize)}</p>}
            </div>
            <a
                href={fileUrl}
                download={fileName || true}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <Download className="size-4" />
                Download File
            </a>
        </div>
    );
};

export default MediaPreview;
