import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Folder, Tag, Calendar, Lock, FileText } from 'lucide-react';
import { getMediaIcon, getMediaLabel, getMediaCategory, getTypeColor } from '../utils/mediaUtils';
import { API_URL } from '../services/constants';

const SharedProjectPage = () => {
    const { token } = useParams<{ token: string }>();
    const [project, setProject] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShared = async () => {
            if (!token) return;
            try {
                const data = await api.getSharedProject(token);
                setProject(data.project);
                setItems(data.items || []);
            } catch (err: any) {
                setError(err.message || 'This shared link is invalid or has been revoked.');
            } finally {
                setLoading(false);
            }
        };
        fetchShared();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading shared project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
                        <Lock className="size-16 text-gray-300 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Available</h1>
                        <p className="text-gray-500">
                            {error || 'This shared link is invalid or has been revoked by the project owner.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color || '#3B82F6' }}
                        />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shared Project</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                    {project.description && (
                        <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <FileText className="size-4" />
                            {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="size-4" />
                            Created {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Media Grid */}
            <div className="container mx-auto px-6 py-10">
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item: any) => {
                            const mimeType = item.metadata?.mimetype || item.mediaType;
                            const Icon = getMediaIcon(mimeType);
                            const category = getMediaCategory(mimeType);
                            const isImage = category === 'image' && item.fileId;

                            return (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {isImage && (
                                        <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`${API_URL}/items/${item._id}/file`}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`p-2.5 rounded-lg ${getTypeColor(mimeType)}`}>
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-0.5 truncate">{item.title}</h3>
                                                <p className="text-xs text-gray-500">{getMediaLabel(mimeType)}</p>
                                            </div>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {item.tagIds?.slice(0, 3).map((tag: any) => (
                                                <span
                                                    key={tag._id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs"
                                                >
                                                    <Tag className="size-3" />
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                            Added {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                        <Folder className="size-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Media Yet</h3>
                        <p className="text-gray-500">This project doesn't have any media items.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-white/80 backdrop-blur">
                <div className="container mx-auto px-6 py-4 text-center text-sm text-gray-500">
                    Shared via Digital Watershed
                </div>
            </div>
        </div>
    );
};

export default SharedProjectPage;
