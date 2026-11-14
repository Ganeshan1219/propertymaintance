const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/amenities
router.get('/', authenticate, (req, res) => {
  try {
    const amenities = db.prepare('SELECT * FROM amenities ORDER BY name').all();
    res.json({ amenities });
  } catch (err) {
    console.error('Get amenities error:', err);
    res.status(500).json({ error: 'Failed to get amenities' });
  }
});

// GET /api/amenities/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const amenity = db.prepare('SELECT * FROM amenities WHERE id = ?').get(req.params.id);
    if (!amenity) {
      return res.status(404).json({ error: 'Amenity not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const bookings = db.prepare(`
      SELECT b.*, u.name as user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.amenity_id = ? AND b.booking_date = ? AND b.status != 'cancelled'
      ORDER BY b.check_in_time
    `).all(req.params.id, today);

    res.json({ amenity, bookings });
  } catch (err) {
    console.error('Get amenity error:', err);
    res.status(500).json({ error: 'Failed to get amenity' });
  }
});

module.exports = router;
