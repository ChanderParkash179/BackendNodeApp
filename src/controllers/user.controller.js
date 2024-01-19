import { async_handler } from '../utils/async.handler.js';
import { APIError } from '../utils/api.error.js';
import { APIResponse } from '../utils/api.response.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';


const register = async_handler(async (req, res) => {
  // get user details
  const { fullname, username, email, password } = req.body;

  // validation
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "some fields are missing in request!");
  }

  // check if user already exists
  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) throw new APIError(409, "user already available against provided email or username");

  // check for images, check for avatar
  const avatar_local_path = req.files?.avatar[0]?.path;
  const coverImage_local_path = req.files?.coverImage[0]?.path;

  if (!avatar_local_path) throw new APIError(400, "avatar file is required!");

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatar_local_path);
  const coverImage = await uploadOnCloudinary(coverImage_local_path);

  if (!avatar) throw new APIError(400, "avatar file is required!");

  // create user object - create entry in db
  const user = await User.create({
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url,
    username: username.toLowerCase(),
  });

  // remove password & refresh token field from response
  const created = await User.findById(user._id).select("--password --refreshToken");
  // check for user creation
  if (!created) throw new APIError(500, "something went wrong, during user registration!");

  // return response
  return res.status(201).json(new APIResponse(201, created, "user registered successfully!"));
});

export { register }