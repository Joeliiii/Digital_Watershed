import Item from '../models/Item.js';
import Tag from '../models/Tag.js';
import Project from '../models/Project.js';
import { logAction } from './auditLogController.js';

// @desc    Get all items
// @route   GET /api/items
// @access  Private (TODO: middleware)
const getItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('projectIds', 'title color')
            .populate('tagIds', 'name color')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('projectIds', 'title') // Populate basic project info
            .populate('tagIds', 'name color'); // Populate basic tag info

        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
    try {
        let itemData = { ...req.body };
        let fileId = null;

        // Handle File Upload manually
        if (req.file) {
            const fs = (await import('fs'));
            const mongoose = (await import('mongoose')).default;

            // Ensure connection is open
            if (mongoose.connection.readyState !== 1) {
                throw new Error("Database connection is not open");
            }

            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'fs'
            });

            const filePath = req.file.path;
            const filename = `${Date.now()}-${req.file.originalname}`;

            // Create upload stream
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                }
            });

            fileId = uploadStream.id;

            // Stream file from disk to GridFS
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            // Cleanup temp file
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete temp file:", filePath);
            });

            itemData.fileId = fileId;
            itemData.storageType = 'gridfs';

            // Metadata merging
            const fileMetadata = {
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            };
            let existingMetadata = {};
            try {
                if (typeof itemData.metadata === 'string') {
                    existingMetadata = JSON.parse(itemData.metadata);
                } else {
                    existingMetadata = itemData.metadata || {};
                }
            } catch (e) {
                console.warn("Could not parse existing metadata", e);
            }
            itemData.metadata = { ...existingMetadata, ...fileMetadata };
        }

        itemData.ownerId = itemData.ownerId || "6987c45da0cb4423e71e1ffd"; // TODO: Authenticated user

        const newItem = await Item.create(itemData);
        await logAction('create', 'Item', newItem._id, { title: newItem.title });
        res.status(201).json(newItem);
    } catch (error) {
        // If error and file was uploaded to GridFS, try to delete it (cleanup)
        if (req.file) {
            // Cleaning up temp file if it still exists
            const fs = (await import('fs'));
            fs.unlink(req.file.path, () => { });
        }
        console.error("Create Item Error:", error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Bulk create items from multiple files
// @route   POST /api/items/bulk
// @access  Private
const bulkCreateItems = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const fs = (await import('fs'));
        const mongoose = (await import('mongoose')).default;

        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection is not open');
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'fs'
        });

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                const filename = `${Date.now()}-${file.originalname}`;
                const uploadStream = bucket.openUploadStream(filename, {
                    metadata: {
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    }
                });
                const fileId = uploadStream.id;

                await new Promise((resolve, reject) => {
                    fs.createReadStream(file.path)
                        .pipe(uploadStream)
                        .on('error', reject)
                        .on('finish', resolve);
                });

                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete temp file:', file.path);
                });

                let projectIds = [];
                if (req.body.projectIds) {
                    projectIds = Array.isArray(req.body.projectIds)
                        ? req.body.projectIds : [req.body.projectIds];
                }
                let tagIds = [];
                if (req.body.tagIds) {
                    tagIds = Array.isArray(req.body.tagIds)
                        ? req.body.tagIds : [req.body.tagIds];
                }

                const itemData = {
                    ownerId: req.body.ownerId || '6987c45da0cb4423e71e1ffd',
                    title: file.originalname,
                    description: req.body.description || '',
                    mediaType: file.mimetype || 'application/octet-stream',
                    storageType: 'gridfs',
                    fileId,
                    projectIds,
                    tagIds,
                    notes: req.body.notes || '',
                    metadata: {
                        originalName: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size
                    }
                };

                const newItem = await Item.create(itemData);
                results.push(newItem);
            } catch (fileError) {
                errors.push({ file: file.originalname, error: fileError.message });
                fs.unlink(file.path, () => {});
            }
        }

        for (const item of results) {
            await logAction('create', 'Item', item._id, { title: item.title, bulk: true });
        }

        res.status(201).json({ created: results, errors });
    } catch (error) {
        if (req.files) {
            const fs = (await import('fs'));
            req.files.forEach(f => fs.unlink(f.path, () => {}));
        }
        console.error('Bulk Create Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get item file (stream) — supports Range headers for video/audio seek
// @route   GET /api/items/:id/file
// @access  Private (or Public with token?)
const getItemFile = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || !item.fileId) {
            return res.status(404).json({ message: 'File not found' });
        }

        const mongoose = (await import('mongoose')).default;
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'fs'
        });

        // Look up file metadata from GridFS to get total size
        const files = await bucket.find({ _id: item.fileId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found in storage' });
        }
        const fileInfo = files[0];
        const fileSize = fileInfo.length;
        const mimeType = (item.metadata && item.metadata.mimetype) || 'application/octet-stream';
        const fileName = (item.metadata && item.metadata.originalName) || fileInfo.filename || 'download';

        // Determine if this type should be viewed inline or downloaded
        const inlineTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/'];
        const isInline = inlineTypes.some(t => mimeType.startsWith(t));
        const disposition = isInline ? 'inline' : 'attachment';

        // Handle Range requests (for video/audio seeking)
        const rangeHeader = req.headers.range;
        if (rangeHeader) {
            const parts = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': mimeType,
                'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"`,
            });

            const downloadStream = bucket.openDownloadStream(item.fileId, { start, end: end + 1 });
            downloadStream.on('error', () => {
                if (!res.headersSent) res.status(404).json({ message: 'File not found in storage' });
            });
            downloadStream.pipe(res);
        } else {
            // Full file response
            res.set({
                'Content-Type': mimeType,
                'Content-Length': fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"`,
            });

            const downloadStream = bucket.openDownloadStream(item.fileId);
            downloadStream.on('error', () => {
                if (!res.headersSent) res.status(404).json({ message: 'File not found in storage' });
            });
            downloadStream.pipe(res);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('projectIds', 'title');

        if (item) {
            // Detect project association changes before updating
            const oldProjectIds = (item.projectIds || []).map(p =>
                typeof p === 'object' ? p._id.toString() : p.toString()
            );
            const newProjectIds = req.body.projectIds
                ? req.body.projectIds.map(p => typeof p === 'object' ? p._id?.toString() || p.toString() : p.toString())
                : oldProjectIds; // if projectIds not in body, no change

            const addedProjects = newProjectIds.filter(id => !oldProjectIds.includes(id));
            const removedProjects = oldProjectIds.filter(id => !newProjectIds.includes(id));

            // Perform the update
            const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            }).populate('tagIds').populate('projectIds');

            await logAction('update', 'Item', updatedItem._id, { title: updatedItem.title });

            // Log project association changes
            for (const projectId of addedProjects) {
                const project = await Project.findById(projectId);
                await logAction('add_to_project', 'Item', updatedItem._id, {
                    title: updatedItem.title,
                    projectId,
                    projectTitle: project?.title || 'Unknown Project',
                });
            }
            for (const projectId of removedProjects) {
                const project = await Project.findById(projectId);
                await logAction('remove_from_project', 'Item', updatedItem._id, {
                    title: updatedItem.title,
                    projectId,
                    projectTitle: project?.title || 'Unknown Project',
                });
            }

            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (item) {
            if (item.fileId) {
                // Delete file from GridFS
                const mongoose = (await import('mongoose')).default;
                const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                    bucketName: 'fs'
                });
                try {
                    await bucket.delete(item.fileId);
                } catch (e) {
                    console.error("Failed to delete GridFS file", e);
                }
            }

            await item.deleteOne();
            await logAction('delete', 'Item', req.params.id, { title: item.title });
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getItems,
    getItemById,
    createItem,
    bulkCreateItems,
    getItemFile,
    updateItem,
    deleteItem
};
