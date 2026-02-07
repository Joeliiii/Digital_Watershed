import mongoose from 'mongoose';

const TagRelationshipSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromTagId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: true
    },
    toTagId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
        required: true
    },
    relationshipType: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('TagRelationship', TagRelationshipSchema);
