import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.config.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Item from './models/Item.js';
import Tag from './models/Tag.js';

dotenv.config();

const testModels = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Create a generic test user if not exists (using email as key)
        const testEmail = 'test@example.com';
        let user = await User.findOne({ email: testEmail });
        if (!user) {
            user = await User.create({
                name: 'Test User',
                email: testEmail,
                passwordHash: 'hashed_password_123'
            });
            console.log('Created User:', user._id);
        } else {
            console.log('Found User:', user._id);
        }

        // Create a Project
        const project = await Project.create({
            ownerId: user._id,
            title: 'Test Project',
            description: 'A project for testing models',
            visibility: 'private'
        });
        console.log('Created Project:', project._id);

        // Create a Tag
        const tag = await Tag.create({
            ownerId: user._id,
            name: `Test Tag ${Date.now()}`, // Ensure uniqueness
            color: '#ff0000'
        });
        console.log('Created Tag:', tag._id);

        // Create an Item linked to Project and Tag
        const item = await Item.create({
            ownerId: user._id,
            title: 'Test Item',
            mediaType: 'text/plain',
            projectIds: [project._id],
            tagIds: [tag._id],
            metadata: { key: 'value', nested: { property: 123 } }
        });
        console.log('Created Item:', item._id);
        console.log('Item Metadata:', item.metadata);

        console.log('All models verified successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error verifying models:', error);
        process.exit(1);
    }
};

testModels();
