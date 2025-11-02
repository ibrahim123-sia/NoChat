import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { axios, setToken } = useAppContext();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/user/forgetpassword", { email: resetEmail });
      if (data.success) {
        toast.success("OTP sent successfully");
        setResetStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await axios.post("/api/user/resetpassword", { 
        email: resetEmail, 
        otp: resetOtp, 
        newPassword 
      });
      if (data.success) {
        toast.success("Password reset successfully");
        setResetStep(0);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/user/login", { email, password });
      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        navigate('/')
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Styling constants with new theme (blue instead of purple)
  const formWrapper = "flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[400px] text-gray-600 rounded-xl shadow-lg border border-gray-100 bg-white";
  const inputClass = "border border-gray-300 rounded-lg w-full p-3 mt-1 outline-blue-500 focus:ring-2 focus:ring-blue-200 transition-all";
  const buttonPrimary = "bg-blue-600 hover:bg-blue-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const linkBtn = "text-blue-500 hover:text-blue-700 cursor-pointer text-sm font-medium transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {resetStep === 0 ? (
        <form onSubmit={handleSubmit} className={formWrapper}>
          <p className="text-3xl font-bold m-auto mb-6">
            <span className="text-blue-600">Welcome Back</span>
          </p>

          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Email</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              placeholder="Enter your email"
              className={inputClass}
              type="email"
              required
            />
          </div>
          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Password</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="Enter your password"
              className={inputClass}
              type="password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={buttonPrimary}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          
          <Link to="/register" className="w-full text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <span className="text-blue-600 cursor-pointer font-medium hover:underline">
                Create account
              </span>
            </p>
          </Link>
          
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className={linkBtn + " mt-2"}
          >
            Forgot Password?
          </button>
        </form>
      ) : resetStep === 1 ? (
        <form onSubmit={handleSendOtp} className={formWrapper}>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Reset Password
          </h2>
          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Email</p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={inputClass}
              placeholder="Enter your email"
              required
            />
          </div>
          <button type="submit" className={buttonPrimary} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
          <button
            type="button"
            onClick={() => setResetStep(0)}
            className={linkBtn}
          >
            Back to Login
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset} className={formWrapper}>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Reset Password
          </h2>
          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">OTP</p>
            <input
              type="text"
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              className={inputClass}
              placeholder="Enter 6-digit OTP"
              required
            />
          </div>
          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">New Password</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Confirm Password</p>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className={buttonPrimary} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className={linkBtn}
          >
            Back to Email
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;