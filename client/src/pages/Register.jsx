import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const { axios, setToken } = useAppContext();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/user/register", {
        name,
        email,
        password,
      });

      if (data.success) {
        toast.success("OTP sent to your email!");
        setStep(1);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post("/api/user/verifyotp", {
        email,
        otp: otp.replace(/\s/g, ""),
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success("Account verified successfully!");
        navigate('/chatbot')
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/user/resendotp", { email });

      if (data.success) {
        toast.success("New OTP sent to your email!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };
   const formWrapper = "flex flex-col gap-2 w-full p-6 text-gray-100";
  const inputClass = "border border-purple-400/50 rounded-lg w-full p-3 bg-purple-900/30 text-white placeholder-gray-400 outline-purple-400 focus:ring-2 focus:ring-purple-400 transition-all text-sm text-center";
  const buttonPrimary = "bg-purple-600 hover:bg-purple-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/90 to-purple-800/80 rounded-2xl border border-purple-300/30 shadow-2xl backdrop-blur-sm">
      {step === 0 ? (
        <form onSubmit={handleRegister} className={formWrapper}>
          <p className="text-2xl font-bold text-center mb-6 text-purple-300">
            Create Account
          </p>

          <div className="space-y-4 w-full">
            <div className="w-full">
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">Full Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                placeholder="Enter your full name"
                className={inputClass}
                type="text"
                required
                minLength={2}
              />
            </div>

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
                minLength={6}
              />
            </div>

            <div className="w-full">
              <p className="font-medium text-purple-200 mb-2 text-sm text-center">Confirm Password</p>
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                placeholder="Confirm your password"
                className={inputClass}
                type="password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`${buttonPrimary} mt-6`}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-purple-200 text-sm">
              Already have an account?{" "}
              <span className="text-purple-300 cursor-pointer font-medium hover:underline">
                Sign in
              </span>
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className={formWrapper}>
          <p className="text-2xl font-bold text-center mb-2 text-purple-300">
            Verify Email
          </p>

          <p className="text-purple-200 text-center mb-6 text-sm">
            We've sent a 6-digit OTP to <strong className="text-purple-300">{email}</strong>
          </p>

          <div className="w-full">
            <p className="font-medium text-purple-200 mb-2 text-sm text-center">OTP Code</p>
            <input
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              value={otp}
              placeholder="Enter 6-digit OTP"
              className={inputClass}
              type="text"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className={`${buttonPrimary} mt-6`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="flex flex-col gap-3 mt-4 w-full">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="bg-purple-700 hover:bg-purple-800 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors text-center"
            >
              Back to Registration
            </button>
          </div>

          <p className="text-xs text-purple-300 text-center mt-6">
            OTP will expire in 5 minutes.
          </p>
        </form>
      )}
    </div>
  );
};