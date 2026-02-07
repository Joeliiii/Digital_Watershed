import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#000000'
    }
}, {
    timestamps: true
});

// Unique compound index so a user can't have duplicate tag names
TagSchema.index({ ownerId: 1, name: 1 }, { unique: true });

export default mongoose.model('Tag', TagSchema);
