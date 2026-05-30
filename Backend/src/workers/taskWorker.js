require('dotenv').config();

const { Worker } = require('bullmq');

const connectDB = require('../config/database');

const { createRedisClient } = require('../config/redis');

const Task = require('../models/Task');

const processOperation = (operation, text) => {
  switch (operation) {
    case 'uppercase':
      return text.toUpperCase();

    case 'lowercase':
      return text.toLowerCase();

    case 'reverse':
      return text.split('').reverse().join('');

    case 'word_count':
      return text.trim().split(/\s+/).length;

    default:
      throw new Error('Invalid operation');
  }
};

const startWorker = async () => {
  // ✅ Connect to MongoDB FIRST before Worker is created
  await connectDB();
  console.log('MongoDB connected. Starting worker...');

  // ✅ Worker is now created AFTER MongoDB is ready
  const connection = createRedisClient();

  const worker = new Worker(
    'task-processing',

    async (job) => {
      const { taskId, operation, inputText } = job.data;

      const task = await Task.findById(taskId);

      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      task.status = 'running';
      task.startedAt = new Date();
      task.logs.push({
        level: 'info',
        message: 'Task processing started.',
      });

      await task.save();

      try {
        const result = processOperation(operation, inputText);

        task.status = 'success';
        task.result = result;
        task.completedAt = new Date();
        task.logs.push({
          level: 'info',
          message: 'Task completed successfully.',
        });

        await task.save();

        return result;
      } catch (error) {
        task.status = 'failed';
        task.completedAt = new Date();
        task.logs.push({
          level: 'error',
          message: `Processing failed: ${error.message}`,
        });

        await task.save();

        throw error;
      }
    },

    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error(`Worker error: ${err.message}`);
  });

  console.log('Worker listening for jobs...');
};

startWorker();