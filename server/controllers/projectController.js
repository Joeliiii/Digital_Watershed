import Project from '../models/Project.js';

// @desc    Get all projects (simple list)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        // Return minimal fields for dropdowns
        const projects = await Project.find({}, 'title _id color').sort({ title: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getProjects };
