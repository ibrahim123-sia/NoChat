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
      const { data } = await axios.post("/api/user/forgetpassword", {
        email: resetEmail,
      });
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
        newPassword,
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
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

   const formWrapper = "flex flex-col gap-4 w-full p-8 text-gray-100";
  const inputClass = "border border-purple-400/50 rounded-lg w-full p-3 bg-purple-900/30 text-white placeholder-gray-400 outline-purple-400 focus:ring-2 focus:ring-purple-400 transition-all text-sm text-center";
  const buttonPrimary = "bg-purple-600 hover:bg-purple-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/90 to-purple-800/80 rounded-2xl border border-purple-300/30 shadow-2xl backdrop-blur-sm">
      {resetStep === 0 ? (
        <form onSubmit={handleSubmit} className={formWrapper}>
          <p className="text-2xl font-bold text-center mb-6 text-purple-300">
            Welcome Back
          </p>

          <div className="space-y-4 w-full">
            <div className="w-full">
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">Email</p>
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
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                placeholder="Enter your password"
                className={inputClass}
                type="password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`${buttonPrimary} mt-6`}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center mt-4">
            <Link to="/register" className="text-purple-200 text-sm">
              Don't have an account?{" "}
              <span className="text-purple-300 cursor-pointer font-medium hover:underline">
                Create account
              </span>
            </Link>
          </div>

          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => setResetStep(1)}
              className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      ) : resetStep === 1 ? (
        <form onSubmit={handleSendOtp} className={formWrapper}>
          <h2 className="text-xl font-bold text-center mb-6 text-purple-300">
            Reset Password
          </h2>
          <div className="w-full">
            <p className="font-medium text-purple-200 mb-2 text-sm text-center">Email</p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={inputClass}
              placeholder="Enter your email"
              required
            />
          </div>
          <button type="submit" className={`${buttonPrimary} mt-6`} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setResetStep(0)}
              className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset} className={formWrapper}>
          <h2 className="text-xl font-bold text-center mb-6 text-purple-300">
            Reset Password
          </h2>
          <div className="space-y-4 w-full">
            <div className="w-full">
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">OTP</p>
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
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">New Password</p>
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
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">Confirm Password</p>
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
          </div>
          <button type="submit" className={`${buttonPrimary} mt-6`} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setResetStep(1)}
              className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors"
            >
              Back to Email
            </button>
          </div>
        </form>
      )}
    </div>
  );
};