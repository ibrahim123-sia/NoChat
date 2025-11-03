import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } 
   
    else if (req.headers.authorization) {
      token = req.headers.authorization;
    }

    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    try {
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found",
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      // Specific JWT errors
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Not authorized, invalid token",
        });
      } else if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token expired",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token failed",
        });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};