import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

const TEMP_ACTOR_ID = '6987c45da0cb4423e71e1ffd';

// ─── Reusable helper ────────────────────────────────────────────────
/**
 * Log an action. Call from any controller after a successful mutation.
 *
 *   import { logAction } from '../controllers/auditLogController.js';
 *   await logAction('create', 'Item', newItem._id, { title: newItem.title });
 */
export const logAction = async (actionType, targetType, targetId, details = {}) => {
    try {
        await AuditLog.create({
            actorUserId: TEMP_ACTOR_ID,
            actionType,
            targetType,
            targetId,
            details,
        });
    } catch (err) {
        // Never let audit failures break the primary operation
        console.error('[AuditLog] Failed to write log:', err.message);
    }
};

// ─── Controllers ────────────────────────────────────────────────────

/**
 * GET /api/audit-logs
 * Paginated list with optional filters.
 *
 * Query params:
 *   page       — 1-based page number   (default 1)
 *   limit      — items per page         (default 30, max 100)
 *   targetType — e.g. 'Item', 'Project', 'Tag'
 *   actionType — e.g. 'create', 'update', 'delete'
 */
export const getAuditLogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.targetType) filter.targetType = req.query.targetType;
        if (req.query.actionType) filter.actionType = req.query.actionType;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        res.json({
            logs,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /api/audit-logs   (optional — for manually creating entries)
 */
export const createAuditLog = async (req, res) => {
    try {
        const { actionType, targetType, targetId, details } = req.body;
        if (!actionType || !targetType) {
            return res.status(400).json({ message: 'actionType and targetType are required' });
        }

        const log = await AuditLog.create({
            actorUserId: req.body.actorUserId || TEMP_ACTOR_ID,
            actionType,
            targetType,
            ...(targetId && mongoose.Types.ObjectId.isValid(targetId) && { targetId }),
            ...(details && { details }),
        });

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
