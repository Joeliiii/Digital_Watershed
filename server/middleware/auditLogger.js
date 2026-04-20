res.send = function (body) {
  try {
    let parsed;

    try {
      parsed = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      parsed = null;
    }

    AuditLog.create({
      action,
      entityType,
      entityId: parsed?._id,
      entityName: parsed?.name || parsed?.title || 'Unknown',
      user: req.user?.name || 'System',
      createdAt: new Date()
        ? { _id: req.user._id, name: req.user.name }
        : null,
    }).catch((err) => console.error('Audit log failed:', err));

  } catch (err) {
    console.error('Audit middleware error:', err.message);
  }

  return originalSend.call(this, body);
};