const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/maintenance
router.get('/', authenticate, (req, res) => {
  try {
    let rows;
    if (req.user.role === 'tenant') {
      rows = db.prepare(`
        SELECT m.*, u.name as tenant_name
        FROM maintenance_requests m
        JOIN users u ON m.tenant_id = u.id
        WHERE m.tenant_id = ?
        ORDER BY m.created_at DESC
      `).all(req.user.id);
    } else if (req.user.role === 'owner') {
      rows = db.prepare(`
        SELECT m.*, u.name as tenant_name
        FROM maintenance_requests m
        JOIN users u ON m.tenant_id = u.id
        JOIN properties p ON m.property_id = p.id
        WHERE p.owner_id = ?
        ORDER BY m.created_at DESC
      `).all(req.user.id);
    } else {
      // Staff sees all
      rows = db.prepare(`
        SELECT m.*, u.name as tenant_name
        FROM maintenance_requests m
        JOIN users u ON m.tenant_id = u.id
        ORDER BY m.created_at DESC
      `).all();
    }
    res.json({ requests: rows });
  } catch (err) {
    console.error('Get maintenance error:', err);
    res.status(500).json({ error: 'Failed to get maintenance requests' });
  }
});

// GET /api/maintenance/stats
router.get('/stats', authenticate, (req, res) => {
  try {
    let query = `
      SELECT m.*, u.name as tenant_name
      FROM maintenance_requests m
      JOIN users u ON m.tenant_id = u.id
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      query += ' WHERE m.tenant_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'owner') {
      query += `
        JOIN properties p ON m.property_id = p.id
        WHERE p.owner_id = ?
      `;
      params.push(req.user.id);
    }

    query += ' ORDER BY m.created_at DESC';

    const requests = db.prepare(query).all(...params);

    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const inProgress = requests.filter((r) => r.status === 'in_progress').length;
    const completed = requests.filter((r) => r.status === 'completed').length;

    // Feature #2: Expense tracking total & breakdown
    let totalExpenses = 0;
    const categoryExpenses = {};
    requests.forEach(r => {
      const c = Number(r.cost || 0);
      totalExpenses += c;
      categoryExpenses[r.category] = (categoryExpenses[r.category] || 0) + c;
    });

    // SLA tracking: check requests within 48 hours
    const now = Date.now();
    let slaBreached = 0;
    let slaWarning = 0;
    requests.forEach(r => {
      if (r.status !== 'completed') {
        const createdTime = new Date(r.created_at).getTime();
        const elapsedHours = (now - createdTime) / (1000 * 60 * 60);
        if (elapsedHours >= 48) slaBreached++;
        else if (elapsedHours >= 24) slaWarning++;
      }
    });

    const avgResolution = db.prepare(`
      SELECT AVG(
        (julianday(resolved_at) - julianday(created_at)) * 24
      ) as avg_hours
      FROM maintenance_requests
      WHERE resolved_at IS NOT NULL
    `).get();

    // Average user rating
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(rating) as total_ratings
      FROM maintenance_requests
      WHERE rating IS NOT NULL
    `).get();

    const recent = requests.slice(0, 5);

    res.json({
      total,
      pending,
      in_progress: inProgress,
      completed,
      slaBreached,
      slaWarning,
      totalExpenses,
      categoryExpenses,
      avgRating: ratingStats?.avg_rating ? Number(ratingStats.avg_rating.toFixed(1)) : 5.0,
      totalRatings: ratingStats?.total_ratings || 0,
      statusCounts: [
        { status: 'pending', count: pending },
        { status: 'in_progress', count: inProgress },
        { status: 'completed', count: completed }
      ],
      avgResolutionHours: avgResolution?.avg_hours ? Number(avgResolution.avg_hours.toFixed(1)) : 0,
      recentRequests: recent
    });
  } catch (err) {
    console.error('Get maintenance stats error:', err);
    res.status(500).json({ error: 'Failed to get maintenance stats' });
  }
});

// POST /api/maintenance
router.post('/', authenticate, (req, res) => {
  try {
    const { property_id, title, description, category, priority, image_url } = req.body;
    const requestPropertyId = property_id ?? req.user?.property_id ?? 1;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = db.prepare(`
      INSERT INTO maintenance_requests (property_id, tenant_id, title, description, category, priority, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      requestPropertyId,
      req.user.id,
      title.trim(),
      description || '',
      category || 'general',
      priority || 'medium',
      image_url || null
    );

    const request = db.prepare(`
      SELECT m.*, u.name as tenant_name
      FROM maintenance_requests m
      JOIN users u ON m.tenant_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:created', request);
    }

    res.status(201).json({ request });
  } catch (err) {
    console.error('Create maintenance error:', err);
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

// PATCH /api/maintenance/:id/status
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Only owners and staff can update status' });
    }

    const { status, cost, cost_details } = req.body;
    if (!status || !['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be in_progress or completed' });
    }

    const existing = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const costVal = cost !== undefined ? Number(cost) : existing.cost;
    const costDetailsVal = cost_details !== undefined ? cost_details : existing.cost_details;

    if (status === 'completed') {
      db.prepare(`
        UPDATE maintenance_requests
        SET status = ?, cost = ?, cost_details = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, costVal, costDetailsVal, req.params.id);
    } else {
      db.prepare(`
        UPDATE maintenance_requests
        SET status = ?, cost = ?, cost_details = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, costVal, costDetailsVal, req.params.id);
    }

    const updated = db.prepare(`
      SELECT m.*, u.name as tenant_name
      FROM maintenance_requests m
      JOIN users u ON m.tenant_id = u.id
      WHERE m.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:updated', updated);
    }

    res.json({ request: updated });
  } catch (err) {
    console.error('Update maintenance status error:', err);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
});

// POST /api/maintenance/:id/rate (Tenant rating & feedback)
router.post('/:id/rate', authenticate, (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const request = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed requests' });
    }

    db.prepare(`
      UPDATE maintenance_requests
      SET rating = ?, feedback = ?, rated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rating, feedback || '', req.params.id);

    const updated = db.prepare(`
      SELECT m.*, u.name as tenant_name
      FROM maintenance_requests m
      JOIN users u ON m.tenant_id = u.id
      WHERE m.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:updated', updated);
    }

    res.json({ message: 'Rating submitted successfully', request: updated });
  } catch (err) {
    console.error('Rate maintenance error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/maintenance/:id/messages (Direct Chat)
router.get('/:id/messages', authenticate, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT * FROM maintenance_messages
      WHERE request_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /api/maintenance/:id/messages (Direct Chat Send)
router.post('/:id/messages', authenticate, (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const result = db.prepare(`
      INSERT INTO maintenance_messages (request_id, sender_id, sender_name, sender_role, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, req.user.id, req.user.name, req.user.role, message.trim());

    const newMessage = db.prepare('SELECT * FROM maintenance_messages WHERE id = ?').get(result.lastInsertRowid);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:message', newMessage);
    }

    res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
