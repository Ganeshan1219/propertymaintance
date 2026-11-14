const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings
router.get('/', authenticate, (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'owner' || req.user.role === 'staff') {
      bookings = db.prepare(`
        SELECT b.*, a.name as amenity_name, u.name as user_name
        FROM bookings b
        JOIN amenities a ON b.amenity_id = a.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.booking_date DESC, b.check_in_time
      `).all();
    } else {
      bookings = db.prepare(`
        SELECT b.*, a.name as amenity_name, u.name as user_name
        FROM bookings b
        JOIN amenities a ON b.amenity_id = a.id
        JOIN users u ON b.user_id = u.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC, b.check_in_time
      `).all(req.user.id);
    }
    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// GET /api/bookings/stats
router.get('/stats', authenticate, (req, res) => {
  try {
    let query = `
      SELECT b.*, a.name as amenity_name, u.name as user_name
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
    `;
    const params = [];

    if (req.user.role === 'tenant') {
      query += ' WHERE b.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY b.booking_date DESC, b.check_in_time';

    const bookings = db.prepare(query).all(...params);
    const total = bookings.length;
    const active = bookings.filter((booking) => ['confirmed', 'checked_in'].includes(booking.status)).length;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = bookings.filter((booking) =>
      booking.booking_date >= today && ['confirmed', 'checked_in'].includes(booking.status)
    ).length;

    const statusCounts = ['confirmed', 'checked_in', 'checked_out', 'cancelled'].map((status) => ({
      status,
      count: bookings.filter((booking) => booking.status === status).length
    }));

    const popularAmenities = db.prepare(`
      SELECT a.name, COUNT(b.id) as booking_count
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      WHERE b.status != 'cancelled'
      GROUP BY b.amenity_id
      ORDER BY booking_count DESC
      LIMIT 5
    `).all();

    res.json({
      total,
      active,
      upcoming,
      statusCounts,
      popularAmenities,
      upcomingBookings: bookings.filter((booking) => booking.booking_date >= today && ['confirmed', 'checked_in'].includes(booking.status)).slice(0, 5)
    });
  } catch (err) {
    console.error('Get booking stats error:', err);
    res.status(500).json({ error: 'Failed to get booking stats' });
  }
});

// POST /api/bookings
router.post('/', authenticate, (req, res) => {
  try {
    const { amenity_id, booking_date, check_in_time, check_out_time } = req.body;

    if (!amenity_id || !booking_date || !check_in_time || !check_out_time) {
      return res.status(400).json({ error: 'Amenity ID, booking date, check-in time, and check-out time are required' });
    }

    // Check for time overlap conflicts
    const conflicts = db.prepare(`
      SELECT * FROM bookings
      WHERE amenity_id = ?
        AND booking_date = ?
        AND status != 'cancelled'
        AND check_in_time < ?
        AND check_out_time > ?
    `).all(amenity_id, booking_date, check_out_time, check_in_time);

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Time slot conflicts with an existing booking' });
    }

    const result = db.prepare(`
      INSERT INTO bookings (amenity_id, user_id, booking_date, check_in_time, check_out_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(amenity_id, req.user.id, booking_date, check_in_time, check_out_time);

    const booking = db.prepare(`
      SELECT b.*, a.name as amenity_name, u.name as user_name
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:created', booking);
    }

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PATCH /api/bookings/:id/checkin
router.patch('/:id/checkin', authenticate, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('checked_in', req.params.id);

    const updated = db.prepare(`
      SELECT b.*, a.name as amenity_name, u.name as user_name
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:updated', updated);
    }

    res.json({ booking: updated });
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// PATCH /api/bookings/:id/checkout
router.patch('/:id/checkout', authenticate, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('checked_out', req.params.id);

    const updated = db.prepare(`
      SELECT b.*, a.name as amenity_name, u.name as user_name
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:updated', updated);
    }

    res.json({ booking: updated });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to check out' });
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', authenticate, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);

    const updated = db.prepare(`
      SELECT b.*, a.name as amenity_name, u.name as user_name
      FROM bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('booking:updated', updated);
    }

    res.json({ booking: updated });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
