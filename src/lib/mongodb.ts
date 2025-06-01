import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Monster';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = db.connections[0].readyState === 1;
    
    if (isConnected) {
      console.log('MongoDB connected successfully');
    } else {
      console.error('MongoDB connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Please make sure MongoDB is installed and running on your system');
    console.log('You can download MongoDB from: https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
}; 