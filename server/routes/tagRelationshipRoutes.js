import express from 'express';
const router = express.Router();
import {
    getTagRelationships,
    getRelationshipsByTag,
    createTagRelationship,
    updateTagRelationship,
    deleteTagRelationship,
    getSuggestions
} from '../controllers/tagRelationshipController.js';

router.route('/')
    .get(getTagRelationships)
    .post(createTagRelationship);

// Must be before /:id
router.get('/suggestions', getSuggestions);
router.get('/by-tag/:tagId', getRelationshipsByTag);

router.route('/:id')
    .put(updateTagRelationship)
    .delete(deleteTagRelationship);

export default router;
