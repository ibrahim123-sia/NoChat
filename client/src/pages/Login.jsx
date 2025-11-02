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

  const formWrapper = "flex flex-col gap-4 w-full max-w-md p-8 text-gray-100";
  const inputClass = "border border-purple-400/40 rounded-xl w-full p-4 bg-purple-900/30 text-white placeholder-purple-300/60 outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/60 transition-all duration-300 backdrop-blur-sm";
  const buttonPrimary = "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-white w-full py-4 rounded-xl cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/20";
  const linkBtn = "text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors";

  return (
    <div className="w-full">
      {resetStep === 0 ? (
        <form onSubmit={handleSubmit} className={formWrapper}>
          <div className="text-center mb-8">
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Welcome Back
            </p>
            <p className="text-purple-200/80 mt-2">Sign in to your AI assistant</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="font-medium text-purple-200 mb-2 block">Email</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder="Enter your email"
                className={inputClass}
                type="email"
                required
              />
            </div>
            <div>
              <label className="font-medium text-purple-200 mb-2 block">Password</label>
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

          <button type="submit" disabled={loading} className={`${buttonPrimary} mt-8`}>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-purple-200">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-300 hover:text-purple-200 font-semibold underline underline-offset-2 transition-colors">
                Create account
              </Link>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setResetStep(1)}
            className={`${linkBtn} text-center mt-4 py-3 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-colors`}
          >
            Forgot Password?
          </button>
        </form>
      ) : resetStep === 1 ? (
        <form onSubmit={handleSendOtp} className={formWrapper}>
          <div className="text-center mb-8">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Reset Password
            </p>
            <p className="text-purple-200/80 mt-2">Enter your email to receive OTP</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="font-medium text-purple-200 mb-2 block">Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className={inputClass}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <button type="submit" className={`${buttonPrimary} mt-8`} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
          
          <button
            type="button"
            onClick={() => setResetStep(0)}
            className={`${linkBtn} text-center mt-4 py-3 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-colors`}
          >
            Back to Login
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset} className={formWrapper}>
          <div className="text-center mb-8">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Reset Password
            </p>
            <p className="text-purple-200/80 mt-2">Enter OTP and new password</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="font-medium text-purple-200 mb-2 block">OTP</label>
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
            <div>
              <label className="font-medium text-purple-200 mb-2 block">New Password</label>
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
            <div>
              <label className="font-medium text-purple-200 mb-2 block">Confirm Password</label>
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
          
          <button type="submit" className={`${buttonPrimary} mt-8`} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className={`${linkBtn} text-center mt-4 py-3 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-colors`}
          >
            Back to Email
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;