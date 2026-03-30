import { EventEmitter } from 'events';

// Mock all models
jest.mock('../../models/Item.js', () => {
    const mockModel = jest.fn();
    mockModel.find = jest.fn();
    mockModel.findById = jest.fn();
    mockModel.create = jest.fn();
    mockModel.findByIdAndUpdate = jest.fn();
    return { __esModule: true, default: mockModel };
});
jest.mock('../../models/Tag.js', () => ({ __esModule: true, default: {} }));
jest.mock('../../models/Project.js', () => ({ __esModule: true, default: {} }));

// Shared mock functions for GridFS bucket methods
const mockOpenUploadStream = jest.fn();
const mockOpenDownloadStream = jest.fn();
const mockBucketFind = jest.fn();
const mockBucketDelete = jest.fn();

// Mock fs module for file upload tests
const mockUnlink = jest.fn((path, cb) => { if (cb) cb(null); });
const mockCreateReadStream = jest.fn();
jest.mock('fs', () => ({
    __esModule: true,
    default: {
        createReadStream: (...args) => mockCreateReadStream(...args),
        unlink: (...args) => mockUnlink(...args),
    },
    createReadStream: (...args) => mockCreateReadStream(...args),
    unlink: (...args) => mockUnlink(...args),
}));

// Mock mongoose for GridFS tests — use a regular function, NOT arrow, for GridFSBucket
// because the controller calls `new mongoose.mongo.GridFSBucket(...)`.
jest.mock('mongoose', () => {
    // Must define the constructor function inside the factory
    function MockBucket() {
        this.openUploadStream = mockOpenUploadStream;
        this.openDownloadStream = mockOpenDownloadStream;
        this.find = mockBucketFind;
        this.delete = mockBucketDelete;
    }
    return {
        __esModule: true,
        default: {
            connection: { readyState: 1, db: {} },
            mongo: { GridFSBucket: MockBucket },
        },
    };
});

import Item from '../../models/Item.js';

