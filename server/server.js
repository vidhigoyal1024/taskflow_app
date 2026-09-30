require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

['MONGO_URI', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and set it.`);
    process.exit(1);
  }
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`TaskFlow API running on port ${PORT}`)))
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
