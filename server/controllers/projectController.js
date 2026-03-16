import crypto from 'crypto';
import Project from '../models/Project.js';
import Item from '../models/Item.js';

// @desc    Get all projects (simple list)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({}).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { title, description, color, visibility } = req.body;
        const project = await Project.create({
            title,
            description: description || '',
            color: color || '#3B82F6',
            visibility: visibility || 'private',
            ownerId: req.body.ownerId || "6987c45da0cb4423e71e1ffd" // TODO: Use auth middleware
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate a shareable link token for a project
// @route   POST /api/projects/:id/share
// @access  Private
const generateShareLink = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const token = crypto.randomUUID();
        project.sharedLinkToken = token;
        await project.save();

        res.json({ token, sharedLinkToken: token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Revoke a shareable link token
// @route   DELETE /api/projects/:id/share
// @access  Private
const revokeShareLink = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.sharedLinkToken = null;
        await project.save();

        res.json({ message: 'Share link revoked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a shared project by token (public)
// @route   GET /api/projects/shared/:token
// @access  Public
const getSharedProject = async (req, res) => {
    try {
        const project = await Project.findOne({ sharedLinkToken: req.params.token });
        if (!project) {
            return res.status(404).json({ message: 'Shared project not found or link has been revoked' });
        }

        const items = await Item.find({ projectIds: project._id })
            .sort({ createdAt: -1 })
            .populate('tagIds', 'name color');

        res.json({ project, items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    generateShareLink,
    revokeShareLink,
    getSharedProject
};
