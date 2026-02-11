// Mock mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn(),
}));

import mongoose from 'mongoose';

describe('Database Config', () => {
    let connectDB;
    const originalEnv = process.env;

    beforeAll(async () => {
        const mod = await import('../../config/db.config.js');
        connectDB = mod.default;
    });

    beforeEach(() => {
        process.env = { ...originalEnv, MONGO_URI: 'mongodb://localhost:27017/testdb' };
        jest.clearAllMocks();
        // Prevent process.exit from actually exiting
        jest.spyOn(process, 'exit').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = originalEnv;
        process.exit.mockRestore();
    });

    it('should call mongoose.connect with MONGO_URI', async () => {
        mongoose.connect.mockResolvedValue({ connection: { host: 'localhost' } });

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    });

    it('should log success message on connection', async () => {
        mongoose.connect.mockResolvedValue({ connection: { host: 'localhost' } });
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await connectDB();

        expect(consoleSpy).toHaveBeenCalledWith('MongoDB Connected: localhost');
        consoleSpy.mockRestore();
    });

    it('should call process.exit(1) on connection error', async () => {
        mongoose.connect.mockRejectedValue(new Error('Connection refused'));
        jest.spyOn(console, 'error').mockImplementation();

        await connectDB();

        expect(process.exit).toHaveBeenCalledWith(1);
        console.error.mockRestore();
    });

    it('should log error message on connection failure', async () => {
        mongoose.connect.mockRejectedValue(new Error('Connection refused'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await connectDB();

        expect(consoleSpy).toHaveBeenCalledWith('Error: Connection refused');
        consoleSpy.mockRestore();
    });
});
