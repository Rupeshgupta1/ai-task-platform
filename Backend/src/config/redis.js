const { Redis } = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('Redis: max retries reached. Giving up.');
      return null;
    }

    const delay = Math.min(times * 200, 3000);

    console.warn(
      `Redis: retrying connection in ${delay}ms (attempt ${times})`
    );

    return delay;
  },
};

const createRedisClient = () => {
  const client = new Redis(redisConfig);

  client.on('connect', () => console.log('Redis connected'));

  client.on('error', (err) =>
    console.error(`Redis error: ${err.message}`)
  );

  client.on('close', () =>
    console.warn('Redis connection closed')
  );

  return client;
};

module.exports = {
  redisConfig,
  createRedisClient,
};