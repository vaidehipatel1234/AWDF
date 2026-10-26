/**
 * Practical 12: CI/CD Pipeline Automated Tests
 * Student: Vaidehi Patel (24CS079) | Course: ITUE301
 * Uses Node.js native test runner (node:test) and assert
 * Compatible with GitHub Actions CI on ubuntu-latest
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
const app = require('../server');

let server;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ statusCode: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

test.before(() => {
  return new Promise((resolve) => {
    server = app.listen(5001, () => {
      console.log('[CI Test Server] Running on http://127.0.0.1:5001');
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        resolve();
        setTimeout(() => process.exit(0), 100);
      });
    } else {
      resolve();
      setTimeout(() => process.exit(0), 100);
    }
  });
});

// Step 2 Core Test: Testing Base Route /
test('Test 1: GET / returns status 200 with API metadata', async () => {
  const res = await makeRequest('/');
  assert.strictEqual(res.statusCode, 200, 'Expected status code 200');
  assert.ok(res.data.message.includes('Task Manager API'), 'Expected welcome message');
  assert.strictEqual(res.data.student, 'Vaidehi Patel (24CS079)');
});

// Supplementary Problem: Second automated test covering different endpoint
test('Test 2: GET /health returns service health status', async () => {
  const res = await makeRequest('/health');
  assert.ok([200, 503].includes(res.statusCode), 'Health endpoint must respond with 200 or 503');
  assert.ok(res.data.status, 'Response must contain status field');
});

// Test 3: Event Notifications endpoint
test('Test 3: GET /events/notifications returns 200 and audit array', async () => {
  const res = await makeRequest('/events/notifications');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(Array.isArray(res.data.notifications), 'Notifications should be an array');
});

// Test 4: Validation pipeline rejects invalid registration payload
test('Test 4: POST /register rejects missing email with 400 Bad Request', async () => {
  const res = await makeRequest('/register', 'POST', { password: 'pass', name: 'Test' });
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.data.success, false);
});

// Test 5: In-Memory Cache Stats endpoint
test('Test 5: GET /cache/stats responds with status 200', async () => {
  const res = await makeRequest('/cache/stats');
  assert.strictEqual(res.statusCode, 200);
});
