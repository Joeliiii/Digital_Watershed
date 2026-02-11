import mongoose from 'mongoose';

// Use in-memory approach: just validate schema without connecting
// We import the model and use its schema validation

describe('User Model', () => {
    let User;

    beforeAll(async () => {
        User = (await import('../../models/User.js')).default;
    });

    describe('Schema Validation', () => {
        it('should require name field', async () => {
            const user = new User({ email: 'test@test.com', passwordHash: 'hash123' });
            const err = user.validateSync();
            expect(err.errors.name).toBeDefined();
        });

        it('should require email field', async () => {
            const user = new User({ name: 'Test', passwordHash: 'hash123' });
            const err = user.validateSync();
            expect(err.errors.email).toBeDefined();
        });

        it('should require passwordHash field', async () => {
            const user = new User({ name: 'Test', email: 'test@test.com' });
            const err = user.validateSync();
            expect(err.errors.passwordHash).toBeDefined();
        });

        it('should default role to "user"', () => {
            const user = new User({ name: 'Test', email: 'test@test.com', passwordHash: 'hash123' });
            expect(user.role).toBe('user');
        });

        it('should accept "admin" as a valid role', () => {
            const user = new User({ name: 'Test', email: 'test@test.com', passwordHash: 'hash123', role: 'admin' });
            const err = user.validateSync();
            expect(err).toBeUndefined();
            expect(user.role).toBe('admin');
        });

        it('should reject invalid role values', () => {
            const user = new User({ name: 'Test', email: 'test@test.com', passwordHash: 'hash123', role: 'superadmin' });
            const err = user.validateSync();
            expect(err.errors.role).toBeDefined();
        });

        it('should pass validation with all required fields', () => {
            const user = new User({ name: 'Test User', email: 'test@test.com', passwordHash: 'hash123' });
            const err = user.validateSync();
            expect(err).toBeUndefined();
        });

        it('should have timestamps enabled', () => {
            const schema = User.schema;
            expect(schema.options.timestamps).toBe(true);
        });
    });
});
