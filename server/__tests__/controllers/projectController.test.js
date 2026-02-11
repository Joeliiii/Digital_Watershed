jest.mock('../../models/Project.js', () => {
    const mockModel = {
        find: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import Project from '../../models/Project.js';

describe('Project Controller', () => {
    let getProjects;

    beforeAll(async () => {
        const mod = await import('../../controllers/projectController.js');
        getProjects = mod.getProjects;
    });

    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('getProjects', () => {
        it('should return all projects sorted by title', async () => {
            const mockProjects = [{ title: 'A Project' }, { title: 'B Project' }];
            Project.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockProjects) });

            await getProjects(req, res);

            expect(Project.find).toHaveBeenCalledWith({}, 'title _id color');
            expect(res.json).toHaveBeenCalledWith(mockProjects);
        });

        it('should return 500 on error', async () => {
            Project.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

            await getProjects(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
});
