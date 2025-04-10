const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {// Add more detailed connection options and debug info
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });// List all registered modelsObject.keys(mongoose.models).forEach(modelName => {});
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Full error:', error);
    // Don't exit in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error; // Re-throw for handling elsewhere
  }
};

module.exports = connectDB; 