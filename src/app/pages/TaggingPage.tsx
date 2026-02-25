import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tags, Plus, X, Search, Loader2 } from 'lucide-react';
import { getMediaIcon, getTypeColor, getMediaCategory, getMediaLabel } from '../utils/mediaUtils';

const TaggingPage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newGlobalTag, setNewGlobalTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

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

  const selectedMediaItem = media.find((m: any) => m._id === selectedMedia);

  // Tag IDs already on the selected item — handle both populated objects and raw strings
  const selectedItemTagIds = (selectedMediaItem?.tagIds || []).map((t: any) =>
    typeof t === 'string' ? t : t?._id
  ).filter(Boolean);

  // Filtered media for the sidebar
  const filteredMedia = media.filter((item: any) =>
    searchQuery === '' ||
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Assign an existing tag to the selected media item
  const handleAssignTag = async (tagId: string) => {
    if (!selectedMedia || selectedItemTagIds.includes(tagId)) return;
    setSaving(true);
    try {
      const updatedTagIds = [...selectedItemTagIds, tagId];
      const updated = await api.updateItem(selectedMedia, { tagIds: updatedTagIds });
      setMedia(prev => prev.map(m => m._id === selectedMedia ? updated : m));
    } catch (error) {
      console.error('Failed to assign tag:', error);
    } finally {
      setSaving(false);
    }
  };

  // Remove a tag from the selected media item
  const handleRemoveTag = async (tagId: string) => {
    if (!selectedMedia) return;
    setSaving(true);
    try {
      const updatedTagIds = selectedItemTagIds.filter((id: string) => id !== tagId);
      const updated = await api.updateItem(selectedMedia, { tagIds: updatedTagIds });
      setMedia(prev => prev.map(m => m._id === selectedMedia ? updated : m));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    } finally {
      setSaving(false);
    }
  };

  // Create a new tag AND assign it to the selected item
  const handleAddTagToItem = async () => {
    if (!newTag.trim() || !selectedMedia) return;
    setSaving(true);
    try {
      // Check if tag already exists
      let tag = tags.find((t: any) => t.name.toLowerCase() === newTag.trim().toLowerCase());
      if (!tag) {
        tag = await api.createTag({ name: newTag.trim() });
        setTags(prev => [...prev, tag]);
      }
      // Assign to item
      if (!selectedItemTagIds.includes(tag._id)) {
        const updatedTagIds = [...selectedItemTagIds, tag._id];
        const updated = await api.updateItem(selectedMedia, { tagIds: updatedTagIds });
        setMedia(prev => prev.map(m => m._id === selectedMedia ? updated : m));
      }
      setNewTag('');
    } catch (error) {
      console.error('Failed to create/assign tag:', error);
    } finally {
      setSaving(false);
    }
  };

  // Create a new global tag (not assigned to any item)
  const handleCreateGlobalTag = async () => {
    if (!newGlobalTag.trim()) return;
    const exists = tags.some((t: any) => t.name.toLowerCase() === newGlobalTag.trim().toLowerCase());
    if (exists) {
      setNewGlobalTag('');
      return;
    }
    try {
      const tag = await api.createTag({ name: newGlobalTag.trim() });
      setTags(prev => [...prev, tag]);
      setNewGlobalTag('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Tag Management</h1>
          <p className="text-gray-600">Organize and categorize your media items with tags</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media List Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Create Global Tag */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Create New Tag</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGlobalTag}
                  onChange={(e) => setNewGlobalTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGlobalTag()}
                  placeholder="Tag name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleCreateGlobalTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* All Tags Overview */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">All Tags ({tags.length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: any) => (
                  <span
                    key={tag._id}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    {tag.name}
                  </span>
                ))}
                {tags.length === 0 && <p className="text-gray-400 text-xs">No tags yet</p>}
              </div>
            </div>

            {/* Media List */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <h2 className="text-sm font-semibold text-blue-900 mb-3">Media Items ({media.length})</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search media..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {filteredMedia.map((item: any) => {
                  const mimeType = item.metadata?.mimetype || item.mediaType;
                  const Icon = getMediaIcon(mimeType);
                  return (
                    <button
                      key={item._id}
                      onClick={() => setSelectedMedia(item._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${selectedMedia === item._id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border border-transparent'
                        }`}
                    >
                      <div className={`p-1.5 rounded ${getTypeColor(mimeType)}`}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.tagIds?.length || 0} tags</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tagging Interface */}
          <div className="lg:col-span-2">
            {selectedMediaItem ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    {(() => { const Icon = getMediaIcon(selectedMediaItem.metadata?.mimetype || selectedMediaItem.mediaType); return <Icon className="size-5 text-blue-600" />; })()}
                    <h2 className="text-2xl font-semibold text-blue-900">
                      {selectedMediaItem.title}
                    </h2>
                    {saving && <Loader2 className="size-4 text-blue-500 animate-spin" />}
                  </div>
                  <p className="text-gray-600 text-sm">{selectedMediaItem.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-1">{getMediaLabel(selectedMediaItem.metadata?.mimetype || selectedMediaItem.mediaType)}</p>
                </div>

                {/* Current Tags on this item */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Current Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMediaItem.tagIds && selectedMediaItem.tagIds.length > 0 ? (
                      selectedMediaItem.tagIds.map((tag: any) => {
                        const tagId = typeof tag === 'string' ? tag : tag?._id;
                        const tagName = typeof tag === 'string'
                          ? (tags.find((t: any) => t._id === tag)?.name || tag)
                          : (tag?.name || tagId);
                        if (!tagId) return null;
                        return (
                          <span
                            key={tagId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm"
                          >
                            <Tags className="size-3" />
                            {tagName}
                            <button
                              onClick={() => handleRemoveTag(tagId)}
                              className="hover:text-red-600 transition-colors"
                              disabled={saving}
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No tags yet</p>
                    )}
                  </div>
                </div>

                {/* Add New Tag to item */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Add New Tag</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTagToItem()}
                      placeholder="Enter tag name (creates if new)"
                      className="flex-1 px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    />
                    <button
                      onClick={handleAddTagToItem}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="size-4" />
                      Add
                    </button>
                  </div>
                </div>

                {/* All Available Tags — click to assign */}
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Available Tags (click to assign)</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => {
                      const isAssigned = selectedItemTagIds.includes(tag._id);
                      return (
                        <button
                          key={tag._id}
                          onClick={() => !isAssigned && handleAssignTag(tag._id)}
                          disabled={isAssigned || saving}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isAssigned
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                            }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                    {tags.length === 0 && <p className="text-sm text-gray-400">No tags created yet. Create one above!</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-blue-100 text-center">
                <Tags className="size-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">No Media Selected</h3>
                <p className="text-gray-600">Select a media item from the list to manage its tags</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaggingPage;
