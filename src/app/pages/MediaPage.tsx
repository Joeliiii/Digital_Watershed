import { useState, useMemo } from 'react';
import { useWatershed } from '@/app/context/WatershedContext';
import { Search, Filter, FileText, Image, Video, Music, Code, Tag } from 'lucide-react';

const MediaPage = () => {
  const { media, projects } = useWatershed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = Array.from(new Set(media.flatMap(m => m.tags))).sort();

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = selectedType === 'all' || item.type === selectedType;

      // Project filter
      const matchesProject = selectedProject === 'all' || item.projectId === selectedProject;

      // Tag filter
      const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);

      return matchesSearch && matchesType && matchesProject && matchesTag;
    });
  }, [media, searchQuery, selectedType, selectedProject, selectedTag]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'code': return Code;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-700';
      case 'image': return 'bg-blue-100 text-blue-700';
      case 'video': return 'bg-blue-100 text-blue-700';
      case 'audio': return 'bg-blue-100 text-blue-700';
      case 'code': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Media Library</h1>
          <p className="text-gray-600">Search and filter your research materials</p>
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
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="code">Code</option>
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
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
              const Icon = getMediaIcon(item.type);
              const project = projects.find(p => p.id === item.projectId);
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${getTypeColor(item.type)}`}>
                      <Icon className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-900 mb-1 truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                  {/* Project Badge */}
                  {project && (
                    <div className="mb-3">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: project.color + '20', color: project.color }}
                      >
                        {project.name}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs"
                      >
                        <Tag className="size-3" />
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                    Added {new Date(item.dateAdded).toLocaleDateString()}
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
