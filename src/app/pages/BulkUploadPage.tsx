import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Files, ChevronDown, ChevronUp } from 'lucide-react';

interface FileEntry {
    file: File;
    title: string;
    description: string;
    notes: string;
    projectIds: string[];
    tagIds: string[];
    expanded: boolean;
}

const BulkUploadPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [p, t] = await Promise.all([api.getProjects(), api.getTags()]);
                setProjects(p);
                setTags(t);
            } catch (err) {
                console.error('Failed to load data:', err);
            }
        };
        fetchData();
    }, []);

    const addFiles = (newFiles: FileList | File[]) => {
        const arr = Array.from(newFiles).map(file => ({
            file,
            title: file.name.replace(/\.[^/.]+$/, ''), // Strip extension for title
            description: '',
            notes: '',
            projectIds: [] as string[],
            tagIds: [] as string[],
            expanded: false,
        }));
        setEntries(prev => [...prev, ...arr]);
    };

    const removeEntry = (index: number) => {
        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, updates: Partial<FileEntry>) => {
        setEntries(prev => prev.map((e, i) => i === index ? { ...e, ...updates } : e));
    };

    const toggleExpand = (index: number) => {
        setEntries(prev => prev.map((e, i) => i === index ? { ...e, expanded: !e.expanded } : e));
    };

    const toggleProjectForEntry = (index: number, projectId: string) => {
        setEntries(prev => prev.map((e, i) => {
            if (i !== index) return e;
            const has = e.projectIds.includes(projectId);
            return { ...e, projectIds: has ? e.projectIds.filter(p => p !== projectId) : [...e.projectIds, projectId] };
        }));
    };

    const toggleTagForEntry = (index: number, tagId: string) => {
        setEntries(prev => prev.map((e, i) => {
            if (i !== index) return e;
            const has = e.tagIds.includes(tagId);
            return { ...e, tagIds: has ? e.tagIds.filter(t => t !== tagId) : [...e.tagIds, tagId] };
        }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleUpload = async () => {
        if (entries.length === 0) return;
        setUploading(true);
        setProgress({ done: 0, total: entries.length, errors: [] });

        const errors: string[] = [];
        let done = 0;

        for (const entry of entries) {
            try {
                const formData = new FormData();
                formData.append('file', entry.file);
                formData.append('title', entry.title || entry.file.name);
                formData.append('description', entry.description);
                formData.append('notes', entry.notes);
                formData.append('mediaType', entry.file.type || 'application/octet-stream');
                formData.append('storageType', 'gridfs');
                entry.projectIds.forEach(id => formData.append('projectIds', id));
                entry.tagIds.forEach(id => formData.append('tagIds', id));

                await api.createItem(formData);
            } catch (err: any) {
                errors.push(`${entry.file.name}: ${err.message || 'Upload failed'}`);
            }
            done++;
            setProgress({ done, total: entries.length, errors: [...errors] });
        }

        if (errors.length === 0) {
            setEntries([]);
        }
        setUploading(false);
    };

    const expandAll = () => setEntries(prev => prev.map(e => ({ ...e, expanded: true })));
    const collapseAll = () => setEntries(prev => prev.map(e => ({ ...e, expanded: false })));

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/media')}
                    className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Back to Media
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-100">
                        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
                            <Files className="size-7" />
                            Bulk Upload
                        </h1>
                        <p className="text-blue-600 mt-1">Upload multiple files and customize each individually</p>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Drop Zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl
                                cursor-pointer transition-all duration-200
                                ${dragOver
                                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                                }
                            `}
                        >
                            <Upload className={`size-10 mb-3 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium text-gray-600">
                                Drag & drop files here, or click to browse
                            </span>
                            <span className="text-xs text-gray-400 mt-1">Select as many files as you need</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                            />
                        </div>

                        {/* File Entries */}
                        {entries.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        {entries.length} file{entries.length > 1 ? 's' : ''} — click each to customize
                                    </h3>
                                    <div className="flex gap-2">
                                        <button onClick={expandAll} className="text-xs text-blue-600 hover:text-blue-800">Expand all</button>
                                        <span className="text-xs text-gray-300">|</span>
                                        <button onClick={collapseAll} className="text-xs text-blue-600 hover:text-blue-800">Collapse all</button>
                                        <span className="text-xs text-gray-300">|</span>
                                        <button onClick={() => setEntries([])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {entries.map((entry, i) => (
                                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Header Row */}
                                            <div
                                                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleExpand(i)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                                    <span className="text-sm font-medium text-gray-700 truncate">{entry.title || entry.file.name}</span>
                                                    <span className="text-xs text-gray-400 shrink-0">{formatSize(entry.file.size)}</span>
                                                    {(entry.description || entry.notes || entry.tagIds.length > 0 || entry.projectIds.length > 0) && (
                                                        <span className="text-xs text-blue-500 shrink-0">• customized</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {entry.expanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeEntry(i); }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Detail */}
                                            {entry.expanded && (
                                                <div className="px-4 py-4 space-y-4 border-t border-gray-100 bg-white">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                                        <input
                                                            value={entry.title}
                                                            onChange={(e) => updateEntry(i, { title: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            placeholder="Item title..."
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                                            <textarea
                                                                value={entry.description}
                                                                onChange={(e) => updateEntry(i, { description: e.target.value })}
                                                                rows={2}
                                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                                placeholder="Optional description..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                                                            <textarea
                                                                value={entry.notes}
                                                                onChange={(e) => updateEntry(i, { notes: e.target.value })}
                                                                rows={2}
                                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                                placeholder="Optional notes..."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Projects</label>
                                                            <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                                {projects.length > 0 ? projects.map(p => (
                                                                    <label key={p._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={entry.projectIds.includes(p._id)}
                                                                            onChange={() => toggleProjectForEntry(i, p._id)}
                                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-xs text-gray-700">{p.title}</span>
                                                                    </label>
                                                                )) : (
                                                                    <p className="px-3 py-2 text-xs text-gray-400">No projects</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                                                            <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                                {tags.length > 0 ? tags.map(t => (
                                                                    <label key={t._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={entry.tagIds.includes(t._id)}
                                                                            onChange={() => toggleTagForEntry(i, t._id)}
                                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-xs text-gray-700">{t.name}</span>
                                                                    </label>
                                                                )) : (
                                                                    <p className="px-3 py-2 text-xs text-gray-400">No tags</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progress / Result */}
                        {progress && (
                            <div className={`rounded-lg p-4 ${progress.errors.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="size-5 text-green-600" />
                                    <span className="font-medium text-green-700">
                                        {progress.done} of {progress.total} uploaded
                                    </span>
                                </div>
                                {uploading && (
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.done / progress.total) * 100}%` }}
                                        />
                                    </div>
                                )}
                                {progress.errors.map((err, i) => (
                                    <div key={i} className="flex items-center gap-2 text-amber-700 mt-1">
                                        <AlertCircle className="size-4" />
                                        <span className="text-sm">{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                Expand each file to customize its title, description, notes, and tags.
                            </p>
                            <button
                                onClick={handleUpload}
                                disabled={entries.length === 0 || uploading}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="size-5" />
                                {uploading
                                    ? `Uploading ${progress?.done || 0}/${progress?.total || 0}...`
                                    : `Upload ${entries.length} File${entries.length !== 1 ? 's' : ''}`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadPage;
