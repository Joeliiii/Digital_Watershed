import { useState, useEffect, useMemo } from 'react';
import { Tag, Plus, Edit2, Trash2, Save, X, Search, Hash, Link2, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const TagManagement = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, tagsData] = await Promise.all([
          api.getItems(),
          api.getTags(),
        ]);
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

  // Color palette for tags
  const colorPalette = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316',
    '#84CC16', '#F43F5E', '#0EA5E9'
  ];

  // Calculate tag usage statistics from real media data
  const tagStats = useMemo(() => {
    const stats = new Map<string, number>();
    media.forEach((item: any) => {
      (item.tagIds || []).forEach((tag: any) => {
        const tagId = typeof tag === 'string' ? tag : tag?._id;
        if (tagId) stats.set(tagId, (stats.get(tagId) || 0) + 1);
      });
    });
    return stats;
  }, [media]);

  // Filter tags based on search
  const filteredTags = tags.filter((tag: any) =>
    (tag.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tag.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort tags by usage
  const sortedTags = [...filteredTags].sort((a: any, b: any) => {
    const usageA = tagStats.get(a._id) || 0;
    const usageB = tagStats.get(b._id) || 0;
    return usageB - usageA;
  });

  // Validate form
  const validateForm = (isEdit: boolean = false) => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Tag name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Tag name must be less than 50 characters';
    }

    // Check for duplicates
    const duplicate = tags.find((t: any) =>
      t.name.toLowerCase() === formData.name.toLowerCase() &&
      (!isEdit || t._id !== editingId)
    );
    if (duplicate) {
      newErrors.name = 'A tag with this name already exists';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create new tag via API
  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const created = await api.createTag({
        name: formData.name.trim(),
        color: formData.color,
      });
      setTags([...tags, created]);
      resetForm();
    } catch (error: any) {
      setErrors({ name: error.message || 'Failed to create tag' });
    }
  };

  // Update existing tag via API
  const handleUpdate = async (id: string) => {
    if (!validateForm(true)) return;

    try {
      const updated = await api.updateTag(id, {
        name: formData.name.trim(),
        color: formData.color
      });
      setTags(tags.map((t: any) => t._id === id ? updated : t));
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      setErrors({ name: error.message || 'Failed to update tag' });
    }
  };

  // Delete tag via API
  const handleDelete = async (id: string) => {
    const tag = tags.find((t: any) => t._id === id);
    const usageCount = tagStats.get(id) || 0;

    const confirmMessage = usageCount > 0
      ? `This tag is used by ${usageCount} media item(s). Are you sure you want to delete "${tag?.name}"?`
      : `Are you sure you want to delete "${tag?.name}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        await api.deleteTag(id);
        setTags(tags.filter((t: any) => t._id !== id));
      } catch (error) {
        console.error('Failed to delete tag:', error);
      }
    }
  };

  // Start editing a tag
  const startEdit = (tag: any) => {
    setEditingId(tag._id);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#3B82F6'
    });
    setIsCreating(false);
    setErrors({});
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setIsCreating(false);
    setEditingId(null);
    setErrors({});
  };

  // Get most popular tags
  const popularTags = [...tags]
    .map((tag: any) => ({
      ...tag,
      usage: tagStats.get(tag._id) || 0
    }))
    .filter(tag => tag.usage > 0)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  // Total usage calculations
  const totalUses = Array.from(tagStats.values()).reduce((a, b) => a + b, 0);
  const tagsInUse = tagStats.size;

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                Tag Management
              </h1>
              <p className="text-slate-600">
                Organize and categorize your research media with tags
              </p>
            </div>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                setErrors({});
              }}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Plus className="size-5" />
              <span className="font-medium">New Tag</span>
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Hash className="size-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">Total Tags</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{tags.length}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="size-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">Tags in Use</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{tagsInUse}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Link2 className="size-5 text-green-600" />
                <span className="text-sm font-medium text-slate-600">Total Uses</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{totalUses}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="size-5 text-orange-600" />
                <span className="text-sm font-medium text-slate-600">Avg Uses/Tag</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {tags.length > 0 ? (totalUses / tags.length).toFixed(1) : 0}
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="size-5 text-purple-600" />
                Most Popular Tags
              </h3>
              <div className="flex flex-wrap gap-3">
                {popularTags.map((tag: any) => (
                  <div
                    key={tag._id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                    />
                    <span className="font-medium text-slate-700">{tag.name}</span>
                    <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
                      {tag.usage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-purple-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? 'Edit Tag' : 'Create New Tag'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tag Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="e.g., marine-biology, field-notes, interview"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-300' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="size-4" />
                    <span>{errors.name}</span>
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
                  placeholder="Describe what this tag represents..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-300' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="size-4" />
                      <span>{errors.description}</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">
                    {formData.description.length}/200
                  </span>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tag Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-12 h-12 rounded-lg transition-all ${formData.color === color
                          ? 'ring-4 ring-offset-2 ring-purple-400 scale-110'
                          : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Save className="size-5" />
                  <span className="font-medium">
                    {editingId ? 'Update Tag' : 'Create Tag'}
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

        {/* Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedTags.map((tag: any) => {
            const usage = tagStats.get(tag._id) || 0;
            return (
              <div
                key={tag._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-5">
                  {/* Tag Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tag.color || '#3B82F6'}20` }}
                    >
                      <Hash
                        className="size-5"
                        style={{ color: tag.color || '#3B82F6' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {tag.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {usage} use{usage !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {tag.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {tag.description}
                    </p>
                  )}

                  {/* Created Date */}
                  <div className="text-xs text-slate-400 mb-3">
                    Created {new Date(tag.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => startEdit(tag)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm"
                    >
                      <Edit2 className="size-4" />
                      <span className="font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(tag._id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
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
        {filteredTags.length === 0 && (
          <div className="text-center py-16">
            <Tag className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No tags found' : 'No tags yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first tag to start organizing your media'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all shadow-md"
              >
                <Plus className="size-5" />
                <span className="font-medium">Create Tag</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManagement;