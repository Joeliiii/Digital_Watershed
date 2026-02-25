import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    color: {
        type: String,
        default: '#3B82F6'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'shared'],
        default: 'private'
    },
    sharedLinkToken: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model('Project', ProjectSchema);
