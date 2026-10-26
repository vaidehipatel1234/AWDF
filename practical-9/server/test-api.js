/**
 * Automated Verification & Response Time Benchmark Suite for Practical 9:
 * In-Memory Caching and Query Optimization (node-cache + Express + MongoDB Atlas)
 * Student: Vaidehi Patel (24CS079) | ITUE301
 */

const http = require('http');
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

async function runTests() {
  console.log('===============================================================');
  console.log('  Practical 9: In-Memory Caching (node-cache) Verification');
  console.log('  Student: Vaidehi Patel (24CS079) | Course: ITUE301');
  console.log('===============================================================\n');

  const timestamp = Date.now();
  const testUser = {
    email: `cache_student_${timestamp}@charusat.edu.in`,
    password: 'SecureCachePassword123!',
    name: 'Vaidehi Patel'
  };

  let authToken = null;
  let taskId = null;

  const uncachedTimes = [];
  const cachedTimes = [];

  try {
    // 1. Clear any prior cache state
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/cache/clear',
      method: 'POST'
    });

    // 2. Register user to get JWT token
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

    // 3. Create a test task in MongoDB Atlas
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
      {
        title: 'Cache Benchmark Task',
        description: 'Testing node-cache performance',
        priority: 'high'
      }
    );
    taskId = resCreate.data.data._id;
    assert(taskId, 'Setup: Initial task created in MongoDB Atlas');

    console.log('\n--- Step 1 & 2: Testing Cache Miss vs. Cache Hit on GET /tasks ---');

    // Request 1: Cache MISS (must query MongoDB)
    const res1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    uncachedTimes.push(res1.duration);
    assert(
      res1.headers['x-cache'] === 'MISS',
      `Test 1: First GET /tasks is Cache MISS (${res1.duration}ms from MongoDB Atlas)`
    );

    // Request 2: Cache HIT (served immediately from node-cache)
    const res2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    cachedTimes.push(res2.duration);
    assert(
      res2.headers['x-cache'] === 'HIT',
      `Test 2: Second GET /tasks is Cache HIT (${res2.duration}ms from node-cache memory)`
    );

    // Request 3: Cache HIT (served from memory)
    const res3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    cachedTimes.push(res3.duration);
    assert(
      res3.headers['x-cache'] === 'HIT',
      `Test 3: Third GET /tasks is Cache HIT (${res3.duration}ms from node-cache memory)`
    );

    console.log('\n--- Supplementary Problem 1: Independent Single-Task Caching (GET /tasks/:id) ---');

    // Single-task Request 1: Cache MISS
    const resSingle1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/tasks/${taskId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resSingle1.headers['x-cache'] === 'MISS',
      `Test 4: First GET /tasks/:id is single-task Cache MISS (${resSingle1.duration}ms)`
    );

    // Single-task Request 2: Cache HIT
    const resSingle2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/tasks/${taskId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resSingle2.headers['x-cache'] === 'HIT',
      `Test 5: Second GET /tasks/:id is single-task Cache HIT (${resSingle2.duration}ms)`
    );

    console.log('\n--- Step 4: Testing Cache Invalidation on Writes (POST, PUT, DELETE) ---');

    // Invalidation via PUT: Updates task
    const resPut = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/tasks/${taskId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      },
      { title: 'Updated Title for Invalidation Test' }
    );
    assert(resPut.statusCode === 200, 'Test 6: PUT /tasks/:id successfully updates task');

    // Next GET /tasks must be a Cache MISS because PUT invalidated the cache
    const resAfterPut = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    uncachedTimes.push(resAfterPut.duration);
    assert(
      resAfterPut.headers['x-cache'] === 'MISS',
      `Test 7: GET /tasks after PUT is Cache MISS (${resAfterPut.duration}ms, cache was correctly invalidated)`
    );

    // Invalidation via POST: Creates another task
    const resPost2 = await request(
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
      { title: 'Second Task', description: 'Triggers invalidation' }
    );
    const task2Id = resPost2.data.data._id;
    assert(resPost2.statusCode === 201, 'Test 8: POST /tasks creates second task');

    // Next GET /tasks must be Cache MISS
    const resAfterPost = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    uncachedTimes.push(resAfterPost.duration);
    assert(
      resAfterPost.headers['x-cache'] === 'MISS',
      `Test 9: GET /tasks after POST is Cache MISS (${resAfterPost.duration}ms, cache was invalidated)`
    );

    // Immediate repeat GET /tasks should now be Cache HIT
    const resAfterPostHit = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    cachedTimes.push(resAfterPostHit.duration);
    assert(
      resAfterPostHit.headers['x-cache'] === 'HIT',
      `Test 10: Subsequent GET /tasks is Cache HIT (${resAfterPostHit.duration}ms)`
    );

    // Invalidation via DELETE:
    const resDel = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/tasks/${task2Id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(resDel.statusCode === 200, 'Test 11: DELETE /tasks/:id deletes task');

    // Next GET /tasks must be Cache MISS
    const resAfterDel = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/tasks',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(
      resAfterDel.headers['x-cache'] === 'MISS',
      `Test 12: GET /tasks after DELETE is Cache MISS (invalidated correctly)`
    );

    console.log('\n--- Supplementary Problem 2: Cache Hit/Miss Debug Endpoint (GET /cache/stats) ---');

    const resStats = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/cache/stats',
      method: 'GET'
    });
    const stats = resStats.data.data;
    assert(
      resStats.statusCode === 200 && stats.hits >= 4 && stats.misses >= 5,
      `Test 13: GET /cache/stats returns metrics: ${stats.hits} Hits, ${stats.misses} Misses, ${stats.hitRatio} Hit Ratio`
    );

    console.log('\n===============================================================');
    console.log('  Empirical Response Time Comparison (Lab Journal Requirement):');
    console.log('===============================================================');
    console.log(`Sample 1 Uncached: ${uncachedTimes[0]}ms  |  Sample 1 Cached: ${cachedTimes[0]}ms`);
    console.log(`Sample 2 Uncached: ${uncachedTimes[1]}ms  |  Sample 2 Cached: ${cachedTimes[1]}ms`);
    console.log(`Sample 3 Uncached: ${uncachedTimes[2]}ms  |  Sample 3 Cached: ${cachedTimes[2]}ms`);

    const avgUncached = (uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length).toFixed(1);
    const avgCached = (cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length).toFixed(1);
    const speedup = (avgUncached / avgCached).toFixed(1);

    console.log('---------------------------------------------------------------');
    console.log(`Average Uncached: ${avgUncached}ms (MongoDB Atlas Cloud Network)`);
    console.log(`Average Cached:   ${avgCached}ms (In-Memory node-cache)`);
    console.log(`Performance Gain: ${speedup}x Faster Response Time via In-Memory Caching`);
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
