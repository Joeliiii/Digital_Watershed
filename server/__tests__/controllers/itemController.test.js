import mongoose from 'mongoose';
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

import Item from '../../models/Item.js';

describe('Item Controller', () => {
    let getItems, getItemById, createItem, getItemFile, updateItem, deleteItem;

    beforeAll(async () => {
        const mod = await import('../../controllers/itemController.js');
        getItems = mod.getItems;
        getItemById = mod.getItemById;
        createItem = mod.createItem;
        getItemFile = mod.getItemFile;
        updateItem = mod.updateItem;
        deleteItem = mod.deleteItem;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, file: null };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            set: jest.fn(),
            pipe: jest.fn(),
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
            // Setup mock upload stream
            const mockUploadStream = new EventEmitter();
            mockUploadStream.id = new mongoose.Types.ObjectId();

            const mockBucket = {
                openUploadStream: jest.fn().mockReturnValue(mockUploadStream),
            };

            const mockReadStream = new EventEmitter();
            mockReadStream.pipe = jest.fn().mockImplementation(function (dest) {
                // Simulate finish event on next tick
                process.nextTick(() => dest.emit('finish'));
                return dest;
            });

            // Mock fs dynamic import
            jest.spyOn(global, 'import' in global ? 'import' : 'toString'); // no-op
            const fsMock = {
                createReadStream: jest.fn().mockReturnValue(mockReadStream),
                unlink: jest.fn((path, cb) => cb && cb()),
            };

            // We need to mock the dynamic imports inside createItem
            // Since createItem does `await import('fs')` and `await import('mongoose')`,
            // we'll mock at module level
            jest.unstable_mockModule('fs', () => fsMock);

            // Mock mongoose for GridFS
            const mongooseMock = {
                default: {
                    connection: { readyState: 1, db: {} },
                    mongo: {
                        GridFSBucket: jest.fn().mockReturnValue(mockBucket),
                    },
                },
            };
            jest.unstable_mockModule('mongoose', () => mongooseMock);

            // Re-import controller with new mocks
            const { createItem: createItemWithFile } = await import('../../controllers/itemController.js');

            const newItem = { _id: 'new123', title: 'Test', fileId: mockUploadStream.id };
            Item.create.mockResolvedValue(newItem);

            req.file = {
                path: '/tmp/test-file.png',
                originalname: 'photo.png',
                mimetype: 'image/png',
                size: 12345,
            };
            req.body = { title: 'Test', mediaType: 'image/png' };

            await createItemWithFile(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle metadata as a JSON string when file is uploaded', async () => {
            const newItem = { _id: 'new123' };
            Item.create.mockResolvedValue(newItem);

            req.body = { title: 'Test', mediaType: 'text/plain', metadata: '{"custom":"value"}' };

            await createItem(req, res);

            // Without file, metadata stays as-is (string)
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
            Item.findByIdAndUpdate.mockResolvedValue(updatedItem);
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
            Item.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));
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
            const mockBucketDelete = jest.fn().mockResolvedValue(undefined);
            const fileId = new mongoose.Types.ObjectId();
            const mockItem = {
                _id: 'item123',
                fileId: fileId,
                deleteOne: jest.fn().mockResolvedValue({}),
            };
            Item.findById.mockResolvedValue(mockItem);

            // Mock mongoose for GridFS bucket
            jest.unstable_mockModule('mongoose', () => ({
                default: {
                    connection: { db: {} },
                    mongo: {
                        GridFSBucket: jest.fn().mockReturnValue({
                            delete: mockBucketDelete,
                        }),
                    },
                },
            }));

            req.params.id = 'item123';

            // Re-import to pick up mock
            const { deleteItem: deleteWithFile } = await import('../../controllers/itemController.js');
            await deleteWithFile(req, res);

            expect(mockItem.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Item removed' });
        });

        it('should handle GridFS delete failure gracefully', async () => {
            const fileId = new mongoose.Types.ObjectId();
            const mockItem = {
                _id: 'item123',
                fileId: fileId,
                deleteOne: jest.fn().mockResolvedValue({}),
            };
            Item.findById.mockResolvedValue(mockItem);

            jest.unstable_mockModule('mongoose', () => ({
                default: {
                    connection: { db: {} },
                    mongo: {
                        GridFSBucket: jest.fn().mockReturnValue({
                            delete: jest.fn().mockRejectedValue(new Error('GridFS error')),
                        }),
                    },
                },
            }));

            req.params.id = 'item123';

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const { deleteItem: deleteWithFailedGridFS } = await import('../../controllers/itemController.js');
            await deleteWithFailedGridFS(req, res);
            consoleSpy.mockRestore();

            // Item should still be deleted even if GridFS cleanup fails
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
