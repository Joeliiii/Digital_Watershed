import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    actorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actionType: {
        type: String, // e.g., 'create', 'update', 'delete', 'login'
        required: true
    },
    targetType: {
        type: String, // e.g., 'Item', 'Project'
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true 
});

export default mongoose.model('AuditLog', AuditLogSchema);
