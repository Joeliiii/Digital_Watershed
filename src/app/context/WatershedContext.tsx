import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface MediaItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'code';
  description: string;
  tags: string[];
  projectId: string;
  dateAdded: string;
  relatedMedia: string[];
  fileSize?: number; 
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string; 
  createdAt: string;    
}

interface WatershedContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  media: MediaItem[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  addMedia: (media: Omit<MediaItem, 'id' | 'dateAdded'>) => void;
  updateMedia: (id: string, updates: Partial<MediaItem>) => void;
  deleteMedia: (id: string) => void;
  tags: Tag[]; 
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

const WatershedContext = createContext<WatershedContextType | undefined>(undefined);

export const useWatershed = () => {
  const context = useContext(WatershedContext);
  if (!context) {
    throw new Error('useWatershed must be used within WatershedProvider');
  }
  return context;
};

export const WatershedProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Software Architecture Research',
      description: 'Research on modern software design patterns and architectural decisions',
      createdAt: new Date('2024-01-15').toISOString(),
      color: '#3B82F6'
    },
    {
      id: '2',
      name: 'User Experience Studies',
      description: 'Collection of UX research findings and user interviews',
      createdAt: new Date('2024-02-20').toISOString(),
      color: '#60A5FA'
    },
  ]);

  const [media, setMedia] = useState<MediaItem[]>([
    {
      id: '1',
      title: 'Microservices Architecture Paper',
      type: 'document',
      description: 'Research paper on microservices design patterns',
      tags: ['architecture', 'microservices', 'design-patterns'],
      projectId: '1',
      dateAdded: new Date('2024-03-01').toISOString(),
      relatedMedia: ['2', '3']
    },
    {
      id: '2',
      title: 'API Design Guidelines',
      type: 'document',
      description: 'Best practices for RESTful API design',
      tags: ['api', 'rest', 'design-patterns'],
      projectId: '1',
      dateAdded: new Date('2024-03-05').toISOString(),
      relatedMedia: ['1']
    },
    {
      id: '3',
      title: 'System Architecture Diagram',
      type: 'image',
      description: 'Visual representation of the current system architecture',
      tags: ['architecture', 'diagram', 'visualization'],
      projectId: '1',
      dateAdded: new Date('2024-03-10').toISOString(),
      relatedMedia: ['1', '4']
    },
    {
      id: '4',
      title: 'User Interview #1',
      type: 'audio',
      description: 'Interview with senior developer about workflow challenges',
      tags: ['interview', 'user-research', 'workflow'],
      projectId: '2',
      dateAdded: new Date('2024-03-12').toISOString(),
      relatedMedia: ['3', '5']
    },
    {
      id: '5',
      title: 'UX Flow Mockups',
      type: 'image',
      description: 'Wireframes and mockups for new user flows',
      tags: ['ux', 'wireframes', 'design'],
      projectId: '2',
      dateAdded: new Date('2024-03-15').toISOString(),
      relatedMedia: ['4']
    },
  ]);

  const [tags, setTags] = useState<Tag[]>([
  {
    id: '1',
    name: 'Research',
    color: '#3B82F6', // Blue
    description: 'General academic and field research data.',
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '2',
    name: 'Case Study',
    color: '#10B981', // Green
    description: 'In-depth analysis of specific watershed restoration projects and their long-term ecological outcomes.',
    createdAt: new Date('2024-03-05').toISOString()
  },
  {
    id: '3',
    name: 'Documentation',
    color: '#8B5CF6', // Purple
    description: 'Documentation on extensive sabbatical research and experience.',
    createdAt: new Date('2024-03-12').toISOString()
  }
]);

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, newProject]);
  };

  const addMedia = (mediaItem: Omit<MediaItem, 'id' | 'dateAdded'>) => {
    const newMedia: MediaItem = {
      ...mediaItem,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };
    setMedia([...media, newMedia]);
  };

  const updateMedia = (id: string, updates: Partial<MediaItem>) => {
    setMedia(media.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteMedia = (id: string) => {
    setMedia(media.filter(item => item.id !== id));
  };

  return (
    <WatershedContext.Provider
      value={{
        projects,
        setProjects,
        media,
        addProject,
        addMedia,
        updateMedia,
        deleteMedia,
        tags,
        setTags,
        setMedia,
      }}
    >
      {children}
    </WatershedContext.Provider>
  );
};
