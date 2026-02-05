import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatershed } from '@/app/context/WatershedContext';
import { FolderPlus, Palette } from 'lucide-react';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { addProject } = useWatershed();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const colorOptions = [
    '#3B82F6', // blue
    '#60A5FA', // light blue
    '#2563EB', // dark blue
    '#1E40AF', // darker blue
    '#93C5FD', // sky blue
    '#DBEAFE', // very light blue
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(formData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Create New Project</h1>
            <p className="text-gray-600">Start organizing your research materials into a new project</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-blue-100">
            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
              <div className="flex gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-12 h-12 rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FolderPlus className="size-5" />
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
