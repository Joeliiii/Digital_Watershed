import { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X, Search, Calendar, Palette, AlertCircle, Share2, Copy, Check, LinkIcon } from 'lucide-react';
import { api } from '../services/api';
import { Tag as TagIcon } from 'lucide-react';

function ProjectManagement() {
    const [projects, setProjects] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        color: '#3B82F6'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [sharingProjectId, setSharingProjectId] = useState<string | null>(null);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch real data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, mediaData, tagsData] = await Promise.all([
                    api.getProjects(),
                    api.getItems(),
                    api.getTags(),
                ]);
                setProjects(projectsData);
                setMedia(mediaData);
                setTags(tagsData);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Color palette for projects
    const colorPalette = [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
        '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316'
    ];

    // Filter projects based on search
    const filteredProjects = projects.filter((project: any) =>
        (project.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate project statistics
    const getProjectStats = (projectId: string) => {
        const projectMedia = media.filter((m: any) =>
            m.projectIds?.some((p: any) => (typeof p === 'string' ? p : p._id) === projectId)
        );
        const storageUsed = projectMedia.reduce((acc: number, m: any) => acc + (m.metadata?.size || 0), 0);
        return {
            mediaCount: projectMedia.length,
            storageUsed: (storageUsed / (1024 * 1024)).toFixed(2)
        };
    };

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Project name is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Project name must be at least 3 characters';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Project name must be less than 100 characters';
        }

        if (formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Create new project
    const handleCreate = async () => {
        if (!validateForm()) return;

        try {
            const created = await api.createProject({
                title: formData.title.trim(),
                description: formData.description.trim(),
                color: formData.color,
            });
            setProjects([created, ...projects]);
            resetForm();
        } catch (error: any) {
            setErrors({ title: error.message || 'Failed to create project' });
        }
    };

    // Update existing project
    const handleUpdate = async (id: string) => {
        if (!validateForm()) return;

        try {
            const updated = await api.updateProject(id, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                color: formData.color
            });
            setProjects(projects.map(p => p._id === id ? updated : p));
            setEditingId(null);
            resetForm();
        } catch (error: any) {
            setErrors({ title: error.message || 'Failed to update project' });
        }
    };

    // Delete project
    const handleDelete = async (id: string) => {
        const project = projects.find((p: any) => p._id === id);
        const stats = getProjectStats(id);

        const confirmMessage = stats.mediaCount > 0
            ? `This project contains ${stats.mediaCount} media item(s). Are you sure you want to delete "${project?.title}"? This action cannot be undone.`
            : `Are you sure you want to delete "${project?.title}"? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            try {
                await api.deleteProject(id);
                setProjects(projects.filter((p: any) => p._id !== id));
            } catch (error) {
                console.error('Failed to delete project:', error);
            }
        }
    };

    // Start editing a project
    const startEdit = (project: any) => {
        setEditingId(project._id);
        setFormData({
            title: project.title || '',
            description: project.description || '',
            color: project.color || '#3B82F6'
        });
        setIsCreating(false);
        setErrors({});
    };

    // Reset form
    const resetForm = () => {
        setFormData({ title: '', description: '', color: '#3B82F6' });
        setIsCreating(false);
        setEditingId(null);
        setErrors({});
    };

    // Calculate total storage
    const totalStorage = projects.reduce((acc: number, proj: any) => {
        const stats = getProjectStats(proj._id);
        return acc + parseFloat(stats.storageUsed);
    }, 0);

    // Share handlers
    const handleOpenShare = async (project: any) => {
        setSharingProjectId(project._id);
        setShareToken(project.sharedLinkToken || null);
        setCopied(false);
    };

    const handleGenerateLink = async () => {
        if (!sharingProjectId) return;
        setShareLoading(true);
        try {
            const res = await api.generateShareLink(sharingProjectId);
            setShareToken(res.token);
            // Update local state
            setProjects(projects.map(p =>
                p._id === sharingProjectId ? { ...p, sharedLinkToken: res.token } : p
            ));
        } catch (err) {
            console.error('Failed to generate share link:', err);
        } finally {
            setShareLoading(false);
        }
    };

    const handleRevokeLink = async () => {
        if (!sharingProjectId) return;
        setShareLoading(true);
        try {
            await api.revokeShareLink(sharingProjectId);
            setShareToken(null);
            setProjects(projects.map(p =>
                p._id === sharingProjectId ? { ...p, sharedLinkToken: null } : p
            ));
        } catch (err) {
            console.error('Failed to revoke share link:', err);
        } finally {
            setShareLoading(false);
        }
    };

    const getShareUrl = (token: string) => {
        return `${window.location.origin}/shared/${token}`;
    };

    const handleCopyLink = () => {
        if (!shareToken) return;
        navigator.clipboard.writeText(getShareUrl(shareToken));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                                Project Management
                            </h1>
                            <p className="text-slate-600">
                                Organize and manage your research projects
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsCreating(true);
                                setEditingId(null);
                                setErrors({});
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Plus className="size-5" />
                            <span className="font-medium">New Project</span>
                        </button>
                    </div>

                    {/* Storage Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <Folder className="size-5 text-blue-600" />
                                <span className="text-sm font-medium text-slate-600">Total Projects</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{projects.length}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="size-5 text-green-600" />
                                <span className="text-sm font-medium text-slate-600">Total Media Items</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{media.length}</div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <Palette className="size-5 text-purple-600" />
                                <span className="text-sm font-medium text-slate-600">Storage Used</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{totalStorage.toFixed(2)} MB</div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm" />
                    </div>
                </div>

                {/* Create/Edit Form */}
                {(isCreating || editingId) && (
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {editingId ? 'Edit Project' : 'Create New Project'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Project Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData({ ...formData, title: e.target.value });
                                        if (errors.title) setErrors({ ...errors, title: '' });
                                    }}
                                    placeholder="e.g., Coastal Ecosystem Research"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.title ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`} />
                                {errors.title && (
                                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                                        <AlertCircle className="size-4" />
                                        <span>{errors.title}</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (errors.description) setErrors({ ...errors, description: '' });
                                    }}
                                    placeholder="Describe the purpose and scope of this project..."
                                    rows={4}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`} />
                                <div className="flex items-center justify-between mt-1">
                                    {errors.description && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm">
                                            <AlertCircle className="size-4" />
                                            <span>{errors.description}</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-slate-500 ml-auto">
                                        {formData.description.length}/500
                                    </span>
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Project Color
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {colorPalette.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`w-12 h-12 rounded-lg transition-all ${formData.color === color
                                                ? 'ring-4 ring-offset-2 ring-blue-400 scale-110'
                                                : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                            type="button" />
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    disabled={!formData.title.trim()}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <Save className="size-5" />
                                    <span className="font-medium">
                                        {editingId ? 'Update Project' : 'Create Project'}
                                    </span>
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project: any) => {
                        const stats = getProjectStats(project._id);
                        // Find tags used in this project's media
                        const projectMedia = media.filter((m: any) =>
                            m.projectIds?.some((p: any) => (typeof p === 'string' ? p : p._id) === project._id)
                        );
                        const projectTagIds = new Set(
                            projectMedia.flatMap((m: any) =>
                                (m.tagIds || []).map((t: any) => typeof t === 'string' ? t : t?._id)
                            ).filter(Boolean)
                        );
                        const projectTags = tags.filter((t: any) => projectTagIds.has(t._id));
                        return (
                            <div
                                key={project._id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
                            >
                                {/* Color Header */}
                                <div
                                    className="h-3"
                                    style={{ backgroundColor: project.color || '#3B82F6' }} />

                                <div className="p-6">
                                    {/* Project Info */}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            {project.title}
                                        </h3>
                                        <p className="text-slate-600 text-sm line-clamp-2">
                                            {project.description || 'No description provided'}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-slate-100">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Media Items</div>
                                            <div className="text-lg font-bold text-slate-900">{stats.mediaCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Storage</div>
                                            <div className="text-lg font-bold text-slate-900">{stats.storageUsed} MB</div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {projectTags.slice(0, 5).map((tag: any) => (
                                            <span
                                                key={tag._id}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: `${tag.color || '#3B82F6'}15`,
                                                    color: tag.color || '#3B82F6',
                                                    border: `1px solid ${tag.color || '#3B82F6'}30`
                                                }}
                                            >
                                                <TagIcon className="size-3" />
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Metadata */}
                                    <div className="text-xs text-slate-500 mb-4 mt-3">
                                        Created {new Date(project.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(project)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                                        >
                                            <Edit2 className="size-4" />
                                            <span className="text-sm font-medium">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleOpenShare(project)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all"
                                            title="Share project"
                                        >
                                            <Share2 className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project._id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-16">
                        <Folder className="size-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            {searchQuery ? 'No projects found' : 'No projects yet'}
                        </h3>
                        <p className="text-slate-600 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first project to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md"
                            >
                                <Plus className="size-5" />
                                <span className="font-medium">Create Project</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

                {/* Share Modal */}
                {sharingProjectId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Share2 className="size-5 text-blue-600" />
                                    Share Project
                                </h2>
                                <button
                                    onClick={() => { setSharingProjectId(null); setShareToken(null); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {shareToken ? (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            Anyone with this link can view the project and its media (read-only).
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                                <LinkIcon className="size-4 text-gray-400 shrink-0" />
                                                <span className="text-sm text-gray-700 truncate">
                                                    {getShareUrl(shareToken)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleCopyLink}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
                                            >
                                                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleRevokeLink}
                                            disabled={shareLoading}
                                            className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            Revoke Link
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            Generate a shareable link to let anyone view this project and its media.
                                        </p>
                                        <button
                                            onClick={handleGenerateLink}
                                            disabled={shareLoading}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                        >
                                            <Share2 className="size-4" />
                                            {shareLoading ? 'Generating...' : 'Generate Share Link'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}

export default ProjectManagement;