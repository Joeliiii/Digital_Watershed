import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Save, ArrowLeft, Plus, Upload, X } from 'lucide-react';
import { getMediaLabel, getMediaCategory, getTypeColor, getMediaIcon } from '../utils/mediaUtils';

const CreateMediaPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [newTag, setNewTag] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mediaType: 'document', // Default
        storageType: 'gridfs',
        filePath: '',
        externalUrl: '',
        projectIds: [] as string[],
        tagIds: [] as string[],
        notes: '',
        metadata: '{}' // JSON string for flexibility
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, tagsData] = await Promise.all([
                    api.getProjects(),
                    api.getTags()
                ]);
                setProjects(projectsData);
                setTags(tagsData);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Auto-detect MIME type from the file
            const detectedType = file.type || 'application/octet-stream';
            setFormData(prev => ({ ...prev, mediaType: detectedType }));

            // Create preview URL for previewable types
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            const category = getMediaCategory(detectedType);
            if (['image', 'video', 'audio'].includes(category)) {
                setFilePreviewUrl(URL.createObjectURL(file));
            } else {
                setFilePreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
        setFormData(prev => ({ ...prev, mediaType: 'document' }));
    };

    const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, field: 'projectIds' | 'tagIds') => {
        const options = e.target.options;
        const value: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setFormData({ ...formData, [field]: value });
    };

    const handleAddTag = async () => {
        if (!newTag.trim()) return;
        try {
            const createdTag = await api.createTag({ name: newTag });
            setTags([...tags, createdTag]);
            setNewTag('');
            // Auto-select the new tag
            setFormData(prev => ({ ...prev, tagIds: [...prev.tagIds, createdTag._id] }));
        } catch (error) {
            console.error("Failed to create tag", error);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare payload
            let payload: any = { ...formData };

            // Parse metadata JSON
            try {
                payload.metadata = JSON.parse(formData.metadata);
            } catch (e) {
                console.error("Invalid JSON metadata", e);
                // Ignore or alert user
                payload.metadata = {};
            }

            const data = new FormData();
            // Append all simple fields
            Object.keys(payload).forEach(key => {
                if (key === 'projectIds' || key === 'tagIds') {
                    // Append array items individually
                    payload[key].forEach((id: string) => data.append(key, id));
                } else if (key === 'metadata') {
                    data.append(key, JSON.stringify(payload[key]));
                } else {
                    data.append(key, payload[key]);
                }
            });

            if (selectedFile) {
                data.append('file', selectedFile);
            }
            // If no file, it will still send FormData, which API should handle (creating metadata-only item or fail if file required - typically safer to allow metadata only for updates, but for create maybe we want file?)
            // Current backend logic handles req.file check effectively.

            await api.createItem(data);

            navigate('/media');
        } catch (error) {
            console.error('Failed to create item:', error);
            // Show error notification
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Back to Media
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50 px-8 py-6 border-b border-blue-100">
                        <h1 className="text-2xl font-bold text-blue-900">Create New Media Item</h1>
                        <p className="text-blue-600">Add a new resource to your digital watershed</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Water Quality Report 2024"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Brief description of the item..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Internal notes..."
                                    />
                                </div>
                            </div>

                            {/* File Upload & Preview */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                                    {!selectedFile ? (
                                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                            <Upload className="size-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Click to select any file</span>
                                            <span className="text-xs text-gray-400 mt-1">All file types supported</span>
                                            <input type="file" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    ) : (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* File info bar */}
                                            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {(() => { const Icon = getMediaIcon(formData.mediaType); return <Icon className="size-4 text-gray-600 shrink-0" />; })()}
                                                    <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(formData.mediaType)}`}>
                                                        {getMediaLabel(formData.mediaType)}
                                                    </span>
                                                </div>
                                                <button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                            {/* Live preview */}
                                            {filePreviewUrl && getMediaCategory(formData.mediaType) === 'image' && (
                                                <div className="bg-gray-100 flex items-center justify-center p-4">
                                                    <img src={filePreviewUrl} alt="Preview" className="max-h-48 max-w-full object-contain rounded" />
                                                </div>
                                            )}
                                            {filePreviewUrl && getMediaCategory(formData.mediaType) === 'video' && (
                                                <div className="bg-black flex items-center justify-center">
                                                    <video src={filePreviewUrl} controls className="max-h-48 max-w-full" />
                                                </div>
                                            )}
                                            {filePreviewUrl && getMediaCategory(formData.mediaType) === 'audio' && (
                                                <div className="bg-gray-100 p-4">
                                                    <audio src={filePreviewUrl} controls className="w-full" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">File will be stored securely in the database.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Taxonomy */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Projects (Hold Ctrl to select multiple)</label>
                                    <select
                                        multiple
                                        value={formData.projectIds}
                                        onChange={(e) => handleMultiSelect(e, 'projectIds')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                    >
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Hold Ctrl to select multiple)</label>
                                    <div className="flex gap-2 mb-2 items-center">
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="New tag name"
                                            className="flex-1 px-3 py-1 rounded border border-gray-300 text-sm h-8"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 h-8 flex items-center justify-center"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                    <select
                                        multiple
                                        value={formData.tagIds}
                                        onChange={(e) => handleMultiSelect(e, 'tagIds')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                    >
                                        {tags.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Advanced */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
                                    <textarea
                                        name="metadata"
                                        value={formData.metadata}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder='{"key": "value"}'
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter valid JSON for custom metadata fields.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="size-5" />
                                {loading ? 'Creating...' : 'Create Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateMediaPage;
