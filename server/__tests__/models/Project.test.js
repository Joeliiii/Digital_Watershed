import mongoose from 'mongoose';

describe('Project Model', () => {
    let Project;

    beforeAll(async () => {
        Project = (await import('../../models/Project.js')).default;
    });

    describe('Schema Validation', () => {
        const validProject = {
            ownerId: new mongoose.Types.ObjectId(),
            title: 'My Project',
        };

        it('should require ownerId field', () => {
            const project = new Project({ title: 'Test' });
            const err = project.validateSync();
            expect(err.errors.ownerId).toBeDefined();
        });

        it('should require title field', () => {
            const project = new Project({ ownerId: new mongoose.Types.ObjectId() });
            const err = project.validateSync();
            expect(err.errors.title).toBeDefined();
        });

        it('should default visibility to "private"', () => {
            const project = new Project(validProject);
            expect(project.visibility).toBe('private');
        });

        it('should accept "public" visibility', () => {
            const project = new Project({ ...validProject, visibility: 'public' });
            const err = project.validateSync();
            expect(err).toBeUndefined();
            expect(project.visibility).toBe('public');
        });

        it('should accept "shared" visibility', () => {
            const project = new Project({ ...validProject, visibility: 'shared' });
            const err = project.validateSync();
            expect(err).toBeUndefined();
        });

        it('should reject invalid visibility values', () => {
            const project = new Project({ ...validProject, visibility: 'internal' });
            const err = project.validateSync();
            expect(err.errors.visibility).toBeDefined();
        });

        it('should accept optional description', () => {
            const project = new Project({ ...validProject, description: 'A test project' });
            const err = project.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept optional sharedLinkToken', () => {
            const project = new Project({ ...validProject, sharedLinkToken: 'abc123' });
            expect(project.sharedLinkToken).toBe('abc123');
        });

        it('should pass validation with all required fields', () => {
            const project = new Project(validProject);
            const err = project.validateSync();
            expect(err).toBeUndefined();
        });

        it('should have timestamps enabled', () => {
            expect(Project.schema.options.timestamps).toBe(true);
        });
    });
});
