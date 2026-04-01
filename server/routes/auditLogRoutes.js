import express from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditLogController.js';

const router = express.Router();

router.route('/')
    .get(getAuditLogs)
    .post(createAuditLog);

export default router;
