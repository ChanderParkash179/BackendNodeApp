// package imports
import dotenv from 'dotenv';

// file imports
import connectDB from './database/db.connection.js';
import { app } from './app.js';

dotenv.config({ path: './env' });

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️ server running on PORT: [${PORT}]`)
    })
  })
  .catch((err) => {
    console.error(`⚠️ MONGODB connection failed ${err}`)
  });