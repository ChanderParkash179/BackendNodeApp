import { User } from "../models/user.model.js";
import { APIError } from "../utils/api.error.js";
import { async_handler } from "../utils/async.handler.js";

import jwt from 'jsonwebtoken';

export const verifyJWT = async_handler(async (req, res, next) => {
  try {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new APIError(401, "unauthorized request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    req.user = user;
    next();
  } catch (error) {
    throw new APIError(500, `something went wrong on verify token ERROR: [${error}]`);
  }
});