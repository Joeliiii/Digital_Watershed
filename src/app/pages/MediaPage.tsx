import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Filter, Tag, Plus } from 'lucide-react';
import { getMediaIcon, getTypeColor, getMediaCategory, getMediaLabel } from '../utils/mediaUtils';

const MediaPage = () => {
  const navigate = useNavigate();
  const [media, setMedia] = useState<any[]>([]); // State for media items
  const [projects, setProjects] = useState<any[]>([]); // State for projects
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData] = await Promise.all([
          api.getItems(),
          api.getProjects()
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load media:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allTags = useMemo(() => Array.from(new Set(media.flatMap(m => m.tagIds?.map((t: any) => t.name) || []))).sort(), [media]);

  // Derive available type categories dynamically from the data
  const availableTypes = useMemo(() => {
    const categories = new Set<string>();
    media.forEach(item => {
      const cat = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      categories.add(cat);
    });
    return Array.from(categories).sort();
  }, [media]);

  const categoryLabels: Record<string, string> = {
    document: 'Documents',
    image: 'Images',
    video: 'Videos',
    audio: 'Audio',
    code: 'Code',
    other: 'Other',
  };

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      // Search filter — safe against missing description
      const matchesSearch = searchQuery === '' ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter — compare by category
      const itemCategory = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      const matchesType = selectedType === 'all' || itemCategory === selectedType;

      // Project filter
      const matchesProject = selectedProject === 'all' || item.projectIds?.some((p: any) => p._id === selectedProject);

      // Tag filter
      const matchesTag = selectedTag === 'all' || item.tagIds?.some((t: any) => t.name === selectedTag);

      return matchesSearch && matchesType && matchesProject && matchesTag;
    });
  }, [media, searchQuery, selectedType, selectedProject, selectedTag]);



  if (loading) return <div className="p-10 text-center">Loading media...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Media Library</h1>
            <p className="text-gray-600">Search and filter your research materials</p>
          </div>
          <button
            onClick={() => navigate('/media/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="size-5" />
            Add Media
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media by title or description..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              {availableTypes.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag: any) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-600">
              {filteredMedia.length} {filteredMedia.length === 1 ? 'result' : 'results'}
            </div>
          </div>
        </div>

        {/* Media Grid */}
        {filteredMedia.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => {
              const mimeType = item.metadata?.mimetype || item.mediaType;
              const Icon = getMediaIcon(mimeType);
              const category = getMediaCategory(mimeType);
              const isImage = category === 'image' && item.fileId;

              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/media/${item._id}`)}
                  className="bg-white rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* Thumbnail for images */}
                  {isImage && (
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={`http://localhost:5000/api/items/${item._id}/file`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${getTypeColor(mimeType)}`}>
                        <Icon className="size-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-900 mb-1 truncate">{item.title}</h3>
                        <p className="text-xs text-gray-500">{getMediaLabel(mimeType)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description || ''}</p>

                    {/* Project Badges */}
                    {item.projectIds && item.projectIds.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {item.projectIds.map((p: any) => (
                          <div
                            key={p._id}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600"
                          >
                            {p.title}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tagIds?.slice(0, 3).map((tag: any) => (
                        <span
                          key={tag._id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-50 text-gray-600 text-xs"
                        >
                          <Tag className="size-3" />
                          {tag.name}
                        </span>
                      ))}
                      {item.tagIds?.length > 3 && (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
                          +{item.tagIds.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-blue-100 text-center">
            <Search className="size-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPage;
