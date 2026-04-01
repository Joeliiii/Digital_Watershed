import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tags, Plus, X, Search, Loader2, Link2, Lightbulb, ArrowRight, Trash2, HelpCircle, ChevronDown, Layers } from 'lucide-react';
import { getMediaIcon, getTypeColor, getMediaCategory, getMediaLabel } from '../utils/mediaUtils';
import BatchTagging from '../components/BatchTagging';

const TaggingPage = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'batch'>('manage');
  const [media, setMedia] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newGlobalTag, setNewGlobalTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Tag relationship state
  const [relationships, setRelationships] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [relFrom, setRelFrom] = useState('');
  const [relTo, setRelTo] = useState('');
  const [relType, setRelType] = useState('related');
  const [relLoading, setRelLoading] = useState(false);
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const relationshipTypes = [
    { value: 'related', label: 'Related', color: 'bg-blue-100 text-blue-700', description: 'These tags are about similar topics', advanced: false },
    { value: 'parent', label: 'Parent → Child', color: 'bg-purple-100 text-purple-700', description: 'One tag is a broader category of the other (e.g. Biology → Marine Biology)', advanced: false },
    { value: 'depends_on', label: 'Depends On', color: 'bg-amber-100 text-amber-700', description: 'Understanding one topic requires knowledge of the other', advanced: true },
    { value: 'derived_from', label: 'Derived From', color: 'bg-green-100 text-green-700', description: 'One concept was built on or grew out of the other', advanced: true },
    { value: 'contradicts', label: 'Contradicts', color: 'bg-red-100 text-red-700', description: 'These represent conflicting ideas or competing approaches', advanced: true },
  ];

  const visibleTypes = showAdvancedTypes
    ? relationshipTypes
    : relationshipTypes.filter(rt => !rt.advanced);

  const selectedTypeInfo = relationshipTypes.find(rt => rt.value === relType);

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

  // Load relationships and suggestions
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const [rels, suggs] = await Promise.all([
          api.getTagRelationships(),
          api.getTagRelationshipSuggestions(),
        ]);
        setRelationships(rels);
        setSuggestions(suggs);
      } catch (error) {
        console.error('Failed to load relationships:', error);
      }
    };
    fetchRelationships();
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

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-6 p-1 bg-blue-100/60 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'manage'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-white/50'
              }`}
            >
              <Tags className="size-4" />
              Tag Manager
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'batch'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-white/50'
              }`}
            >
              <Layers className="size-4" />
              Batch Tagging
            </button>
          </div>
        </div>

        {activeTab === 'batch' ? (
          <BatchTagging />
        ) : (
          <>

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

        {/* Tag Relationships Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Tag Relationships</h2>
          <p className="text-gray-600 mb-6">Connect tags to build a knowledge web that spans across projects</p>

          {/* Onboarding Card */}
          {showOnboarding && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 mb-6 relative">
              <button
                onClick={() => setShowOnboarding(false)}
                className="absolute top-3 right-3 text-blue-300 hover:text-blue-500 transition-colors"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-start gap-3">
                <Link2 className="size-6 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">How Tag Relationships Work</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Tag relationships let you map how your ideas connect across your entire workspace — not just within a single project.
                    Start by linking tags that feel related. <strong>"Related" is always a safe default</strong> if you're not sure which type to pick.
                    The more connections you make, the richer your knowledge web becomes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Relationship */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Link2 className="size-4" />
                Create Relationship
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Tag</label>
                  <select
                    value={relFrom}
                    onChange={(e) => setRelFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a tag...</option>
                    {tags.map((t: any) => (
                      <option key={t._id} value={t._id} disabled={t._id === relTo}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Relationship Type</label>
                  <select
                    value={relType}
                    onChange={(e) => setRelType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {visibleTypes.map(rt => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                  {selectedTypeInfo && (
                    <p className="mt-1.5 text-[11px] text-gray-500 flex items-start gap-1">
                      <HelpCircle className="size-3 mt-0.5 shrink-0 text-gray-400" />
                      {selectedTypeInfo.description}
                    </p>
                  )}
                  {!showAdvancedTypes && (
                    <button
                      onClick={() => setShowAdvancedTypes(true)}
                      className="mt-2 text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <ChevronDown className="size-3" />
                      Show advanced types
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Tag</label>
                  <select
                    value={relTo}
                    onChange={(e) => setRelTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a tag...</option>
                    {tags.map((t: any) => (
                      <option key={t._id} value={t._id} disabled={t._id === relFrom}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!relFrom || !relTo) return;
                    setRelLoading(true);
                    try {
                      const created = await api.createTagRelationship({ fromTagId: relFrom, toTagId: relTo, relationshipType: relType });
                      setRelationships(prev => [created, ...prev]);
                      // Remove from suggestions if present
                      setSuggestions(prev => prev.filter(s =>
                        !([s.fromTag._id, s.toTag._id].includes(relFrom) && [s.fromTag._id, s.toTag._id].includes(relTo))
                      ));
                      setRelFrom('');
                      setRelTo('');
                    } catch (err: any) {
                      alert(err.message || 'Failed to create relationship');
                    } finally {
                      setRelLoading(false);
                    }
                  }}
                  disabled={!relFrom || !relTo || relFrom === relTo || relLoading}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Link2 className="size-4" />
                  {relLoading ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </div>

            {/* Existing Relationships */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">
                Existing Relationships ({relationships.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {relationships.length > 0 ? relationships.map((rel: any) => {
                  const typeInfo = relationshipTypes.find(rt => rt.value === rel.relationshipType) || { label: rel.relationshipType, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <div key={rel._id} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 group">
                      <span className="text-sm font-medium text-gray-800 truncate">{rel.fromTagId?.name || '?'}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <ArrowRight className="size-3 text-gray-400" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <ArrowRight className="size-3 text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">{rel.toTagId?.name || '?'}</span>
                      <button
                        onClick={async () => {
                          try {
                            await api.deleteTagRelationship(rel._id);
                            setRelationships(prev => prev.filter(r => r._id !== rel._id));
                          } catch (err) {
                            console.error('Failed to delete:', err);
                          }
                        }}
                        className="ml-auto text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove relationship"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-400">No relationships created yet</p>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                Suggested Connections
              </h3>
              <p className="text-xs text-gray-500 mb-4">Tags that frequently appear together on the same items</p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {suggestions.length > 0 ? suggestions.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-gray-800 truncate">{s.fromTag?.name}</span>
                        <span className="text-gray-400">&</span>
                        <span className="font-medium text-gray-800 truncate">{s.toTag?.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{s.coOccurrences} shared items</span>
                    </div>
                    <button
                      onClick={async () => {
                        setRelLoading(true);
                        try {
                          const created = await api.createTagRelationship({
                            fromTagId: s.fromTag._id,
                            toTagId: s.toTag._id,
                            relationshipType: 'related'
                          });
                          setRelationships(prev => [created, ...prev]);
                          setSuggestions(prev => prev.filter((_, idx) => idx !== i));
                        } catch (err: any) {
                          console.error('Failed to link:', err);
                        } finally {
                          setRelLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-medium shrink-0"
                    >
                      Link
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400">No suggestions yet — tag more items to generate connections</p>
                )}
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaggingPage;
