require('dotenv').config();

const { Queue } = require('bullmq');
const { redisConfig, createRedisClient } = require('../config/redis');

const QUEUE_NAME = 'task-processing';
const PYTHON_QUEUE_KEY = 'task-queue-python';

// ✅ ONE Redis client shared for lpush (Python queue)
const redisClient = createRedisClient();

// ✅ BullMQ gets redisConfig (plain object), manages its own connection internally
const taskQueue = new Queue(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // retries: 2s → 4s → 8s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

taskQueue.on('error', (err) => {
  console.error(`Queue error: ${err.message}`);
});

const enqueueTask = async (taskId, userId, operation, inputText) => {
  const payload = { taskId, userId, operation, inputText };

  // 1. Push to BullMQ (consumed by Node.js worker)
  const job = await taskQueue.add('process-task', payload, {
    jobId: taskId.toString(), // prevents duplicate jobs for same task
  });

  // 2. Push to Redis list (consumed by Python worker)
  await redisClient.lpush(PYTHON_QUEUE_KEY, JSON.stringify(payload));

  console.log(`Job enqueued: ${job.id} (operation: ${operation})`);

  return job.id;
};

module.exports = { taskQueue, enqueueTask, QUEUE_NAME, PYTHON_QUEUE_KEY };