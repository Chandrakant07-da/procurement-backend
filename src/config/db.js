const mongoose = require('mongoose');

// Design Pattern: Singleton
// Ensures only one database connection is created and reused.
class Database {
  constructor() {
    if (!Database.instance) {
      this.connect();
      Database.instance = this;
    }
    return Database.instance;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected Successfully');
    } catch (error) {
      console.error('Database connection failed:', error.message);
      process.exit(1);
    }
  }
}

const instance = new Database();
Object.freeze(instance);

module.exports = instance;