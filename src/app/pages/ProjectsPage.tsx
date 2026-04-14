import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getMediaLabel, getMediaIcon } from '../utils/mediaUtils';
import { API_URL } from '../services/constants';
import {
  FolderPlus,
  Palette,
  ChevronRight,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Unlink,
  Search,
  FolderOpen,
  Calendar,
  FileText,
} from 'lucide-react';

type ViewState = 'list' | 'detail' | 'create';

const ProjectsPage = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('list');

  // Detail view state
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', color: '' });
  const [saving, setSaving] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');

  // Create form state
  const [createForm, setCreateForm] = useState({ title: '', description: '', color: '#3B82F6' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const colorOptions = [
    '#3B82F6', '#60A5FA', '#2563EB', '#1E40AF', '#93C5FD',
    '#8B5CF6', '#A855F7', '#10B981', '#059669', '#F59E0B',
    '#EF4444', '#EC4899', '#F97316', '#6366F1', '#14B8A6',
  ];

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load project detail
  const openProject = async (projectId: string) => {
    setDetailLoading(true);
    setViewState('detail');
    try {
      const data = await api.getProject(projectId);
      setSelectedProject(data.project);
      setProjectMedia(data.items || []);
      setEditForm({
        title: data.project.title,
        description: data.project.description || '',
        color: data.project.color || '#3B82F6',
      });
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Save project edits
  const handleSaveEdit = async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      const updated = await api.updateProject(selectedProject._id, editForm);
      setSelectedProject(updated);
      setIsEditing(false);
      // Update list
      setProjects((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setSaving(false);
    }
  };

  // Remove media from project (not delete the media)
  const handleRemoveMedia = async (item: any) => {
    if (!selectedProject) return;
    if (!window.confirm(`Remove "${item.title}" from this project? The media will not be deleted.`)) return;

    try {
      const updatedProjectIds = (item.projectIds || [])
        .map((p: any) => (typeof p === 'object' ? p._id : p))
        .filter((id: string) => id !== selectedProject._id);

      await api.updateItem(item._id, { projectIds: updatedProjectIds });

      // Remove from local list
      setProjectMedia((prev) => prev.filter((m) => m._id !== item._id));
    } catch (error) {
      console.error('Failed to remove media from project:', error);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    if (!window.confirm(`Delete project "${selectedProject.title}"? This will NOT delete the media inside it.`)) return;

    try {
      await api.deleteProject(selectedProject._id);
      setProjects((prev) => prev.filter((p) => p._id !== selectedProject._id));
      setViewState('list');
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const newProject = await api.createProject(createForm);
      setProjects((prev) => [newProject, ...prev]);
      setCreateForm({ title: '', description: '', color: '#3B82F6' });
      setViewState('list');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  // Filtered media for search
  const filteredMedia = mediaSearch
    ? projectMedia.filter((m) =>
        m.title?.toLowerCase().includes(mediaSearch.toLowerCase())
      )
    : projectMedia;

  // Media count per project (computed from items)
  const getMediaCount = (projectId: string) => {
    // We don't have per-project counts in the list view unless we fetch them.
    // Return null to indicate we don't have this info yet.
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  // ─── CREATE VIEW ────────────────────────────────────────────
  if (viewState === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-6 py-8">
          <button
            onClick={() => setViewState('list')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Projects
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-blue-900 mb-2">Create New Project</h1>
              <p className="text-gray-500">Start organizing your research materials</p>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100">
              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter project name"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  placeholder="Describe your project"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-blue-900 mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="size-4" />
                    <span>Project Color</span>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, color })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        createForm.color === color
                          ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setViewState('list')}
                  className="flex-1 px-6 py-3 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FolderPlus className="size-5" />
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────────────────
  if (viewState === 'detail') {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading project...</p>
          </div>
        </div>
      );
    }

    if (!selectedProject) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <p className="text-gray-500">Project not found</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setViewState('list');
              setSelectedProject(null);
              setIsEditing(false);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Projects
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-6">
            <div
              className="h-3 w-full"
              style={{ backgroundColor: selectedProject.color || '#3B82F6' }}
            />
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, color })}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            editForm.color === color
                              ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          title: selectedProject.title,
                          description: selectedProject.description || '',
                          color: selectedProject.color || '#3B82F6',
                        });
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="size-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: selectedProject.color || '#3B82F6' }}
                    >
                      <FolderOpen className="size-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-blue-900 mb-1">
                        {selectedProject.title}
                      </h1>
                      {selectedProject.description && (
                        <p className="text-gray-500 text-sm mb-2">{selectedProject.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Created {new Date(selectedProject.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {projectMedia.length} media item{projectMedia.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium transition-colors"
                    >
                      <Edit3 className="size-3.5" /> Edit
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media List */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between">
              <h2 className="text-base font-semibold text-blue-900">
                Attached Media ({projectMedia.length})
              </h2>
              {projectMedia.length > 3 && (
                <div className="relative">
                  <Search className="size-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter media..."
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  />
                </div>
              )}
            </div>

            {filteredMedia.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ImageIcon className="size-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  {projectMedia.length === 0
                    ? 'No media attached to this project yet'
                    : 'No media matches your search'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredMedia.map((item) => {
                  const MediaIcon = getMediaIcon(item.mediaType || item.metadata?.mimetype || '');
                  return (
                    <div
                      key={item._id}
                      className="px-6 py-3.5 flex items-center gap-4 hover:bg-blue-50/50 transition-colors group"
                    >
                      {/* Thumbnail or icon */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.fileId && (item.mediaType || '').startsWith('image') ? (
                          <img
                            src={`${API_URL}/items/${item._id}/file`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MediaIcon className="size-5 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-3">
                          <span>{getMediaLabel(item.mediaType || item.metadata?.mimetype || '')}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.tagIds?.length > 0 && (
                            <span>{item.tagIds.length} tag{item.tagIds.length === 1 ? '' : 's'}</span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="hidden md:flex items-center gap-1 max-w-[200px] overflow-hidden">
                        {(item.tagIds || []).slice(0, 3).map((tag: any) => (
                          <span
                            key={tag._id || tag}
                            className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium whitespace-nowrap"
                          >
                            {tag.name || tag}
                          </span>
                        ))}
                        {(item.tagIds || []).length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{item.tagIds.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/media/${item._id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View detail"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <button
                          onClick={() => handleRemoveMedia(item)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove from project"
                        >
                          <Unlink className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-1">Projects</h1>
            <p className="text-gray-500">Manage and organize your research projects</p>
          </div>
          <button
            onClick={() => setViewState('create')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <FolderPlus className="size-4" /> New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-blue-100 text-center">
            <FolderOpen className="size-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No projects yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Create your first project to start organizing media
            </p>
            <button
              onClick={() => setViewState('create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <FolderPlus className="size-4" /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project._id}
                onClick={() => openProject(project._id)}
                className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all text-left group"
              >
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: project.color || '#3B82F6' }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                      >
                        <FolderOpen className="size-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                          {project.title}
                        </h3>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-blue-400 transition-colors mt-1" />
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
