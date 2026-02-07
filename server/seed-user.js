import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@watershed.com';
        const password = 'password123';
        const name = 'Admin User';

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('User already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            userExists.passwordHash = await bcrypt.hash(password, salt);
            await userExists.save();
            console.log(`User password updated. Email: ${email}, Password: ${password}`);
        } else {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await User.create({
                name,
                email,
                passwordHash,
                role: 'admin'
            });
            console.log(`User created. Email: ${email}, Password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedUser();
