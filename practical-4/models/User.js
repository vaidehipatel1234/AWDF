const mongoose = require('mongoose');

/**
 * User Schema Definition (Practical 7)
 * Fields:
 * - email: String, required, unique, lowercase, trimmed
 * - password: String (hashed via bcrypt), required
 * - name: String, optional displayName
 * - createdAt: Date, default Date.now
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
