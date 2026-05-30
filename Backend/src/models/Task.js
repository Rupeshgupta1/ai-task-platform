const mongoose = require('mongoose');

const OPERATIONS = [
  'uppercase',
  'lowercase',
  'reverse',
  'word_count',
];

const STATUSES = [
  'pending',
  'running',
  'success',
  'failed',
];

const logEntrySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error'],
      default: 'info',
    },

    message: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    inputText: {
      type: String,
      required: [true, 'Input text is required'],
      maxlength: [10000, 'Input text cannot exceed 10,000 characters'],
    },

    operation: {
      type: String,
      required: [true, 'Operation is required'],
      enum: {
        values: OPERATIONS,
        message: `Operation must be one of: ${OPERATIONS.join(', ')}`,
      },
    },

    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    logs: {
      type: [logEntrySchema],
      default: [],
    },

    jobId: {
      type: String,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
taskSchema.index({ userId: 1, status: 1 });

taskSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);

module.exports.OPERATIONS = OPERATIONS;