import express from 'express';
const router = express.Router();
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    generateShareLink,
    revokeShareLink,
    getSharedProject
} from '../controllers/projectController.js';

router.route('/')
    .get(getProjects)
    .post(createProject);

// Share routes — must be before /:id
router.get('/shared/:token', getSharedProject);

router.route('/:id')
    .put(updateProject)
    .delete(deleteProject);

router.post('/:id/share', generateShareLink);
router.delete('/:id/share', revokeShareLink);

export default router;
