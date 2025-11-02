import express from "express";
import {
  getPublishedImages,
  getUser,
  loginUser,
  registerUser,
  verifyOtp
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/data", protect, getUser);
userRouter.get("/published-images", getPublishedImages);
userRouter.get("/verifyOtp", verifyOtp);
export default userRouter;
