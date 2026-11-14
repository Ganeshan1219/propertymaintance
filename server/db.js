const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'tenant' CHECK(role IN ('tenant','owner','staff')),
      property_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed')),
      image_url TEXT,
      rating INTEGER,
      feedback TEXT,
      rated_at DATETIME,
      cost REAL DEFAULT 0,
      cost_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS maintenance_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER DEFAULT 1,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amenity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      check_out_time TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','checked_in','checked_out','cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      visitor_name TEXT NOT NULL,
      vehicle_no TEXT,
      purpose TEXT,
      entry_code TEXT NOT NULL,
      status TEXT DEFAULT 'approved' CHECK(status IN ('approved','checked_in','checked_out')),
      visit_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      tenant_name TEXT NOT NULL,
      unit TEXT DEFAULT 'Apt 302',
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );
  `);

  // Safe ALTER TABLE for existing databases
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN image_url TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN rating INTEGER'); } catch (_) {}
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN feedback TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN rated_at DATETIME'); } catch (_) {}
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN cost REAL DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE maintenance_requests ADD COLUMN cost_details TEXT'); } catch (_) {}

  // Seed data only if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seed();
  } else {
    // Seed sample notices if empty
    const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get();
    if (noticeCount.count === 0) {
      seedCommunity();
    }
  }
}

function seedCommunity() {
  const insertNotice = db.prepare('INSERT INTO notices (title, content, priority, created_by) VALUES (?, ?, ?, ?)');
  insertNotice.run(
    'Scheduled Water Tank Cleaning',
    'Dear Residents, Overhead water tanks will be sanitized this Saturday from 9:00 AM to 1:00 PM. Water supply will be paused temporarily.',
    'normal',
    'Management Office'
  );
  insertNotice.run(
    'Fire Alarm Inspection & Drill Tomorrow',
    'MANDATORY NOTICE: Annual fire alarm sensor checks will run tomorrow at 3:00 PM. Please do not panic during short sirens.',
    'urgent',
    'Security Chief'
  );

  const insertVisitor = db.prepare('INSERT INTO visitors (tenant_id, visitor_name, vehicle_no, purpose, entry_code, status, visit_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertVisitor.run(2, 'Alex Carter', 'TN-09-BK-4421', 'Guest / Dinner', '4829', 'approved', new Date().toISOString().split('T')[0]);
  insertVisitor.run(2, 'Swiggy Delivery Partner', 'KA-04-E-1234', 'Food Delivery', '8192', 'checked_in', new Date().toISOString().split('T')[0]);
}

function seed() {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  // Insert properties
  const insertProperty = db.prepare('INSERT INTO properties (name, address, owner_id) VALUES (?, ?, ?)');
  insertProperty.run('Sunrise Apartments', '123 Main Street, Downtown', 1);
  insertProperty.run('Oceanview Residences', '456 Beach Boulevard, Seaside', 1);

  // Insert users
  const insertUser = db.prepare('INSERT INTO users (name, email, password, role, property_id) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('John Owner', 'owner@example.com', hashedPassword, 'owner', null);
  insertUser.run('Jane Tenant', 'tenant@example.com', hashedPassword, 'tenant', 1);
  insertUser.run('Bob Staff', 'staff@example.com', hashedPassword, 'staff', null);

  // Insert amenities
  const insertAmenity = db.prepare('INSERT INTO amenities (property_id, name, description, capacity, image_url) VALUES (?, ?, ?, ?, ?)');
  insertAmenity.run(1, 'Pool', 'Olympic-sized swimming pool with heated water', 30, 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400');
  insertAmenity.run(1, 'Gym', 'Fully equipped fitness center with modern equipment', 20, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400');
  insertAmenity.run(1, 'Conference Room', 'Professional meeting room with AV equipment', 12, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400');
  insertAmenity.run(2, 'BBQ Area', 'Outdoor barbecue area with seating for groups', 15, 'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=400');
  insertAmenity.run(2, 'Rooftop Lounge', 'Rooftop terrace with panoramic city views', 25, 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400');

  // Insert sample maintenance requests with costs & ratings
  const insertReq = db.prepare(`
    INSERT INTO maintenance_requests 
    (property_id, tenant_id, title, description, category, priority, status, image_url, rating, feedback, cost, cost_details, created_at, resolved_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?)
  `);
  insertReq.run(1, 2, 'Kitchen Sink Leakage', 'Water is dripping continuously under the sink cupboard.', 'plumbing', 'high', 'in_progress', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', null, null, 450, 'PVC Coupler & Teflon tape', '-5 hours', null);
  insertReq.run(1, 2, 'AC Master Bedroom Not Cooling', 'AC turns on but only blows room-temperature air.', 'hvac', 'urgent', 'pending', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400', null, null, 1200, 'Capacitor & Gas top-up estimate', '-40 hours', null);
  insertReq.run(1, 2, 'Main Hallway Light Flickering', 'The ceiling tube light is blinking rapidly.', 'electrical', 'low', 'completed', null, 5, 'Quick response and fixed in 30 mins! Thank you.', 250, 'LED Driver replacement', '-48 hours', new Date().toISOString());

  seedCommunity();
}

module.exports = { db, init };
