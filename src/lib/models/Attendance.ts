import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema); 