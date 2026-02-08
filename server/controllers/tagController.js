import Tag from '../models/Tag.js';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Private
const getTags = async (req, res) => {
    try {
        const tags = await Tag.find({}, 'name color _id').sort({ name: 1 });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a tag
// @route   POST /api/tags
// @access  Private
const createTag = async (req, res) => {
    try {
        const { name, color, ownerId } = req.body;

        // Check if tag exists for this owner
        const existingTag = await Tag.findOne({ name, ownerId: ownerId || "6987c45da0cb4423e71e1ffd" }); // TODO: req.user

        if (existingTag) {
            return res.status(200).json(existingTag);
        }

        const tag = await Tag.create({
            name,
            color: color || '#3B82F6', // Default blue if not provided
            ownerId: ownerId || "6987c45da0cb4423e71e1ffd" // TODO: Use specific user ID or auth middleware
        });
        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export { getTags, createTag };
