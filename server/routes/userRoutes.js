import express from "express";
import {
  forgetPassword,
  getPublishedImages,
  getUser,
  loginUser,
  registerUser,
  resetPassword,
  verifyOtp,
  resentOtp
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/data", protect, getUser);
userRouter.get("/published-images", getPublishedImages);
userRouter.post("/verifyotp", verifyOtp);
userRouter.post("/resendotp", resentOtp);
userRouter.post("/forgetpassword", forgetPassword);
userRouter.post("/resetpassword", resetPassword);

export default userRouter;
