import express from 'express';
const router = express.Router();
import upload from '../middleware/upload.js';
import {
    getItems,
    getItemById,
    createItem,
    bulkCreateItems,
    getItemFile,
    updateItem,
    deleteItem
} from '../controllers/itemController.js';

router.route('/')
    .get(getItems)
    .post(upload.single('file'), createItem);

// Bulk upload — must be before /:id
router.post('/bulk', upload.array('files', 20), bulkCreateItems);
router.route('/:id')
    .get(getItemById)
    .put(updateItem)
    .delete(deleteItem);

router.route('/:id/file').get(getItemFile);

export default router;
