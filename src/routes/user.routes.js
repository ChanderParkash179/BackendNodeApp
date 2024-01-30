import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
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
} from '../controllers/user.controller.js';

const router = Router();

router.route("/register").post(
  upload.fields(
    [
      {
        name: "avatar",
        maxCount: 1
      },
      {
        name: "coverImage",
        maxCount: 1
      }
    ]
  ),
  register
);

router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-user").post(verifyJWT, currentUser);

router.route("/current-user").get(verifyJWT, currentUser);
router.route("/channel/:username").get(verifyJWT, userChannelProfile);
router.route("/history").get(verifyJWT, watchHistory);

router.route("/edit").patch(verifyJWT, edit);
router.route("/avatar").patch([verifyJWT, upload.single("avatar")], avatarUpdate);
router.route("/cover-image").patch([verifyJWT, upload.single("coverImage")], coverImageUpdate);

export default router;