import { useState, useMemo, useEffect } from 'react';
import { Tag, Check, X, Search, Filter, Plus, Minus, Tags, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { getMediaIcon, getTypeColor, getMediaCategory, getMediaLabel } from '../utils/mediaUtils';
import { API_URL } from '../services/constants';

const BatchTagging = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add');

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, tagsData, projectsData] = await Promise.all([
          api.getItems(),
          api.getTags(),
          api.getProjects(),
        ]);
        setMedia(mediaData);
        setTags(tagsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load batch tagging data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive available types from data
  const availableTypes = useMemo(() => {
    const cats = new Set<string>();
    media.forEach(item => {
      const cat = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [media]);

  const categoryLabels: Record<string, string> = {
    document: 'Documents', image: 'Images', video: 'Videos',
    audio: 'Audio', code: 'Code', other: 'Other',
  };

  // Filter media
  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      const matchesSearch = searchQuery === '' ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const itemCategory = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      const matchesType = filterType === 'all' || itemCategory === filterType;
      const matchesProject = filterProject === 'all' || item.projectIds?.some((p: any) => (typeof p === 'string' ? p : p._id) === filterProject);
      return matchesSearch && matchesType && matchesProject;
    });
  }, [media, searchQuery, filterType, filterProject]);

  const toggleMediaSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMedia(newSelection);
  };

  const selectAll = () => setSelectedMedia(new Set(filteredMedia.map(m => m._id)));
  const deselectAll = () => setSelectedMedia(new Set());

  const toggleTagSelection = (tagId: string) => {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tagId)) {
      newSelection.delete(tagId);
    } else {
      newSelection.add(tagId);
    }
    setSelectedTags(newSelection);
  };

  // Apply batch tagging via API
  const applyBatchTagging = async () => {
    if (selectedMedia.size === 0 || selectedTags.size === 0) return;
    setSaving(true);

    try {
      const updates = Array.from(selectedMedia).map(async (mediaId) => {
        const item = media.find(m => m._id === mediaId);
        if (!item) return;

        const currentTagIds = (item.tagIds || []).map((t: any) => typeof t === 'string' ? t : t?._id).filter(Boolean);

        let newTagIds: string[];
        if (tagAction === 'add') {
          const combined = new Set([...currentTagIds, ...selectedTags]);
          newTagIds = Array.from(combined);
        } else {
          newTagIds = currentTagIds.filter((id: string) => !selectedTags.has(id));
        }

        return api.updateItem(mediaId, { tagIds: newTagIds });
      });

      const results = await Promise.all(updates);
      // Refresh media list after bulk update
      const updatedMedia = await api.getItems();
      setMedia(updatedMedia);

      setSelectedMedia(new Set());
      setSelectedTags(new Set());
      setShowTagPanel(false);
    } catch (error) {
      console.error('Batch tagging failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // Common tags across selected items
  const getCommonTags = () => {
    if (selectedMedia.size === 0) return new Set<string>();
    const selectedItems = media.filter(m => selectedMedia.has(m._id));
    const tagCounts = new Map<string, number>();
    selectedItems.forEach(item => {
      (item.tagIds || []).forEach((tag: any) => {
        const tagId = typeof tag === 'string' ? tag : tag?._id;
        if (tagId) tagCounts.set(tagId, (tagCounts.get(tagId) || 0) + 1);
      });
    });
    const commonTags = new Set<string>();
    tagCounts.forEach((count, tagId) => {
      if (count === selectedMedia.size) commonTags.add(tagId);
    });
    return commonTags;
  };

  const commonTags = getCommonTags();

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading media...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Action Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
              {selectedMedia.size} item{selectedMedia.size !== 1 ? 's' : ''} selected
            </div>
            {selectedMedia.size > 0 && (
              <button onClick={deselectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Deselect All
              </button>
            )}
            {filteredMedia.length > 0 && selectedMedia.size === 0 && (
              <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Select All ({filteredMedia.length})
              </button>
            )}
          </div>

          <button
            onClick={() => setShowTagPanel(true)}
            disabled={selectedMedia.size === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Tags className="size-5" />
            <span className="font-medium">Apply Tags</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map((project: any) => (
              <option key={project._id} value={project._id}>{project.title}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            {availableTypes.map(cat => (
              <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag Panel Modal */}
      {showTagPanel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-blue-900">
                  Apply Tags to {selectedMedia.size} Item{selectedMedia.size !== 1 ? 's' : ''}
                </h2>
                <button
                  onClick={() => { setShowTagPanel(false); setSelectedTags(new Set()); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTagAction('add')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    tagAction === 'add' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="size-5" /> <span className="font-medium">Add Tags</span>
                </button>
                <button
                  onClick={() => setTagAction('remove')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    tagAction === 'remove' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Minus className="size-5" /> <span className="font-medium">Remove Tags</span>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {commonTags.size > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Common Tags (on all selected items)</h3>
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                    {Array.from(commonTags).map(tagId => {
                      const tag = tags.find((t: any) => t._id === tagId);
                      return (
                        <div key={tagId} className="px-3 py-1 rounded-full text-sm font-medium bg-white border border-blue-200 text-blue-700">
                          {tag?.name || tagId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {tagAction === 'add' ? 'Select tags to add:' : 'Select tags to remove:'}
              </h3>
              <div className="space-y-2">
                {tags.map((tag: any) => (
                  <button
                    key={tag._id}
                    onClick={() => toggleTagSelection(tag._id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedTags.has(tag._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color || '#3B82F6' }} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{tag.name}</div>
                      </div>
                    </div>
                    {selectedTags.has(tag._id) && <Check className="size-5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={applyBatchTagging}
                disabled={selectedTags.size === 0 || saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {tagAction === 'add' ? 'Add' : 'Remove'} {selectedTags.size} Tag{selectedTags.size !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => { setShowTagPanel(false); setSelectedTags(new Set()); }}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedia.map(item => {
          const isSelected = selectedMedia.has(item._id);
          const mimeType = item.metadata?.mimetype || item.mediaType;
          const Icon = getMediaIcon(mimeType);
          const category = getMediaCategory(mimeType);
          const isImage = category === 'image' && item.fileId;

          return (
            <div
              key={item._id}
              onClick={() => toggleMediaSelection(item._id)}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-blue-500 ring-4 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Thumbnail */}
              {isImage && (
                <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={`${API_URL}/items/${item._id}/file`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="size-4 text-white" />}
                  </div>
                  <div className={`p-1.5 rounded-md ${getTypeColor(mimeType)}`}>
                    <Icon className="size-3.5" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{getMediaLabel(mimeType)}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(item.tagIds || []).slice(0, 3).map((tag: any) => {
                    const tagName = typeof tag === 'string' ? tag : tag?.name;
                    const tagColor = typeof tag === 'string' ? '#3B82F6' : tag?.color;
                    return (
                      <span key={typeof tag === 'string' ? tag : tag?._id} className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                        {tagName}
                      </span>
                    );
                  })}
                  {(item.tagIds?.length || 0) > 3 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                      +{item.tagIds.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMedia.length === 0 && (
        <div className="text-center py-16">
          <Filter className="size-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default BatchTagging;