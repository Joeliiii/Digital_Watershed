import Note from '../models/Note.js';
import mongoose from 'mongoose';

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const VALID_MODELS = ['Artwork', 'Item', 'Project', 'Tag']; // mirrors Note.js enum

// TODO: Replace with TEMP_OWNER_ID once auth middleware is implemented 
const TEMP_OWNER_ID = '6987c45da0cb4423e71e1ffd';

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/notes?entityId=&entityModel=
 * Returns all notes for the authenticated user, optionally filtered by entity.
 *
 * Query params:
 *   entityId    — filter to a specific entity (requires entityModel)
 *   entityModel — e.g. 'Artwork' | 'Item' | 'Project' | 'Tag'
 */
export const getNotes = async (req, res) => {
  try {
    const { entityId, entityModel } = req.query;
    const filter = { ownerId: TEMP_OWNER_ID };

    if (entityId || entityModel) {
      if (!entityId || !entityModel) {
        return res.status(400).json({
          message: 'Both entityId and entityModel are required when filtering by entity',
        });
      }
      if (!isValidId(entityId)) {
        return res.status(400).json({ message: 'Invalid entityId' });
      }
      if (!VALID_MODELS.includes(entityModel)) {
        return res.status(400).json({
          message: `entityModel must be one of: ${VALID_MODELS.join(', ')}`,
        });
      }
      filter.entityId = entityId;
      filter.entityModel = entityModel;
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/notes/:id
 * Returns a single note by ID.
 */
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid note ID' });

    const note = await Note.findOne({ _id: id, ownerId: TEMP_OWNER_ID });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/notes
 * Creates a new note attached to any entity.
 *
 * Body: { entityId, entityModel, content, title? }
 */
export const createNote = async (req, res) => {
  try {
    const { entityId, entityModel, content, title } = req.body;

    // Validate required fields
    if (!entityId || !entityModel || !content) {
      return res.status(400).json({ message: 'entityId, entityModel, and content are required' });
    }
    if (!isValidId(entityId)) {
      return res.status(400).json({ message: 'Invalid entityId' });
    }
    if (!VALID_MODELS.includes(entityModel)) {
      return res.status(400).json({
        message: `entityModel must be one of: ${VALID_MODELS.join(', ')}`,
      });
    }

    const note = await Note.create({
      ownerId: TEMP_OWNER_ID,
      entityId,
      entityModel,
      content,
      ...(title && { title }),
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /api/notes/:id
 * Updates a note's title and/or content.
 */
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid note ID' });

    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ message: 'Provide at least one field to update: title, content' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, ownerId: TEMP_OWNER_ID },
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
      { new: true, runValidators: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /api/notes/:id
 * Soft-deletes a note (sets isDeleted: true).
 */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid note ID' });

    const note = await Note.findOneAndUpdate(
      { _id: id, ownerId: TEMP_OWNER_ID },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json({ message: 'Note deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};