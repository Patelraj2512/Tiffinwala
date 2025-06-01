import { Attendance } from '../models/Attendance';

export interface AttendanceData {
  studentId: string;
  studentName: string;
  date: Date;
  quantity: number;
  status: 'present' | 'absent';
}

export const attendanceService = {
  // Create new attendance record
  async createAttendance(data: AttendanceData) {
    try {
      const attendance = new Attendance(data);
      return await attendance.save();
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  },

  // Get attendance records for a specific date
  async getAttendanceByDate(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await Attendance.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Update attendance record
  async updateAttendance(id: string, data: Partial<AttendanceData>) {
    try {
      return await Attendance.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  // Delete attendance record
  async deleteAttendance(id: string) {
    try {
      return await Attendance.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  },

  // Get attendance summary for a date range
  async getAttendanceSummary(startDate: Date, endDate: Date) {
    try {
      return await Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              studentId: '$studentId',
              studentName: '$studentName'
            },
            totalQuantity: { $sum: '$quantity' },
            presentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            absentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      throw error;
    }
  }
}; 