const express = require('express');

const Task = require('../models/Task');

const { authenticate } = require('../middleware/auth');

const {
  enqueueTask,
} = require('../queues/taskQueue');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const page =
      Math.max(1, parseInt(req.query.page) || 1);

    const limit =
      Math.min(50, parseInt(req.query.limit) || 20);

    const skip = (page - 1) * limit;

    const { status, operation } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (status) filter.status = status;

    if (operation) filter.operation = operation;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      inputText,
      operation,
    } = req.body;

    if (!title || !inputText || !operation) {
      return res.status(400).json({
        error:
          'title, inputText, and operation are required.',
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      inputText,
      operation,
      status: 'pending',

      logs: [
        {
          level: 'info',
          message: 'Task created and queued.',
        },
      ],
    });

    res.status(201).json({
      message: 'Task created.',
      task,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res
        .status(404)
        .json({ error: 'Task not found.' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/run
router.post('/:id/run', async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res
        .status(404)
        .json({ error: 'Task not found.' });
    }

    if (task.status === 'running') {
      return res.status(409).json({
        error: 'Task is already running.',
      });
    }

    if (task.status === 'success') {
      return res.status(409).json({
        error:
          'Task already completed. Create a new task to re-run.',
      });
    }

    // Reset state
    task.status = 'pending';

    task.result = null;

    task.startedAt = null;

    task.completedAt = null;

    task.logs = [
      {
        level: 'info',
        message: 'Task queued for processing.',
      },
    ];

    await task.save();

    // Push job into Redis queue
    const jobId = await enqueueTask(
      task._id.toString(),
      req.user._id.toString(),
      task.operation,
      task.inputText
    );

    task.jobId = jobId;

    await task.save();

    res.json({
      message: 'Task queued successfully.',
      task,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task =
      await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });

    if (!task) {
      return res
        .status(404)
        .json({ error: 'Task not found.' });
    }

    res.json({
      message: 'Task deleted.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;