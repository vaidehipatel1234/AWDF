/**
 * Automated Verification Test Suite for Practical 7:
 * Authentication and Middleware Pipeline (JWT + bcryptjs + Express + MongoDB Atlas)
 * Student: Vaidehi Patel (24CS079) | ITUE301
 */

const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

let passedCount = 0;
let failedCount = 0;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  Practical 7: JWT Authentication & Middleware Test Suite');
  console.log('  Student: Vaidehi Patel (24CS079) | Course: ITUE301');
  console.log('===============================================================\n');

  // Generate unique test email to prevent collisions across runs
  const timestamp = Date.now();
  const testUser = {
    email: `student_${timestamp}@charusat.edu.in`,
    password: 'SecurePassword123!',
    name: 'Vaidehi Patel'
  };

  let authToken = null;
  let createdTaskId = null;

  try {
    // Test 1: GET / - Root Discovery & Status
    const res1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'GET'
    });
    assert(res1.statusCode === 200 && res1.data.course === 'ITUE301', 'Test 1: GET / returns 200 OK with API discovery manifest');

    // Test 2: POST /register with invalid email rejected with 400
    const res2 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'invalid-email', password: 'Password123' }
    );
    assert(res2.statusCode === 400 && res2.data.error.includes('valid email'), 'Test 2: POST /register with invalid email returns 400 Bad Request');

    // Test 3: POST /register with short password rejected with 400
    const res3 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: `test_${timestamp}@test.com`, password: '123' }
    );
    assert(res3.statusCode === 400 && res3.data.error.includes('6 characters'), 'Test 3: POST /register with short password returns 400 Bad Request');

    // Test 4: POST /register successfully creates User with bcrypt hash and returns token
    const res4 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      testUser
    );
    assert(res4.statusCode === 201 && res4.data.token && res4.data.user.email === testUser.email.toLowerCase(), 'Test 4: POST /register registers user with bcrypt and returns 201 + JWT');

    // Test 5: POST /register with duplicate email rejected with 400
    const res5 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      testUser
    );
    assert(res5.statusCode === 400 && res5.data.error.includes('already registered'), 'Test 5: POST /register with duplicate email rejected with 400');

    // Test 6: POST /login with incorrect password rejected with 401
    const res6 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: testUser.email, password: 'WrongPassword999' }
    );
    assert(res6.statusCode === 401 && res6.data.error.includes('Invalid email or password'), 'Test 6: POST /login with incorrect password rejected with 401 Unauthorized');

    // Test 7: POST /login with correct password signs valid JWT token
    const res7 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: testUser.email, password: testUser.password }
    );
    assert(res7.statusCode === 200 && res7.data.token, 'Test 7: POST /login validates password and returns 200 OK + JWT token');
    authToken = res7.data.token;

    // Test 8: GET /me with valid JWT token returns authenticated user details (Supplementary Problem 1)
    const res8 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(res8.statusCode === 200 && res8.data.user.email === testUser.email.toLowerCase(), 'Test 8: GET /me returns logged-in user profile from decoded token');

    // Test 9: GET /me without Authorization header returns 401 Unauthorized
    const res9 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/me',
      method: 'GET'
    });
    assert(res9.statusCode === 401 && res9.data.error.includes('missing'), 'Test 9: GET /me without token returns 401 Unauthorized');

    // Test 10: GET /tasks without Authorization header returns 401 Unauthorized
    const res10 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET'
    });
    assert(res10.statusCode === 401, 'Test 10: GET /tasks protected route blocks unauthenticated request with 401');

    // Test 11: GET /tasks with invalid or tampered token returns 401 Unauthorized
    const res11 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: 'Bearer this_is_a_tampered_invalid_token' }
    });
    assert(res11.statusCode === 401 && res11.data.error.includes('Invalid token'), 'Test 11: GET /tasks with tampered token safely rejected with 401');

    // Test 12: POST /tasks without title rejected by validation middleware with 400
    const res12 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/tasks',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      },
      { description: 'Task without title' }
    );
    assert(res12.statusCode === 400 && res12.data.error.includes('title is required'), 'Test 12: POST /tasks rejected by validation middleware with 400 Bad Request');

    // Test 13: POST /tasks creates task associated with authenticated user
    const res13 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/tasks',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      },
      {
        title: 'Full Stack Authentication Task',
        description: 'Verify JWT and bcrypt pipeline',
        priority: 'high'
      }
    );
    assert(res13.statusCode === 201 && res13.data.data._id, 'Test 13: POST /tasks creates task in MongoDB Atlas and returns 201 Created');
    createdTaskId = res13.data.data._id;

    // Test 14: GET /tasks retrieves authenticated user tasks
    const res14 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(res14.statusCode === 200 && Array.isArray(res14.data.data), 'Test 14: GET /tasks retrieves tasks list for authenticated user');

    // Test 15: PUT /tasks/:id updates task with valid token
    const res15 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/tasks/${createdTaskId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      },
      { completed: true, title: 'Updated Auth Task' }
    );
    assert(res15.statusCode === 200 && res15.data.data.completed === true, 'Test 15: PUT /tasks/:id updates task with valid token and returns 200 OK');

    // Test 16: DELETE /tasks/:id removes task with valid token
    const res16 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/tasks/${createdTaskId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(res16.statusCode === 200 && res16.data.success === true, 'Test 16: DELETE /tasks/:id deletes task and returns 200 OK');

    console.log('\n===============================================================');
    console.log(`  Test Results Summary: ${passedCount} / ${passedCount + failedCount} Tests Passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
    console.log('===============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

// Start server in background if not already running, then run tests
const app = require('./server');
const server = app.listen(PORT, () => {
  runTests().finally(() => {
    server.close(() => {
      process.exit(failedCount > 0 ? 1 : 0);
    });
  });
});
