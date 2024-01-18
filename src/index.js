// package imports
import dotenv from 'dotenv';
import express from 'express';

// file imports
import connectDB from './database/db.connection.js';

dotenv.config({ path: './env' });

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => { console.log(`server running on PORT: [${PORT}]`) });