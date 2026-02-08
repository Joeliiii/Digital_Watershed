import express from 'express';
const router = express.Router();
import { getTags, createTag } from '../controllers/tagController.js';

router.route('/')
    .get(getTags)
    .post(createTag);

export default router;
