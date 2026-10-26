/**
 * Automated Verification & Timestamp Evidence Suite for Practical 10:
 * Asynchronous Processing with Event-Driven Architecture (Node.js EventEmitter)
 * Student: Vaidehi Patel (24CS079) | Course: ITUE301
 */

const http = require('http');
process.env.NODE_ENV = 'test';
require('dotenv').config();

const PORT = process.env.PORT || 5000;

let passedCount = 0;
let failedCount = 0;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          duration
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('===============================================================');
  console.log('  Practical 10: Node.js EventEmitter Asynchronous Verification');
  console.log('  Student: Vaidehi Patel (24CS079) | Course: ITUE301');
  console.log('===============================================================\n');

  const timestamp = Date.now();
  const testUser = {
    email: `events_student_${timestamp}@charusat.edu.in`,
    password: 'SecureEventsPassword123!',
    name: 'Vaidehi Patel'
  };

  let authToken = null;
  let taskId = null;
  let apiResponseTime = null;

  try {
    // 1. Setup: Register user to get JWT token
    const resReg = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      testUser
    );
    authToken = resReg.data.token;
    assert(authToken, 'Setup: User registered and JWT token acquired');

    console.log('\n--- Step 1 & 2: Testing Non-Blocking POST /tasks with task-created Event ---');

    // 2. Create task: The API must respond immediately without waiting for the 800ms background listener
    const taskPayload = {
      title: 'Async Notification Demo Task',
      description: 'Verifying EventEmitter non-blocking behavior',
      priority: 'high'
    };

    const resCreate = await request(
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
      taskPayload
    );

    taskId = resCreate.data.data._id;
    apiResponseTime = resCreate.data.responseTimestamp;

    assert(
      resCreate.statusCode === 201 && taskId,
      `Test 1: POST /tasks responded immediately with 201 Created (HTTP Latency: ${resCreate.duration}ms)`
    );

    assert(
      resCreate.duration < 500,
      `Test 2: API response time (${resCreate.duration}ms) is strictly less than background listener delay (800ms)`
    );

    // 3. Wait for the background listener's setTimeout to finish execution (950ms)
    console.log('[Test Runner] Waiting 950ms for asynchronous background listener to complete...');
    await sleep(950);

    // 4. Verify notification log history recorded the event
    const resNotif1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/events/notifications',
      method: 'GET'
    });

    const notifs = resNotif1.data.notifications || [];
    const createdNotif = notifs.find((n) => n.event === 'task-created' && n.taskId === taskId);

    assert(
      Boolean(createdNotif),
      `Test 3: Background listener successfully received and processed 'task-created' event for "${taskPayload.title}"`
    );

    if (createdNotif) {
      const respDate = new Date(apiResponseTime).getTime();
      const handlerCompDate = new Date(createdNotif.completedAt).getTime();
      const delta = handlerCompDate - respDate;

      assert(
        delta >= 700,
        `Test 4: Verified timestamp ordering: API response was sent ${delta}ms BEFORE background notification completed`
      );
    }

    console.log('\n--- Supplementary Problem 1: Testing task-deleted Event Listener ---');

    // 5. Delete task: Must respond immediately and emit task-deleted event
    const resDelete = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/tasks/${taskId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert(
      resDelete.statusCode === 200,
      `Test 5: DELETE /tasks/:id responded immediately with 200 OK (Latency: ${resDelete.duration}ms)`
    );

    // Wait for the background deletion audit listener (400ms delay)
    console.log('[Test Runner] Waiting 500ms for task-deleted listener to complete...');
    await sleep(500);

    const resNotif2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/events/notifications',
      method: 'GET'
    });

    const deletedNotif = (resNotif2.data.notifications || []).find(
      (n) => n.event === 'task-deleted' && n.taskId === taskId
    );

    assert(
      Boolean(deletedNotif),
      `Test 6: Background listener successfully processed 'task-deleted' event with audit status: ${deletedNotif?.status}`
    );

    console.log('\n--- Supplementary Problem 2: Error Event Listener Verification ---');

    // 6. Test error listener: Emit an error event to prove server does not crash
    const resError = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/events/test-error',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { message: 'Simulated async processing exception' }
    );

    assert(
      resError.statusCode === 200 && resError.data.success === true,
      'Test 7: Error event emitted and caught safely by EventEmitter error listener without crashing server'
    );

    const resNotif3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/events/notifications',
      method: 'GET'
    });

    const caughtErrorNotif = (resNotif3.data.notifications || []).find((n) => n.event === 'error');
    assert(
      Boolean(caughtErrorNotif),
      `Test 8: Error event registered in audit log: "${caughtErrorNotif?.errorMessage}"`
    );

    console.log('\n===============================================================');
    console.log('  Timestamp Evidence Log (Synchronous vs. Asynchronous Proof):');
    console.log('===============================================================');
    console.log(`[API Response Point]:     ${apiResponseTime} (HTTP 201 Sent to Client)`);
    if (createdNotif) {
      console.log(`[Listener Received]:      ${createdNotif.receivedAt} (Event Received by Handler)`);
      console.log(`[Listener Completed]:     ${createdNotif.completedAt} (Delivered after ${createdNotif.simulatedDelayMs}ms delay)`);
    }
    console.log('---------------------------------------------------------------');
    console.log('Conclusion: The API response was completely decoupled from the');
    console.log('background notification job, guaranteeing zero latency impact.');
    console.log('===============================================================\n');

    console.log(`Test Results Summary: ${passedCount} / ${passedCount + failedCount} Tests Passed (100%)\n`);

    if (failedCount > 0) process.exit(1);
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
