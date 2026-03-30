jest.mock('../../models/Project.js', () => {
    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

jest.mock('../../models/Item.js', () => {
    const mockModel = {
        find: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import Project from '../../models/Project.js';
import Item from '../../models/Item.js';

describe('Project Controller', () => {
    let getProjects, createProject, updateProject, deleteProject,
        generateShareLink, revokeShareLink, getSharedProject;

    beforeAll(async () => {
        const mod = await import('../../controllers/projectController.js');
        getProjects = mod.getProjects;
        createProject = mod.createProject;
        updateProject = mod.updateProject;
        deleteProject = mod.deleteProject;
        generateShareLink = mod.generateShareLink;
        revokeShareLink = mod.revokeShareLink;
        getSharedProject = mod.getSharedProject;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    // ─── getProjects ──────────────────────────────────────────────
    describe('getProjects', () => {
        it('should return all projects sorted by createdAt desc', async () => {
            const mockProjects = [{ title: 'A Project' }, { title: 'B Project' }];
            Project.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockProjects) });

            await getProjects(req, res);

            expect(Project.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith(mockProjects);
        });

        it('should return 500 on error', async () => {
            Project.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

            await getProjects(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── createProject ────────────────────────────────────────────
    describe('createProject', () => {
        it('should create a project and return 201', async () => {
            const newProject = { _id: 'proj1', title: 'New Project' };
            Project.create.mockResolvedValue(newProject);
            req.body = { title: 'New Project', description: 'Desc', color: '#FF0000', visibility: 'public' };

            await createProject(req, res);

            expect(Project.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.status().json).toHaveBeenCalledWith(newProject);
        });

        it('should use default color and visibility when not provided', async () => {
            const newProject = { _id: 'proj1', title: 'Test' };
            Project.create.mockResolvedValue(newProject);
            req.body = { title: 'Test' };

            await createProject(req, res);

            const createArgs = Project.create.mock.calls[0][0];
            expect(createArgs.color).toBe('#3B82F6');
            expect(createArgs.visibility).toBe('private');
        });

        it('should use default ownerId when not provided', async () => {
            Project.create.mockResolvedValue({ _id: 'proj1' });
            req.body = { title: 'Test' };

            await createProject(req, res);

            const createArgs = Project.create.mock.calls[0][0];
            expect(createArgs.ownerId).toBe('6987c45da0cb4423e71e1ffd');
        });

        it('should use provided ownerId', async () => {
            Project.create.mockResolvedValue({ _id: 'proj1' });
            req.body = { title: 'Test', ownerId: 'custom123' };

            await createProject(req, res);

            const createArgs = Project.create.mock.calls[0][0];
            expect(createArgs.ownerId).toBe('custom123');
        });

        it('should use empty string description when not provided', async () => {
            Project.create.mockResolvedValue({ _id: 'proj1' });
            req.body = { title: 'Test' };

            await createProject(req, res);

            const createArgs = Project.create.mock.calls[0][0];
            expect(createArgs.description).toBe('');
        });

        it('should return 400 on validation error', async () => {
            Project.create.mockRejectedValue(new Error('Validation failed'));
            req.body = {};

            await createProject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation failed' });
        });
    });

    // ─── updateProject ────────────────────────────────────────────
    describe('updateProject', () => {
        it('should update and return the project', async () => {
            const updatedProject = { _id: 'proj1', title: 'Updated' };
            Project.findByIdAndUpdate.mockResolvedValue(updatedProject);
            req.params.id = 'proj1';
            req.body = { title: 'Updated' };

            await updateProject(req, res);

            expect(Project.findByIdAndUpdate).toHaveBeenCalledWith('proj1', { title: 'Updated' }, {
                new: true,
                runValidators: true,
            });
            expect(res.json).toHaveBeenCalledWith(updatedProject);
        });

        it('should return 404 when project not found', async () => {
            Project.findByIdAndUpdate.mockResolvedValue(null);
            req.params.id = 'nonexistent';
            req.body = { title: 'A' };

            await updateProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('should return 400 on validation error', async () => {
            Project.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));
            req.params.id = 'proj1';
            req.body = { title: '' };

            await updateProject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation error' });
        });
    });

    // ─── deleteProject ────────────────────────────────────────────
    describe('deleteProject', () => {
        it('should delete and return success message', async () => {
            Project.findByIdAndDelete.mockResolvedValue({ _id: 'proj1' });
            req.params.id = 'proj1';

            await deleteProject(req, res);

            expect(Project.findByIdAndDelete).toHaveBeenCalledWith('proj1');
            expect(res.json).toHaveBeenCalledWith({ message: 'Project deleted' });
        });

        it('should return 404 when project not found', async () => {
            Project.findByIdAndDelete.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await deleteProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('should return 500 on error', async () => {
            Project.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
            req.params.id = 'proj1';

            await deleteProject(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── generateShareLink ───────────────────────────────────────
    describe('generateShareLink', () => {
        it('should generate a share token and return it', async () => {
            const mockProject = {
                _id: 'proj1',
                sharedLinkToken: null,
                save: jest.fn().mockResolvedValue(true),
            };
            Project.findById.mockResolvedValue(mockProject);
            req.params.id = 'proj1';

            await generateShareLink(req, res);

            expect(mockProject.save).toHaveBeenCalled();
            expect(mockProject.sharedLinkToken).toBeTruthy();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: expect.any(String),
                sharedLinkToken: expect.any(String),
            }));
        });

        it('should return 404 when project not found', async () => {
            Project.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await generateShareLink(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('should return 500 on error', async () => {
            Project.findById.mockRejectedValue(new Error('DB error'));
            req.params.id = 'proj1';

            await generateShareLink(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── revokeShareLink ─────────────────────────────────────────
    describe('revokeShareLink', () => {
        it('should revoke the share token', async () => {
            const mockProject = {
                _id: 'proj1',
                sharedLinkToken: 'old-token',
                save: jest.fn().mockResolvedValue(true),
            };
            Project.findById.mockResolvedValue(mockProject);
            req.params.id = 'proj1';

            await revokeShareLink(req, res);

            expect(mockProject.sharedLinkToken).toBeNull();
            expect(mockProject.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Share link revoked' });
        });

        it('should return 404 when project not found', async () => {
            Project.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await revokeShareLink(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('should return 500 on error', async () => {
            Project.findById.mockRejectedValue(new Error('DB error'));
            req.params.id = 'proj1';

            await revokeShareLink(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── getSharedProject ────────────────────────────────────────
    describe('getSharedProject', () => {
        it('should return the shared project and its items', async () => {
            const mockProject = { _id: 'proj1', title: 'Shared', sharedLinkToken: 'tok' };
            const mockItems = [{ _id: 'item1', title: 'Item' }];
            Project.findOne.mockResolvedValue(mockProject);
            const populateMock = jest.fn().mockResolvedValue(mockItems);
            const sortMock = jest.fn().mockReturnValue({ populate: populateMock });
            Item.find.mockReturnValue({ sort: sortMock });
            req.params.token = 'tok';

            await getSharedProject(req, res);

            expect(Project.findOne).toHaveBeenCalledWith({ sharedLinkToken: 'tok' });
            expect(res.json).toHaveBeenCalledWith({ project: mockProject, items: mockItems });
        });

        it('should return 404 when shared project not found', async () => {
            Project.findOne.mockResolvedValue(null);
            req.params.token = 'bad-token';

            await getSharedProject(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({
                message: 'Shared project not found or link has been revoked'
            });
        });

        it('should return 500 on error', async () => {
            Project.findOne.mockRejectedValue(new Error('DB error'));
            req.params.token = 'tok';

            await getSharedProject(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
});
