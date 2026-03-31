import express from 'express';
import {
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  linkSourceItems,
  unlinkSourceItems,
  getSourceItems,
} from '../controllers/artworkController.js';

const router = express.Router();

// TODO: Add auth middleware here once implemented (see projectController.js)

// ─── CRUD ────────────────────────────────────────────────────────────────────
router.get('/',       getArtworks);     // GET    /api/artworks
router.post('/',      createArtwork);   // POST   /api/artworks
router.get('/:id',    getArtworkById);  // GET    /api/artworks/:id
router.put('/:id',    updateArtwork);   // PUT    /api/artworks/:id
router.delete('/:id', deleteArtwork);   // DELETE /api/artworks/:id


router.get('/:id/sources',  getSourceItems);    // GET    /api/artworks/:id/sources
router.post('/:id/link',    linkSourceItems);   // POST   /api/artworks/:id/link
router.delete('/:id/link',  unlinkSourceItems); // DELETE /api/artworks/:id/link

export default router;