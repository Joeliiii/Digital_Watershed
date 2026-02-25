import express from 'express';
const router = express.Router();
import { getTags, createTag, updateTag, deleteTag } from '../controllers/tagController.js';

router.route('/')
    .get(getTags)
    .post(createTag);

router.route('/:id')
    .put(updateTag)
    .delete(deleteTag);

export default router;
