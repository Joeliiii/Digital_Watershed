import mongoose from 'mongoose';

const ExportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    }],
    exportFormat: {
        type: String, // e.g., 'pdf', 'zip'
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('Export', ExportSchema);
