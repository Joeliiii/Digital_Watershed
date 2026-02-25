import { useState, useMemo } from 'react';
import { Tag, Check, X, Search, Filter, Plus, Minus, Tags } from 'lucide-react';
import { useWatershed } from '../context/WatershedContext';

const BatchTagging = () => {
  const { media, setMedia, tags, projects } = useWatershed();
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add');

  // Filter media based on search and filters
  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = filterProject === 'all' || item.projectId === filterProject;
      const matchesType = filterType === 'all' || item.type === filterType;
      
      return matchesSearch && matchesProject && matchesType;
    });
  }, [media, searchQuery, filterProject, filterType]);

  // Toggle individual media selection
  const toggleMediaSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMedia(newSelection);
  };

  // Select all filtered media
  const selectAll = () => {
    const allIds = new Set(filteredMedia.map(m => m.id));
    setSelectedMedia(allIds);
  };

  // Deselect all media
  const deselectAll = () => {
    setSelectedMedia(new Set());
  };

  // Toggle tag selection for batch operation
  const toggleTagSelection = (tagName: string) => {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tagName)) {
      newSelection.delete(tagName);
    } else {
      newSelection.add(tagName);
    }
    setSelectedTags(newSelection);
  };

  // Apply batch tagging operation
  const applyBatchTagging = () => {
    if (selectedMedia.size === 0 || selectedTags.size === 0) {
      alert('Please select both media items and tags to apply.');
      return;
    }

    const updatedMedia = media.map(item => {
      if (selectedMedia.has(item.id)) {
        let newTags = [...item.tags];
        
        if (tagAction === 'add') {
          // Add tags (avoid duplicates)
          selectedTags.forEach(tag => {
            if (!newTags.includes(tag)) {
              newTags.push(tag);
            }
          });
        } else {
          // Remove tags
          newTags = newTags.filter(tag => !selectedTags.has(tag));
        }
        
        return { ...item, tags: newTags };
      }
      return item;
    });

    setMedia(updatedMedia);
    
    // Reset selections
    setSelectedMedia(new Set());
    setSelectedTags(new Set());
    setShowTagPanel(false);
    
    alert(`Successfully ${tagAction === 'add' ? 'added' : 'removed'} tags ${tagAction === 'add' ? 'to' : 'from'} ${selectedMedia.size} item(s)!`);
  };

  
  const getCommonTags = () => {
    if (selectedMedia.size === 0) return new Set<string>();
    
    const selectedItems = media.filter(m => selectedMedia.has(m.id));
    const tagCounts = new Map<string, number>();
    
    selectedItems.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    
    const commonTags = new Set<string>();
    tagCounts.forEach((count, tag) => {
      if (count === selectedMedia.size) {
        commonTags.add(tag);
      }
    });
    
    return commonTags;
  };

  const commonTags = getCommonTags();

  
  const typeConfig = {
    document: { icon: '📄', color: 'bg-orange-100 text-orange-600' },
    image: { icon: '🖼️', color: 'bg-blue-100 text-blue-600' },
    video: { icon: '🎥', color: 'bg-purple-100 text-purple-600' },
    audio: { icon: '🎵', color: 'bg-green-100 text-green-600' },
    code: { icon: '💻', color: 'bg-gray-100 text-gray-600' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Batch Tagging
          </h1>
          <p className="text-slate-600">
            Select multiple media items and apply tags in bulk
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-slate-700">
                {selectedMedia.size} item{selectedMedia.size !== 1 ? 's' : ''} selected
              </div>
              {selectedMedia.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Deselect All
                </button>
              )}
              {filteredMedia.length > 0 && selectedMedia.size === 0 && (
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
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
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Project Filter */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="code">Code</option>
            </select>
          </div>
        </div>

        {/* Tag Panel Modal */}
        {showTagPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Apply Tags to {selectedMedia.size} Item{selectedMedia.size !== 1 ? 's' : ''}
                  </h2>
                  <button
                    onClick={() => {
                      setShowTagPanel(false);
                      setSelectedTags(new Set());
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Action Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTagAction('add')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      tagAction === 'add'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Plus className="size-5" />
                    <span className="font-medium">Add Tags</span>
                  </button>
                  <button
                    onClick={() => setTagAction('remove')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      tagAction === 'remove'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Minus className="size-5" />
                    <span className="font-medium">Remove Tags</span>
                  </button>
                </div>
              </div>

              {/* Tags List */}
              <div className="p-6 overflow-y-auto max-h-96">
                {commonTags.size > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">
                      Common Tags (on all selected items)
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                      {Array.from(commonTags).map(tagName => {
                        const tag = tags.find(t => t.name === tagName);
                        return (
                          <div
                            key={tagName}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-white border border-blue-200 text-blue-700"
                            style={{ borderColor: tag?.color }}
                          >
                            {tagName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  {tagAction === 'add' ? 'Select tags to add:' : 'Select tags to remove:'}
                </h3>
                <div className="space-y-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagSelection(tag.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        selectedTags.has(tag.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div className="text-left">
                          <div className="font-medium text-slate-900">{tag.name}</div>
                          {tag.description && (
                            <div className="text-xs text-slate-500">{tag.description}</div>
                          )}
                        </div>
                      </div>
                      {selectedTags.has(tag.name) && (
                        <Check className="size-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={applyBatchTagging}
                  disabled={selectedTags.size === 0}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
                >
                  {tagAction === 'add' ? 'Add' : 'Remove'} {selectedTags.size} Tag{selectedTags.size !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => {
                    setShowTagPanel(false);
                    setSelectedTags(new Set());
                  }}
                  className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
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
            const project = projects.find(p => p.id === item.projectId);
            const isSelected = selectedMedia.has(item.id);
            const config = typeConfig[item.type];

            return (
              <div
                key={item.id}
                onClick={() => toggleMediaSelection(item.id)}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-4 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-4">
                  {/* Selection Indicator */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="size-4 text-white" />}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                      {config.icon} {item.type}
                    </div>
                  </div>

                  {/* Media Info */}
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Project */}
                  {project && (
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-xs text-slate-500">{project.name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map(tagName => {
                      const tag = tags.find(t => t.name === tagName);
                      return (
                        <div
                          key={tagName}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                          style={{ 
                            backgroundColor: tag ? `${tag.color}20` : undefined,
                            color: tag?.color
                          }}
                        >
                          {tagName}
                        </div>
                      );
                    })}
                    {item.tags.length > 3 && (
                      <div className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                        +{item.tags.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMedia.length === 0 && (
          <div className="text-center py-16">
            <Filter className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No media found
            </h3>
            <p className="text-slate-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTagging;