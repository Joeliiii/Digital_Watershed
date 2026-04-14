import express from 'express';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getStorageStats,
    bulkExport,
} from '../controllers/adminController.js';

const router = express.Router();

// User management
router.route('/users')
    .get(getUsers)
    .post(createUser);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

// Storage stats
router.get('/storage', getStorageStats);

// Bulk export
router.post('/export', bulkExport);

export default router;
