import Tag from '../models/Tag.js';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Private
const getTags = async (req, res) => {
    try {
        const tags = await Tag.find({}).sort({ name: 1 });
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
        const { name, color, description, ownerId } = req.body;

        // Check if tag exists for this owner
        const existingTag = await Tag.findOne({ name, ownerId: ownerId || "6987c45da0cb4423e71e1ffd" });

        if (existingTag) {
            return res.status(200).json(existingTag);
        }

        const tag = await Tag.create({
            name,
            color: color || '#3B82F6',
            ownerId: ownerId || "6987c45da0cb4423e71e1ffd"
        });
        res.status(201).json(tag);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a tag
// @route   PUT /api/tags/:id
// @access  Private
const updateTag = async (req, res) => {
    try {
        const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }
        res.json(tag);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
// @access  Private
const deleteTag = async (req, res) => {
    try {
        const tag = await Tag.findByIdAndDelete(req.params.id);
        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }
        res.json({ message: 'Tag deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getTags, createTag, updateTag, deleteTag };
