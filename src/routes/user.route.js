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
  coverImageUpdate
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

router.route("/avatar").post([verifyJWT, upload.single("avatar")], avatarUpdate);
router.route("/cover-image").post([verifyJWT, upload.single("coverImage")], coverImageUpdate);

router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/edit").post(verifyJWT, edit);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").post(verifyJWT, currentUser);


export default router;