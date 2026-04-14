import User from '../models/User.js';
import Item from '../models/Item.js';
import Project from '../models/Project.js';
import Tag from '../models/Tag.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import archiver from 'archiver';
import { logAction } from './auditLogController.js';

// ─── User Management ──────────────────────────────────────────

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user (admin creates aids)
// @route   POST /api/admin/users
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'A user with that email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: role || 'user',
        });

        await logAction('create', 'User', user._id, { name: user.name, email: user.email, role: user.role });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.role) user.role = req.body.role;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        await logAction('update', 'User', user._id, { name: user.name });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await logAction('delete', 'User', user._id, { name: user.name, email: user.email });
        await user.deleteOne();

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Storage Stats ────────────────────────────────────────────

// @desc    Get storage statistics
// @route   GET /api/admin/storage
const getStorageStats = async (req, res) => {
    try {
        const db = mongoose.connection.db;

        // GridFS file stats
        const filesCollection = db.collection('fs.files');
        const chunksCollection = db.collection('fs.chunks');

        const [fileDocs, totalItems, totalProjects, totalTags, totalUsers] = await Promise.all([
            filesCollection.find({}).toArray(),
            Item.countDocuments(),
            Project.countDocuments(),
            Tag.countDocuments(),
            User.countDocuments(),
        ]);

        const totalFiles = fileDocs.length;
        const totalFileSize = fileDocs.reduce((sum, f) => sum + (f.length || 0), 0);

        // Size breakdown by mime type
        const sizeByType = {};
        fileDocs.forEach((f) => {
            const mime = f.metadata?.mimetype || f.metadata?.contentType || 'unknown';
            const category = mime.split('/')[0] || 'other';
            if (!sizeByType[category]) sizeByType[category] = { count: 0, size: 0 };
            sizeByType[category].count++;
            sizeByType[category].size += f.length || 0;
        });

        // DB stats
        let dbStats = {};
        try {
            dbStats = await db.stats();
        } catch (e) {
            // stats() may not be available in all environments
        }

        res.json({
            files: {
                totalFiles,
                totalFileSize,
                sizeByType,
            },
            counts: {
                items: totalItems,
                projects: totalProjects,
                tags: totalTags,
                users: totalUsers,
            },
            database: {
                dataSize: dbStats.dataSize || 0,
                storageSize: dbStats.storageSize || 0,
                collections: dbStats.collections || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Bulk Export ───────────────────────────────────────────────

// @desc    Bulk export items as a ZIP (metadata JSON + files)
// @route   POST /api/admin/export
const bulkExport = async (req, res) => {
    try {
        const { itemIds, includeFiles } = req.body;

        let items;
        if (itemIds && itemIds.length > 0) {
            items = await Item.find({ _id: { $in: itemIds } })
                .populate('projectIds', 'title color')
                .populate('tagIds', 'name color');
        } else {
            items = await Item.find({})
                .populate('projectIds', 'title color')
                .populate('tagIds', 'name color');
        }

        if (items.length === 0) {
            return res.status(400).json({ message: 'No items to export' });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="watershed-export-${Date.now()}.zip"`);

        const archive = archiver('zip', { zlib: { level: 5 } });
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);

        // Add metadata JSON
        const metadata = items.map((item) => ({
            _id: item._id,
            title: item.title,
            description: item.description,
            mediaType: item.mediaType,
            projects: (item.projectIds || []).map((p) => ({
                _id: p._id,
                title: p.title,
            })),
            tags: (item.tagIds || []).map((t) => ({
                _id: t._id,
                name: t.name,
            })),
            metadata: item.metadata,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

        // Optionally include binary files from GridFS
        if (includeFiles !== false) {
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'fs',
            });

            for (const item of items) {
                if (item.fileId) {
                    try {
                        const files = await bucket.find({ _id: item.fileId }).toArray();
                        if (files.length > 0) {
                            const fileName = item.metadata?.originalName || files[0].filename || `file-${item._id}`;
                            const sanitizedTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, '_');
                            const downloadStream = bucket.openDownloadStream(item.fileId);
                            archive.append(downloadStream, { name: `files/${sanitizedTitle}__${fileName}` });
                        }
                    } catch (e) {
                        console.error(`Failed to include file for item ${item._id}:`, e.message);
                    }
                }
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
};

export {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getStorageStats,
    bulkExport,
};
