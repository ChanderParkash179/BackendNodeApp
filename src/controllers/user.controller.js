import jwt from 'jsonwebtoken';
import { async_handler } from '../utils/async.handler.js';
import { APIError } from '../utils/api.error.js';
import { APIResponse } from '../utils/api.response.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { OPTIONS } from '../constants.js';


// * CREATING REFRESH AND ACCESS TOKENS
const createAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new APIError(500, `something went wrong in while generating access or refresh token! error: [${error}]`);
  }
}

// * REGISTER USER API
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
  const created = await User.findById(user._id).select("-password -refreshToken");

  // check for user creation
  if (!created) throw new APIError(500, "something went wrong, during user registration!");

  // return response
  return res.status(201).json(new APIResponse(201, created, "user registered successfully!"));
});

// * LOGIN USER API
const login = async_handler(async (req, res) => {

  // get details from body
  const { username, email, password } = req.body;

  // username or email validation
  if (!(username || email))
    throw new APIError(400, "username or email is required!");

  // find the user
  const user = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  );

  // validate user
  if (!user) throw new APIError(404, "no user found against the provided request");

  // validate password
  const passwordValidation = await user.isPasswordCorrect(password);
  if (!passwordValidation) throw new APIError(401, "unauthorized request");

  // creating access and refresh token
  const { refreshToken, accessToken } = await createAccessAndRefreshToken(user._id);

  // creating object for response
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // creating options for http cookie security
  const options = OPTIONS;

  // return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        {
          accessToken,
          refreshToken,
          user: loggedInUser
        },
        "user logged in successfully"
      )
    );
});

// * LOGOUT USER API
const logout = async_handler(async (req, res) => {
  // updating refresh token for logging out
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  );

  // creating options for http cookie security
  const options = OPTIONS;

  // return response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new APIResponse(
        200,
        {},
        "user logged out successfully!"
      )
    )
});

// * REFRESH ACCESS TOKEN
const refreshAccessToken = async_handler(async (req, res) => {
  try {
    // extract refresh token
    const inRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    // check availability of token
    if (!inRefreshToken) throw new APIError(401, "unauthorized request");

    // decode token
    const decoded = jwt.verify(inRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // finding user with decoded token
    const user = await User.findById(decoded?._id);

    // validating fetched user
    if (!user) throw new APIError(404, "no user available!");

    // comparing & validating user refreshToken with requested token
    if (inRefreshToken !== user?.refreshToken) throw new APIError(401, "refresh token is expired or used!");

    // extracting options for security of headers & cookies
    const options = OPTIONS;

    // extracting accessToken and refreshToken
    const { newRefreshToken, accessToken } = await createAccessAndRefreshToken(user._id);

    // returning response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new APIResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "access token refreshed!"
        )
      )
  } catch (error) {
    throw new APIError(
      401,
      error?.message || "invalid refresh token!"
    )
  }

});

export { register, login, logout, refreshAccessToken }