import jwt from 'jsonwebtoken';
import { async_handler } from '../utils/async.handler.js';
import { APIError } from '../utils/api.error.js';
import { APIResponse } from '../utils/api.response.js';
import { User } from '../models/user.model.js';
import { removeFromCloudinary, searchOnCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { OPTIONS, STATUS_CODE } from '../constants.js';


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
    throw new APIError(STATUS_CODE.INTERNAL_SERVER_ERROR, `something went wrong in while generating access or refresh token! error: [${error}]`);
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
    throw new APIError(STATUS_CODE.BAD_REQUEST, "some fields are missing in request!");
  }

  // check if user already exists
  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) throw new APIError(409, "user already available against provided email or username");

  // check for images, check for avatar
  const avatar_local_path = req.files?.avatar[0]?.path;
  const coverImage_local_path = req.files?.coverImage[0]?.path;

  if (!avatar_local_path) throw new APIError(STATUS_CODE.BAD_REQUEST, "avatar file is required!");

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatar_local_path);
  const coverImage = await uploadOnCloudinary(coverImage_local_path);

  if (!avatar) throw new APIError(STATUS_CODE.BAD_REQUEST, "avatar file is required!");

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
  if (!created) throw new APIError(STATUS_CODE.INTERNAL_SERVER_ERROR, "something went wrong, during user registration!");

  // return response
  return res.status(STATUS_CODE.CREATED).json(new APIResponse(STATUS_CODE.CREATED, created, "user registered successfully!"));
});

// * LOGIN USER API
const login = async_handler(async (req, res) => {

  // get details from body
  const { username, email, password } = req.body;

  // username or email validation
  if (!(username || email))
    throw new APIError(STATUS_CODE.BAD_REQUEST, "username or email is required!");

  // find the user
  const user = await User.findOne(
    {
      $or: [{ username }, { email }]
    }
  );

  // validate user
  if (!user) throw new APIError(STATUS_CODE.NOT_FOUND, "no user found against the provided request!");

  // validate password
  const passwordValidation = await user.isPasswordCorrect(password);
  if (!passwordValidation) throw new APIError(STATUS_CODE.BAD_REQUEST, "password is not matched!");

  // creating access and refresh token
  const { refreshToken, accessToken } = await createAccessAndRefreshToken(user._id);

  // creating object for response
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // creating options for http cookie security
  const options = OPTIONS;

  // return response
  return res
    .status(STATUS_CODE.OK)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        STATUS_CODE.OK,
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
    .status(STATUS_CODE.OK)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new APIResponse(
        STATUS_CODE.OK,
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
    if (!inRefreshToken) throw new APIError(STATUS_CODE.UNAUTHORIZED, "unauthorized request");

    // decode token
    const decoded = jwt.verify(inRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // finding user with decoded token
    const user = await User.findById(decoded?._id);

    // validating fetched user
    if (!user) throw new APIError(STATUS_CODE.NOT_FOUND, "no user available!");

    // comparing & validating user refreshToken with requested token
    if (inRefreshToken !== user?.refreshToken) throw new APIError(STATUS_CODE.UNAUTHORIZED, "refresh token is expired or used!");

    // extracting options for security of headers & cookies
    const options = OPTIONS;

    // extracting accessToken and refreshToken
    const { newRefreshToken, accessToken } = await createAccessAndRefreshToken(user._id);

    // returning response
    return res
      .status(STATUS_CODE.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new APIResponse(
          STATUS_CODE.OK,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "access token refreshed!"
        )
      )
  } catch (error) {
    throw new APIError(
      STATUS_CODE.UNAUTHORIZED,
      error?.message || "invalid refresh token!"
    )
  }

});

// * CHANGE PASSWORD
const changePassword = async_handler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);

  if (!isPasswordCorrect) throw new APIError(STATUS_CODE.BAD_REQUEST, "old password is not matched!");

  user.password = newpassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(STATUS_CODE.OK)
    .json(
      new APIResponse(
        STATUS_CODE.OK,
        {},
        "password changed successfully!"
      )
    );
});

// * GETTING CURRENT USER
const currentUser = async_handler(async (req, res) => {
  return res
    .status(200)
    .json(
      new APIResponse(
        STATUS_CODE.OK,
        req.user,
        "requested user fetched successfully!"
      )
    );
});

// * UPDATE ACCOUNT FIELDS
const edit = async_handler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!(fullname && email)) throw new APIError(STATUS_CODE.NOT_FOUND, "please provided all requested data!");

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set:
      {
        fullname,
        email
      }
    },
    {
      new: true
    }
  ).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(
      new APIResponse(
        STATUS_CODE.CREATED,
        user,
        "data updated successfully!"
      )
    );
});

// * UPDATE AVATAR
const avatarUpdate = async_handler(async (req, res) => {

  const avatarPath = req.file?.path;

  if (!avatarPath) throw new APIError(STATUS_CODE.NOT_FOUND, "path is invalid or not provided correctly!");

  // TODO: delete avatar
  const user = await User.findById(req.user?._id);
  await removeFromCloudinary(user.avatar, avatarPath);

  const avatar = await uploadOnCloudinary(avatarPath);

  if (!avatar) throw new APIError(STATUS_CODE.BAD_REQUEST, "something went wrong during upload of avatar!");

  user.avatar = avatar.url;

  await user.save({ validateBeforeSave: false });

  const responseUser = {
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar,
    coverImage: user.coverImage
  }

  return res
    .status(201)
    .json(
      new APIResponse
        (
          STATUS_CODE.CREATED,
          responseUser,
          "avatar updated successfully!"
        )
    )
});

// * UPDATE COVER IMAGE
const coverImageUpdate = async_handler(async (req, res) => {

  const coverImagePath = req.file?.path;

  if (!coverImagePath) throw new APIError(STATUS_CODE.NOT_FOUND, "path is invalid or not provided correctly!");

  // TODO: delete cover image
  const user = await User.findById(req.user?._id);
  await removeFromCloudinary(user.coverImage, coverImagePath);

  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!coverImage) throw new APIError(STATUS_CODE.BAD_REQUEST, "something went wrong during upload of coverImage!");

  user.coverImage = coverImage.url;

  await user.save({ validateBeforeSave: false });

  const responseUser = {
    id: user._id,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar,
    coverImage: user.coverImage
  }

  return res
    .status(201)
    .json(
      new APIResponse
        (
          STATUS_CODE.CREATED,
          responseUser,
          "coverImage updated successfully!"
        )
    )
});

// * GET USER CHANNEL PROFILE DETALS
const userChannelProfile = async_handler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new APIError(STATUS_CODE.BAD_REQUEST, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1

      }
    }
  ])

  if (!channel?.length) {
    throw new APIError(STATUS_CODE.NOT_FOUND, "channel does not exists")
  }

  return res
    .status(200)
    .json(
      new APIResponse(STATUS_CODE.OK, channel[0], "user channel fetched successfully")
    )
});

// * USER'S WATCH HISTORY
const watchHistory = async_handler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res
    .status(200)
    .json(
      new APIResponse(
        STATUS_CODE.OK,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    )
});

export {
  register,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  currentUser,
  edit,
  avatarUpdate,
  coverImageUpdate,
  userChannelProfile,
  watchHistory
}