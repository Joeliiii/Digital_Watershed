import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';

const router = express.Router();

// TODO: Add auth middleware here once implemented 

// Notes are polymorphic — any entity type can have notes.
// Filter by entity using query params: GET /api/notes?entityId=<id>&entityModel=Artwork
//
router.get('/',     getNotes);      // GET    /api/notes 
router.post('/',    createNote);    // POST   /api/notes
router.get('/:id',  getNoteById);  // GET    /api/notes/:id
router.put('/:id',  updateNote);   // PUT    /api/notes/:id
router.delete('/:id', deleteNote); // DELETE /api/notes/:id  (soft delete)

export default router;