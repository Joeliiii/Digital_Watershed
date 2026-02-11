import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the User model
jest.mock('../../models/User.js', () => {
    const mockUser = {
        findOne: jest.fn(),
    };
    return { __esModule: true, default: mockUser };
});

import User from '../../models/User.js';

describe('Auth Controller', () => {
    let loginUser;

    beforeAll(async () => {
        const mod = await import('../../controllers/authController.js');
        loginUser = mod.loginUser;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('loginUser', () => {
        it('should return user data and token on successful login', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUserDoc = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                role: 'user',
                passwordHash: hashedPassword,
            };

            User.findOne.mockResolvedValue(mockUserDoc);
            req.body = { email: 'test@test.com', password: 'password123' };

            await loginUser(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response._id).toBe('user123');
            expect(response.name).toBe('Test User');
            expect(response.email).toBe('test@test.com');
            expect(response.token).toBeDefined();
        });

        it('should return 401 when user is not found', async () => {
            User.findOne.mockResolvedValue(null);
            req.body = { email: 'nonexistent@test.com', password: 'password123' };

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });

        it('should return 401 when password is wrong', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            User.findOne.mockResolvedValue({
                _id: 'user123',
                email: 'test@test.com',
                passwordHash: hashedPassword,
            });
            req.body = { email: 'test@test.com', password: 'wrongpassword' };

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 500 on server error', async () => {
            User.findOne.mockRejectedValue(new Error('DB connection failed'));
            req.body = { email: 'test@test.com', password: 'password123' };

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB connection failed' });
        });

        it('should generate a valid JWT token', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            User.findOne.mockResolvedValue({
                _id: 'user123',
                name: 'Test',
                email: 'test@test.com',
                role: 'user',
                passwordHash: hashedPassword,
            });
            req.body = { email: 'test@test.com', password: 'password123' };

            await loginUser(req, res);

            const token = res.json.mock.calls[0][0].token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            expect(decoded.id).toBe('user123');
        });
    });
});
