import { useState } from 'react';
import { useWatershed } from '@/app/context/WatershedContext';
import { Tags, Plus, X } from 'lucide-react';

const TaggingPage = () => {
  const { media, updateMedia } = useWatershed();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  const allTags = Array.from(new Set(media.flatMap(m => m.tags))).sort();
  
  const selectedMediaItem = media.find(m => m.id === selectedMedia);

  const handleAddTag = () => {
    if (newTag.trim() && selectedMedia) {
      const mediaItem = media.find(m => m.id === selectedMedia);
      if (mediaItem && !mediaItem.tags.includes(newTag.trim())) {
        updateMedia(selectedMedia, {
          tags: [...mediaItem.tags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (selectedMedia) {
      const mediaItem = media.find(m => m.id === selectedMedia);
      if (mediaItem) {
        updateMedia(selectedMedia, {
          tags: mediaItem.tags.filter(t => t !== tag)
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Tag Management</h1>
          <p className="text-gray-600">Organize and categorize your media items with tags</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Media Items</h2>
              <div className="space-y-2">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMedia(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedMedia === item.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.tags.length} tags</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tagging Interface */}
          <div className="lg:col-span-2">
            {selectedMediaItem ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-blue-900 mb-2">
                    {selectedMediaItem.title}
                  </h2>
                  <p className="text-gray-600 text-sm">{selectedMediaItem.description}</p>
                </div>

                {/* Current Tags */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Current Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMediaItem.tags.length > 0 ? (
                      selectedMediaItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm"
                        >
                          <Tags className="size-3" />
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-blue-900"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No tags yet</p>
                    )}
                  </div>
                </div>

                {/* Add New Tag */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Add New Tag</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Enter tag name"
                      className="flex-1 px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="size-4" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Suggested Tags */}
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-3">All Available Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (!selectedMediaItem.tags.includes(tag)) {
                            updateMedia(selectedMedia!, { tags: [...selectedMediaItem.tags, tag] });
                          }
                        }}
                        disabled={selectedMediaItem.tags.includes(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedMediaItem.tags.includes(tag)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
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
