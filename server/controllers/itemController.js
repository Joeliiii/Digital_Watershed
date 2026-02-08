import Item from '../models/Item.js';
import Tag from '../models/Tag.js';
import Project from '../models/Project.js';

// @desc    Get all items
// @route   GET /api/items
// @access  Private (TODO: middleware)
const getItems = async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
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

// @desc    Get item file (stream)
// @route   GET /api/items/:id/file
// @access  Private (or Public with token?)
const getItemFile = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item || !item.fileId) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Get GridFS Bucket
        // Note: access mongoose connection to get db
        const mongoose = (await import('mongoose')).default;
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'fs'
        });

        const downloadStream = bucket.openDownloadStream(item.fileId);

        downloadStream.on('error', (error) => {
            res.status(404).json({ message: 'File not found in storage' });
        });

        // Optional: Set Content-Type if available in metadata
        if (item.metadata && item.metadata.mimetype) {
            res.set('Content-Type', item.metadata.mimetype);
        }

        downloadStream.pipe(res);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (item) {
            // If updating file, we might need to delete old one (logic omitted for simplicity for now, or handle replace)
            const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });
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
    getItemFile,
    updateItem,
    deleteItem
};
