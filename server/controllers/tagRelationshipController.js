import TagRelationship from '../models/TagRelationship.js';
import Item from '../models/Item.js';
import Tag from '../models/Tag.js';

// @desc    Get all tag relationships
// @route   GET /api/tag-relationships
// @access  Private
const getTagRelationships = async (req, res) => {
    try {
        const relationships = await TagRelationship.find()
            .populate('fromTagId', 'name color')
            .populate('toTagId', 'name color')
            .sort({ createdAt: -1 });
        res.json(relationships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get relationships for a specific tag
// @route   GET /api/tag-relationships/by-tag/:tagId
// @access  Private
const getRelationshipsByTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const relationships = await TagRelationship.find({
            $or: [{ fromTagId: tagId }, { toTagId: tagId }]
        })
            .populate('fromTagId', 'name color')
            .populate('toTagId', 'name color');
        res.json(relationships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a tag relationship
// @route   POST /api/tag-relationships
// @access  Private
const createTagRelationship = async (req, res) => {
    try {
        const { fromTagId, toTagId, relationshipType } = req.body;

        if (!fromTagId || !toTagId || !relationshipType) {
            return res.status(400).json({ message: 'fromTagId, toTagId, and relationshipType are required' });
        }

        if (fromTagId === toTagId) {
            return res.status(400).json({ message: 'A tag cannot be related to itself' });
        }

        // Check for existing relationship in either direction
        const existing = await TagRelationship.findOne({
            $or: [
                { fromTagId, toTagId },
                { fromTagId: toTagId, toTagId: fromTagId }
            ]
        });
        if (existing) {
            return res.status(400).json({ message: 'A relationship between these tags already exists' });
        }

        const relationship = await TagRelationship.create({
            fromTagId,
            toTagId,
            relationshipType,
            ownerId: req.body.ownerId || '6987c45da0cb4423e71e1ffd'
        });

        const populated = await TagRelationship.findById(relationship._id)
            .populate('fromTagId', 'name color')
            .populate('toTagId', 'name color');

        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a tag relationship
// @route   PUT /api/tag-relationships/:id
// @access  Private
const updateTagRelationship = async (req, res) => {
    try {
        const relationship = await TagRelationship.findByIdAndUpdate(
            req.params.id,
            { relationshipType: req.body.relationshipType },
            { new: true, runValidators: true }
        )
            .populate('fromTagId', 'name color')
            .populate('toTagId', 'name color');

        if (!relationship) {
            return res.status(404).json({ message: 'Relationship not found' });
        }
        res.json(relationship);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a tag relationship
// @route   DELETE /api/tag-relationships/:id
// @access  Private
const deleteTagRelationship = async (req, res) => {
    try {
        const relationship = await TagRelationship.findByIdAndDelete(req.params.id);
        if (!relationship) {
            return res.status(404).json({ message: 'Relationship not found' });
        }
        res.json({ message: 'Relationship deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get auto-suggested relationships based on tag co-occurrence
// @route   GET /api/tag-relationships/suggestions
// @access  Private
const getSuggestions = async (req, res) => {
    try {
        // Find all items with 2+ tags
        const items = await Item.find({
            'tagIds.1': { $exists: true }   // has at least 2 tags
        }).select('tagIds');

        // Count how often each pair of tags appears together
        const pairCounts = {};
        for (const item of items) {
            const tagIds = item.tagIds.map(t => t.toString());
            for (let i = 0; i < tagIds.length; i++) {
                for (let j = i + 1; j < tagIds.length; j++) {
                    const key = [tagIds[i], tagIds[j]].sort().join('|');
                    pairCounts[key] = (pairCounts[key] || 0) + 1;
                }
            }
        }

        // Get existing relationships to exclude already-linked pairs
        const existingRels = await TagRelationship.find();
        const existingPairs = new Set(
            existingRels.map(r =>
                [r.fromTagId.toString(), r.toTagId.toString()].sort().join('|')
            )
        );

        // Filter to pairs that co-occur 2+ times and don't already have a relationship
        const suggestions = Object.entries(pairCounts)
            .filter(([key, count]) => count >= 2 && !existingPairs.has(key))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([key, count]) => {
                const [tagA, tagB] = key.split('|');
                return { fromTagId: tagA, toTagId: tagB, coOccurrences: count };
            });

        // Populate tag names
        const tagIds = [...new Set(suggestions.flatMap(s => [s.fromTagId, s.toTagId]))];
        const tagMap = {};
        const tagDocs = await Tag.find({ _id: { $in: tagIds } }).select('name color');
        tagDocs.forEach(t => { tagMap[t._id.toString()] = { _id: t._id, name: t.name, color: t.color }; });

        const populated = suggestions.map(s => ({
            fromTag: tagMap[s.fromTagId] || { _id: s.fromTagId, name: 'Unknown' },
            toTag: tagMap[s.toTagId] || { _id: s.toTagId, name: 'Unknown' },
            coOccurrences: s.coOccurrences
        }));

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getTagRelationships,
    getRelationshipsByTag,
    createTagRelationship,
    updateTagRelationship,
    deleteTagRelationship,
    getSuggestions
};