describe('Item Controller', () => {
    let getItems, getItemById, createItem, bulkCreateItems, getItemFile, updateItem, deleteItem;

    beforeAll(async () => {
        const mod = await import('../../controllers/itemController.js');
        getItems = mod.getItems;
        getItemById = mod.getItemById;
        createItem = mod.createItem;
        bulkCreateItems = mod.bulkCreateItems;
        getItemFile = mod.getItemFile;
        updateItem = mod.updateItem;
        deleteItem = mod.deleteItem;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, file: null, files: null, headers: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            set: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // ─── getItems ─────────────────────────────────────────────────
    describe('getItems', () => {
        it('should return all items sorted by createdAt desc', async () => {
            const mockItems = [{ title: 'Item 1' }, { title: 'Item 2' }];
            Item.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockItems) });

            await getItems(req, res);

            expect(Item.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockItems);
        });

        it('should return 500 on error', async () => {
            Item.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

            await getItems(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── getItemById ──────────────────────────────────────────────
    describe('getItemById', () => {
        it('should return item when found', async () => {
            const mockItem = { _id: 'item123', title: 'Test' };
            Item.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockItem),
                }),
            });
            req.params.id = 'item123';

            await getItemById(req, res);

            expect(res.json).toHaveBeenCalledWith(mockItem);
        });

        it('should return 404 when item not found', async () => {
            Item.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });
            req.params.id = 'nonexistent';

            await getItemById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 500 on error', async () => {
            Item.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockRejectedValue(new Error('DB error')),
                }),
            });
            req.params.id = 'item123';

            await getItemById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ─── createItem ───────────────────────────────────────────────
    describe('createItem', () => {
        it('should create an item without file upload', async () => {
            const newItem = { _id: 'new123', title: 'New Item' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'New Item', mediaType: 'text/plain' };

            await createItem(req, res);

            expect(Item.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.status().json).toHaveBeenCalledWith(newItem);
        });

        it('should return 400 on validation error', async () => {
            Item.create.mockRejectedValue(new Error('Validation failed'));
            req.body = { title: '' };

            jest.spyOn(console, 'error').mockImplementation();
            await createItem(req, res);
            console.error.mockRestore();

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should set default ownerId if not provided', async () => {
            const newItem = { _id: 'new123', title: 'Test' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'Test', mediaType: 'text/plain' };

            await createItem(req, res);

            const createdData = Item.create.mock.calls[0][0];
            expect(createdData.ownerId).toBe('6987c45da0cb4423e71e1ffd');
        });

        it('should keep provided ownerId', async () => {
            const newItem = { _id: 'new123', title: 'Test' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'Test', mediaType: 'text/plain', ownerId: 'custom123' };

            await createItem(req, res);

            const createdData = Item.create.mock.calls[0][0];
            expect(createdData.ownerId).toBe('custom123');
        });

        it('should handle file upload with GridFS', async () => {
            const newItem = { _id: 'new123', title: 'Upload' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'Upload', mediaType: 'image/png' };
            req.file = {
                path: '/tmp/upload.png',
                originalname: 'photo.png',
                mimetype: 'image/png',
                size: 12345
            };

            // Mock the upload stream
            const uploadStream = new EventEmitter();
            uploadStream.id = 'gridfs-file-id';
            mockOpenUploadStream.mockReturnValue(uploadStream);

            // Mock createReadStream to pipe and emit finish
            const readStream = new EventEmitter();
            readStream.pipe = jest.fn(() => {
                // Emit finish asynchronously
                process.nextTick(() => uploadStream.emit('finish'));
                return uploadStream;
            });
            mockCreateReadStream.mockReturnValue(readStream);

            await createItem(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const createArgs = Item.create.mock.calls[0][0];
            expect(createArgs.fileId).toBe('gridfs-file-id');
            expect(createArgs.storageType).toBe('gridfs');
        });

        it('should handle metadata as JSON string during file upload', async () => {
            const newItem = { _id: 'new123' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'Test', metadata: '{"custom":"value"}' };
            req.file = {
                path: '/tmp/upload.png',
                originalname: 'photo.png',
                mimetype: 'image/png',
                size: 100
            };

            const uploadStream = new EventEmitter();
            uploadStream.id = 'gfs-id';
            mockOpenUploadStream.mockReturnValue(uploadStream);
            const readStream = new EventEmitter();
            readStream.pipe = jest.fn(() => {
                process.nextTick(() => uploadStream.emit('finish'));
                return uploadStream;
            });
            mockCreateReadStream.mockReturnValue(readStream);

            await createItem(req, res);

            const createArgs = Item.create.mock.calls[0][0];
            expect(createArgs.metadata.custom).toBe('value');
            expect(createArgs.metadata.originalName).toBe('photo.png');
        });

        it('should handle non-parseable metadata string during file upload', async () => {
            const newItem = { _id: 'new123' };
            Item.create.mockResolvedValue(newItem);
            req.body = { title: 'Test', metadata: 'not-json' };
            req.file = {
                path: '/tmp/upload.png',
                originalname: 'photo.png',
                mimetype: 'image/png',
                size: 100
            };

            const uploadStream = new EventEmitter();
            uploadStream.id = 'gfs-id';
            mockOpenUploadStream.mockReturnValue(uploadStream);
            const readStream = new EventEmitter();
            readStream.pipe = jest.fn(() => {
                process.nextTick(() => uploadStream.emit('finish'));
                return uploadStream;
            });
            mockCreateReadStream.mockReturnValue(readStream);

            jest.spyOn(console, 'warn').mockImplementation();
            await createItem(req, res);
            console.warn.mockRestore();

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should cleanup temp file on error when file was provided', async () => {
            Item.create.mockRejectedValue(new Error('DB Error'));
            req.file = { path: '/tmp/test.png' };
            req.body = { title: 'Test' };

            jest.spyOn(console, 'error').mockImplementation();
            await createItem(req, res);
            console.error.mockRestore();

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockUnlink).toHaveBeenCalled();
        });
    });

    // ─── bulkCreateItems ──────────────────────────────────────────
    describe('bulkCreateItems', () => {
        it('should return 400 when no files uploaded', async () => {
            req.files = null;

            await bulkCreateItems(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'No files uploaded' });
        });

        it('should return 400 when files array is empty', async () => {
            req.files = [];

            await bulkCreateItems(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'No files uploaded' });
        });

        it('should create items from multiple files', async () => {
            const file1 = { path: '/tmp/a.png', originalname: 'a.png', mimetype: 'image/png', size: 100 };
            const file2 = { path: '/tmp/b.jpg', originalname: 'b.jpg', mimetype: 'image/jpeg', size: 200 };
            req.files = [file1, file2];
            req.body = { projectIds: 'proj1', tagIds: ['tag1', 'tag2'] };

            Item.create.mockResolvedValueOnce({ _id: 'item1' }).mockResolvedValueOnce({ _id: 'item2' });

            const uploadStream = new EventEmitter();
            uploadStream.id = 'gfs-id';
            mockOpenUploadStream.mockReturnValue(uploadStream);
            const readStream = new EventEmitter();
            readStream.pipe = jest.fn(() => {
                process.nextTick(() => uploadStream.emit('finish'));
                return uploadStream;
            });
            mockCreateReadStream.mockReturnValue(readStream);

            await bulkCreateItems(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const responseData = res.status().json.mock.calls[0][0];
            expect(responseData.created.length).toBe(2);
            expect(responseData.errors.length).toBe(0);
        });

        it('should handle individual file errors during bulk upload', async () => {
            const file1 = { path: '/tmp/a.png', originalname: 'a.png', mimetype: 'image/png', size: 100 };
            req.files = [file1];
            req.body = {};

            Item.create.mockRejectedValue(new Error('Create failed'));

            const uploadStream = new EventEmitter();
            uploadStream.id = 'gfs-id';
            mockOpenUploadStream.mockReturnValue(uploadStream);
            const readStream = new EventEmitter();
            readStream.pipe = jest.fn(() => {
                process.nextTick(() => uploadStream.emit('finish'));
                return uploadStream;
            });
            mockCreateReadStream.mockReturnValue(readStream);

            await bulkCreateItems(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const responseData = res.status().json.mock.calls[0][0];
            expect(responseData.created.length).toBe(0);
            expect(responseData.errors.length).toBe(1);
        });
    });

    // ─── getItemFile ──────────────────────────────────────────────
    describe('getItemFile', () => {
        it('should return 404 when item not found', async () => {
            Item.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await getItemFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'File not found' });
        });

        it('should return 404 when item has no fileId', async () => {
            Item.findById.mockResolvedValue({ _id: 'item123', fileId: null });
            req.params.id = 'item123';

            await getItemFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 404 when file not found in GridFS', async () => {
            Item.findById.mockResolvedValue({
                _id: 'item123',
                fileId: 'gfs-id',
                metadata: { mimetype: 'image/png' }
            });
            req.params.id = 'item123';
            mockBucketFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

            await getItemFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'File not found in storage' });
        });

        it('should stream full file response without range header', async () => {
            const mockItem = {
                _id: 'item123',
                fileId: 'gfs-id',
                metadata: { mimetype: 'image/png', originalName: 'photo.png' }
            };
            Item.findById.mockResolvedValue(mockItem);
            req.params.id = 'item123';

            const fileDoc = { _id: 'gfs-id', length: 5000, filename: 'photo.png' };
            mockBucketFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([fileDoc]) });

            const downloadStream = new EventEmitter();
            downloadStream.pipe = jest.fn();
            mockOpenDownloadStream.mockReturnValue(downloadStream);

            await getItemFile(req, res);

            expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
                'Content-Type': 'image/png',
                'Content-Length': 5000,
            }));
            expect(downloadStream.pipe).toHaveBeenCalledWith(res);
        });

        it('should handle range requests for video/audio', async () => {
            const mockItem = {
                _id: 'item123',
                fileId: 'gfs-id',
                metadata: { mimetype: 'video/mp4', originalName: 'clip.mp4' }
            };
            Item.findById.mockResolvedValue(mockItem);
            req.params.id = 'item123';
            req.headers.range = 'bytes=0-999';

            const fileDoc = { _id: 'gfs-id', length: 10000, filename: 'clip.mp4' };
            mockBucketFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([fileDoc]) });

            const downloadStream = new EventEmitter();
            downloadStream.pipe = jest.fn();
            mockOpenDownloadStream.mockReturnValue(downloadStream);

            await getItemFile(req, res);

            expect(res.status).toHaveBeenCalledWith(206);
            expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
                'Content-Range': 'bytes 0-999/10000',
                'Content-Length': 1000,
            }));
            expect(downloadStream.pipe).toHaveBeenCalledWith(res);
        });

        it('should use attachment disposition for non-inline types', async () => {
            const mockItem = {
                _id: 'item123',
                fileId: 'gfs-id',
                metadata: { mimetype: 'application/zip', originalName: 'archive.zip' }
            };
            Item.findById.mockResolvedValue(mockItem);
            req.params.id = 'item123';

            const fileDoc = { _id: 'gfs-id', length: 1000, filename: 'archive.zip' };
            mockBucketFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue([fileDoc]) });

            const downloadStream = new EventEmitter();
            downloadStream.pipe = jest.fn();
            mockOpenDownloadStream.mockReturnValue(downloadStream);

            await getItemFile(req, res);

            expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
                'Content-Disposition': 'attachment; filename="archive.zip"',
            }));
        });

        it('should return 500 on error', async () => {
            Item.findById.mockRejectedValue(new Error('DB error'));
            req.params.id = 'item123';

            await getItemFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── updateItem ───────────────────────────────────────────────
    describe('updateItem', () => {
        it('should update and return item when found', async () => {
            const existingItem = { _id: 'item123', title: 'Old' };
            const updatedItem = { _id: 'item123', title: 'New' };
            Item.findById.mockResolvedValue(existingItem);
            Item.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(updatedItem),
                }),
            });
            req.params.id = 'item123';
            req.body = { title: 'New' };

            await updateItem(req, res);

            expect(Item.findByIdAndUpdate).toHaveBeenCalledWith('item123', { title: 'New' }, { new: true, runValidators: true });
            expect(res.json).toHaveBeenCalledWith(updatedItem);
        });

        it('should return 404 when item not found', async () => {
            Item.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await updateItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 400 on validation error', async () => {
            Item.findById.mockResolvedValue({ _id: 'item123' });
            Item.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockRejectedValue(new Error('Validation error')),
                }),
            });
            req.params.id = 'item123';
            req.body = { title: '' };

            await updateItem(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation error' });
        });
    });

    // ─── deleteItem ───────────────────────────────────────────────
    describe('deleteItem', () => {
        it('should delete item without file and return success', async () => {
            const mockItem = {
                _id: 'item123',
                title: 'Test',
                fileId: null,
                deleteOne: jest.fn().mockResolvedValue({}),
            };
            Item.findById.mockResolvedValue(mockItem);
            req.params.id = 'item123';

            await deleteItem(req, res);

            expect(mockItem.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Item removed' });
        });

        it('should delete item with GridFS file', async () => {
            const mockItem = {
                _id: 'item123',
                title: 'Test',
                fileId: 'gfs-file-id',
                deleteOne: jest.fn().mockResolvedValue({}),
            };
            Item.findById.mockResolvedValue(mockItem);
            mockBucketDelete.mockResolvedValue(true);
            req.params.id = 'item123';

            await deleteItem(req, res);

            expect(mockBucketDelete).toHaveBeenCalledWith('gfs-file-id');
            expect(mockItem.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Item removed' });
        });

        it('should still delete item when GridFS file deletion fails', async () => {
            const mockItem = {
                _id: 'item123',
                title: 'Test',
                fileId: 'gfs-file-id',
                deleteOne: jest.fn().mockResolvedValue({}),
            };
            Item.findById.mockResolvedValue(mockItem);
            mockBucketDelete.mockRejectedValue(new Error('GridFS delete failed'));
            req.params.id = 'item123';

            jest.spyOn(console, 'error').mockImplementation();
            await deleteItem(req, res);
            console.error.mockRestore();

            expect(mockItem.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Item removed' });
        });

        it('should return 404 when item not found', async () => {
            Item.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await deleteItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 500 on error', async () => {
            Item.findById.mockRejectedValue(new Error('DB error'));
            req.params.id = 'item123';

            await deleteItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
});
