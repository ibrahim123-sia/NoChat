import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js";
import nodemailer from "nodemailer";
import User from "../models/User.js";

// otp codes here

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: "Too many OTP requests from this IP, please try again later",
  skipSuccessfulRequests: true,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// otp code end here

// generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists?.isVerified) {
      return res.status(409).json({
        success: false,
        message: "User already exist,Please login",
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    if (userExists) {
      userExists.name = name;
      userExists.password = password;
      userExists.otp = otp;
      userExists.otpExpires = otpExpires;
      await userExists.save();
    } else {
      const user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpires,
      });
      await user.save();
    }

    try {
      await transporter.sendMail({
        from: `"NoChat" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Welcome to Our App!</h2>
            <p>Hello ${name},</p>
            <p>Your OTP verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="margin: 0; color: #2c3e50; letter-spacing: 5px; font-size: 28px;">${otp}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p style="font-size: 12px; color: #7f8c8d;">
              If you didn't request this code, please ignore this email or contact support.
            </p>
          </div>
        `,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please check your inbox.",
      });
    } catch (emailError) {
      if (!userExists) {
        await User.deleteOne({ email });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const cleanOtp = otp?.toString().replace(/\s/g, '');

  if (!email || !cleanOtp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
      received: { email, otp: cleanOtp },
    });
  }

  try {
    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified. Please login.",
      });
    }

    if (!user.otp || user.otp !== cleanOtp) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP code" 
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      message: "Account verified successfully!",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
// API to login

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }

    return res.json({ success: false, message: "invalid email and password" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to get user

export const getUser = async (req, res) => {
  try {
    const user = req.user;
    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to get publish images

export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true,
        },
      },
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName",
        },
      },
    ]);

    res.json({ success: true, images: publishedImageMessages.reverse() });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
