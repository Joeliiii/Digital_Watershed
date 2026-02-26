jest.mock('../../models/Project.js', () => {
    const mockModel = {
        find: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import Project from '../../models/Project.js';

describe('Project Controller', () => {
    let getProjects, createProject, updateProject, deleteProject;

    beforeAll(async () => {
        const mod = await import('../../controllers/projectController.js');
        getProjects = mod.getProjects;
        createProject = mod.createProject;
        updateProject = mod.updateProject;
        deleteProject = mod.deleteProject;
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
});
