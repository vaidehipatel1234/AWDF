const mongoose = require('mongoose');

/**
 * Task Schema Definition (Practical 5, 6, 7)
 * Fields:
 * - title: String, required
 * - description: String
 * - completed: Boolean, default false
 * - priority: String, enum ['low', 'medium', 'high'], default 'medium'
 * - user: ObjectId referencing User model (Practical 7 user scoping)
 * - createdAt: Date, default Date.now
 */
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be one of: low, medium, high'
    },
    default: 'medium',
    lowercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook that automatically trims whitespace from the title field
taskSchema.pre('save', function () {
  if (this.title && typeof this.title === 'string') {
    this.title = this.title.trim();
  }
});

module.exports = mongoose.model('Task', taskSchema);
