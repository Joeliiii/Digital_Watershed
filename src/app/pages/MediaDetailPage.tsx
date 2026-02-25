import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { ArrowLeft, Save, Trash2, Edit, Download } from 'lucide-react';
import MediaPreview from '../components/MediaPreview';
import { getMediaLabel } from '../utils/mediaUtils';

declare global {
  interface Window {
    recordMediaView?: (mediaId: string) => void;
  }
}

const MediaDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            try {
                const data = await api.getItem(id);
                setItem(data);
                setFormData({
                    ...data,
                    metadata: JSON.stringify(data.metadata || {}, null, 2)
                });
            } catch (error) {
                console.error("Failed to fetch item", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    useEffect(() => {
        if (id && window.recordMediaView) {
            window.recordMediaView(id);
        }
    }, [id]);

    const handleUpdate = async () => {
        try {
            let parsedMetadata = {};
            try {
                parsedMetadata = JSON.parse(formData.metadata);
            } catch (e) {
                console.error("Invalid JSON metadata", e);
            }

            const updated = await api.updateItem(id!, { ...formData, metadata: parsedMetadata });
            setItem(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.deleteItem(id!);
            navigate('/media');
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!item) return <div className="p-10 text-center">Item not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/media')} className="flex items-center text-gray-600 mb-6 hover:text-blue-600">
                    <ArrowLeft className="size-4 mr-2" /> Back to Media
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50 px-8 py-6 border-b border-blue-100 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-900">{isEditing ? 'Edit Item' : item.title}</h1>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={handleUpdate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <Save className="size-4" /> Save
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                        <Edit className="size-4" /> Edit
                                    </button>
                                    <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100">
                                        <Trash2 className="size-4" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
                                    <textarea name="metadata" value={formData.metadata} onChange={handleChange} rows={5} className="w-full px-4 py-2 border rounded-lg font-mono text-sm" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Media Preview */}
                                {item.fileId && (
                                    <MediaPreview
                                        itemId={item._id}
                                        mimeType={item.metadata?.mimetype || item.mediaType}
                                        fileName={item.metadata?.originalName}
                                        fileSize={item.metadata?.size}
                                    />
                                )}

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Description</h3>
                                    <p className="mt-1 text-gray-900">{item.description || 'No description provided.'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Type</h3>
                                        <p className="mt-1">{getMediaLabel(item.metadata?.mimetype || item.mediaType)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase">File</h3>
                                        {item.fileId ? (
                                            <a
                                                href={`http://localhost:5000/api/items/${item._id}/file`}
                                                download
                                                className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                <Download className="size-4" />
                                                Download
                                            </a>
                                        ) : (
                                            <p className="mt-1 text-gray-500 text-sm">No file attached</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Tags</h3>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.tagIds?.map((t: any) => (
                                            <span key={t._id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{t.name}</span>
                                        ))}
                                    </div>
                                </div>
                                {item.notes && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Notes</h3>
                                        <p className="mt-1 text-gray-700 bg-yellow-50 p-4 rounded-lg">{item.notes}</p>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Metadata</h3>
                                    <pre className="mt-2 bg-gray-100 p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(item.metadata, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDetailPage;
