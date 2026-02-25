import express from 'express';
const router = express.Router();
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projectController.js';

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .put(updateProject)
    .delete(deleteProject);

export default router;
