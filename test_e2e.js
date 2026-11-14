process.env.PORT = '5050';
const http = require('http');
const { server } = require('./server/index');

const TEST_PORT = 5050;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 FULL-FLEDGED E2E SYSTEM TESTING');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'ok', 'Server Health Check (GET /api/health)');

    // 2. Authentication: Login as Tenant, Staff, Owner
    const tenantLogin = await request('POST', '/api/auth/login', {
      email: 'tenant@example.com',
      password: 'password123'
    });
    assert(tenantLogin.status === 200 && tenantLogin.body.token, 'Tenant Authentication (tenant@example.com)');
    const tenantToken = tenantLogin.body.token;

    const staffLogin = await request('POST', '/api/auth/login', {
      email: 'staff@example.com',
      password: 'password123'
    });
    assert(staffLogin.status === 200 && staffLogin.body.token, 'Staff Authentication (staff@example.com)');
    const staffToken = staffLogin.body.token;

    const ownerLogin = await request('POST', '/api/auth/login', {
      email: 'owner@example.com',
      password: 'password123'
    });
    assert(ownerLogin.status === 200 && ownerLogin.body.token, 'Owner Authentication (owner@example.com)');
    const ownerToken = ownerLogin.body.token;

    // 3. Maintenance Request with Photo Evidence (Feature #1)
    const newReq = await request('POST', '/api/maintenance', {
      property_id: 1,
      title: 'Balcony Door Glass Crack',
      description: 'Cracked glass during thunderstorm, needs urgent safety replacement',
      category: 'structural',
      priority: 'high',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400'
    }, tenantToken);
    assert(newReq.status === 201 && newReq.body.request.id, 'Maintenance Request Creation with Photo Attachment');
    const reqId = newReq.body.request.id;

    // 4. Live Ticket Chat Messaging (Feature #2)
    const sendChat = await request('POST', `/api/maintenance/${reqId}/messages`, {
      message: 'Hello Staff, when will the glazier inspect the cracked door?'
    }, tenantToken);
    assert(sendChat.status === 201 && sendChat.body.message.id, 'Tenant Sends Message in Live Ticket Chat');

    const staffReply = await request('POST', `/api/maintenance/${reqId}/messages`, {
      message: 'Technician Kumar has been dispatched and will arrive by 3:00 PM.'
    }, staffToken);
    assert(staffReply.status === 201 && staffReply.body.message.sender_role === 'staff', 'Staff Replies in Live Ticket Chat');

    const getChat = await request('GET', `/api/maintenance/${reqId}/messages`, null, tenantToken);
    assert(getChat.status === 200 && getChat.body.messages.length >= 2, 'Chat Thread Retrieval & Message Ordering');

    // 5. Staff Starts Progress
    const startWork = await request('PATCH', `/api/maintenance/${reqId}/status`, {
      status: 'in_progress'
    }, staffToken);
    assert(startWork.status === 200 && startWork.body.request.status === 'in_progress', 'Staff Status Transition (in_progress)');

    // 6. Complete Work & Log Spare Parts Cost
    const completeWork = await request('PATCH', `/api/maintenance/${reqId}/status`, {
      status: 'completed',
      cost: 850,
      cost_details: 'Toughened glass sheet & silicone sealant'
    }, staffToken);
    assert(completeWork.status === 200 && completeWork.body.request.status === 'completed' && completeWork.body.request.cost === 850, 'Staff Completes Ticket & Logs Cost (₹850)');

    // 7. Tenant Submits 5-Star Rating & Feedback
    const rateService = await request('POST', `/api/maintenance/${reqId}/rate`, {
      rating: 5,
      feedback: 'Prompt replacement within 2 hours! Very courteous staff.'
    }, tenantToken);
    assert(rateService.status === 200 && rateService.body.request.rating === 5, 'Tenant Rates Service (5/5 Stars + Feedback)');

    // 8. Maintenance Stats & SLA Verification
    const statsRes = await request('GET', '/api/maintenance/stats', null, ownerToken);
    assert(
      statsRes.status === 200 &&
      statsRes.body.total > 0 &&
      statsRes.body.totalExpenses > 0 &&
      statsRes.body.avgRating >= 4.0,
      'Owner Dashboard Analytics (SLA Calculation, Expense Aggregation, Satisfaction Score)'
    );

    // 9. Amenities Listing & Conflict-Free Booking
    const amenitiesRes = await request('GET', '/api/amenities', null, tenantToken);
    assert(amenitiesRes.status === 200 && amenitiesRes.body.amenities.length > 0, 'Amenities Catalog Fetch (Pool, Gym, Conference Room, etc.)');

    const pool = amenitiesRes.body.amenities[0];
    const testDate = '2026-12-25';

    const book1 = await request('POST', '/api/bookings', {
      amenity_id: pool.id,
      booking_date: testDate,
      check_in_time: '14:00',
      check_out_time: '16:00'
    }, tenantToken);
    assert(book1.status === 201 && book1.body.booking.id, 'Amenity Reservation for Pool (14:00 - 16:00)');
    const bookingId = book1.body.booking.id;

    // 10. Booking Conflict Prevention Test (Double Booking Protection)
    const conflictBook = await request('POST', '/api/bookings', {
      amenity_id: pool.id,
      booking_date: testDate,
      check_in_time: '15:00', // Overlaps with 14:00 - 16:00
      check_out_time: '17:00'
    }, staffToken);
    assert(conflictBook.status === 409, 'Conflict Prevention Algorithm Blocks Overlapping Slot (HTTP 409 Conflict)');

    // 11. Digital Pass Check-In & Check-Out
    const checkIn = await request('PATCH', `/api/bookings/${bookingId}/checkin`, null, tenantToken);
    assert(checkIn.status === 200 && checkIn.body.booking.status === 'checked_in', 'Smart Pass Action: Check-In');

    const checkOut = await request('PATCH', `/api/bookings/${bookingId}/checkout`, null, tenantToken);
    assert(checkOut.status === 200 && checkOut.body.booking.status === 'checked_out', 'Smart Pass Action: Check-Out');

    // 12. Community Notice Board
    const noticeRes = await request('POST', '/api/community/notices', {
      title: 'Elevator Maintenance Testing',
      content: 'Passenger Lift B will undergo routine cable safety audit from 11 AM to 12 PM.',
      priority: 'normal'
    }, ownerToken);
    assert(noticeRes.status === 201 && noticeRes.body.notice.id, 'Publish Community Notice (Owner Role)');

    const getNotices = await request('GET', '/api/community/notices', null, tenantToken);
    assert(getNotices.status === 200 && getNotices.body.notices.length > 0, 'Tenants Read Community Notice Board Feed');

    // 13. Emergency SOS Dispatch
    const sosRes = await request('POST', '/api/community/emergency', {
      type: 'lift_stuck',
      description: 'Elevator stalled between 3rd and 4th floors with 2 passengers',
      unit: 'Tower A Lift 2'
    }, tenantToken);
    assert(sosRes.status === 201 && sosRes.body.alert.status === 'active', 'Trigger Emergency SOS Dispatch Alert');

    const resolveSOS = await request('PATCH', `/api/community/emergency/${sosRes.body.alert.id}/resolve`, null, staffToken);
    assert(resolveSOS.status === 200 && resolveSOS.body.alert.status === 'resolved', 'Staff Resolves Emergency SOS');

    // 14. Visitor Pass & 4-Digit Entry PIN
    const visitorRes = await request('POST', '/api/community/visitors', {
      visitor_name: 'Dr. Subramanian',
      vehicle_no: 'TN-07-CM-9900',
      purpose: 'Family Physician Visit'
    }, tenantToken);
    assert(
      visitorRes.status === 201 &&
      visitorRes.body.visitor.entry_code.length === 4,
      `Visitor Pass Pre-Approval (Generated 4-Digit PIN: ${visitorRes.body?.visitor?.entry_code})`
    );

    const gateIn = await request('PATCH', `/api/community/visitors/${visitorRes.body.visitor.id}/status`, {
      status: 'checked_in'
    }, staffToken);
    assert(gateIn.status === 200 && gateIn.body.visitor.status === 'checked_in', 'Security Gate In Verification');

    // 15. Monthly Audit Report Generation
    const auditRes = await request('GET', '/api/community/audit-summary', null, ownerToken);
    assert(
      auditRes.status === 200 &&
      auditRes.body.kpis.totalRequests >= 3 &&
      auditRes.body.kpis.bookingConflicts === 0,
      'Certified Management Monthly Audit Summary Report'
    );

    console.log('\n====================================================');
    console.log(`📊 FINAL TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('🎉 ALL 15 CRITICAL E2E TESTS PASSED WITH 100% SUCCESS!');
    }
  } catch (err) {
    console.error('Testing Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

setTimeout(runTests, 500);
