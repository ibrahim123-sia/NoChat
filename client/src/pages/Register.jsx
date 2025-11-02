import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0); // 0: registration, 1: OTP verification
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
      const { data } = await axios.post("/api/user/verify-otp", {
        email,
        otp: otp.replace(/\s/g, ""),
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success("Account verified successfully!");
        navigate('/')
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
      const { data } = await axios.post("/api/user/resend-otp", { email });

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

  // Styling constants with blue theme (same as login)
  const formWrapper =
    "flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[400px] text-gray-600 rounded-xl shadow-lg border border-gray-100 bg-white";
  const inputClass =
    "border border-gray-300 rounded-lg w-full p-3 mt-1 outline-blue-500 focus:ring-2 focus:ring-blue-200 transition-all";
  const buttonPrimary =
    "bg-blue-600 hover:bg-blue-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonSecondary =
    "bg-gray-600 hover:bg-gray-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const linkBtn =
    "text-blue-500 hover:text-blue-700 cursor-pointer text-sm font-medium transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {step === 0 ? (
        // Registration Form
        <form onSubmit={handleRegister} className={formWrapper}>
          <p className="text-3xl font-bold m-auto mb-6">
            <span className="text-blue-600">Create Account</span>
          </p>

          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Full Name</p>
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
              minLength={6}
            />
          </div>

          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">Confirm Password</p>
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

          <button type="submit" disabled={loading} className={buttonPrimary}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <Link to="/login" className="w-full text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <span className="text-blue-600 cursor-pointer font-medium hover:underline">
                Sign in
              </span>
            </p>
          </Link>
        </form>
      ) : (
        // OTP Verification Form
        <form onSubmit={handleVerifyOtp} className={formWrapper}>
          <p className="text-3xl font-bold m-auto mb-2 text-center">
            <span className="text-blue-600">Verify Email</span>
          </p>

          <p className="text-gray-600 text-center mb-6">
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </p>

          <div className="w-full">
            <p className="font-medium text-gray-700 mb-1">OTP Code</p>
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
            className={buttonPrimary}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className={buttonSecondary}
            >
              {loading ? "Sending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep(0)}
              className={linkBtn + " text-center"}
            >
              Back to Registration
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            OTP will expire in 5 minutes. Check your spam folder if you don't
            see the email.
          </p>
        </form>
      )}
    </div>
  );
};

export default Register;
