// package imports
import express from 'express';
import cors from 'cors';
import cookie_parser from 'cookie-parser';

// file imports
import { BASE_URL } from './constants.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookie_parser());

import user from './routes/user.route.js';
import tweet from './routes/tweet.routes.js';

app.use(`${BASE_URL}/users`, user);
app.use(`${BASE_URL}/tweets`, tweet)

export { app }