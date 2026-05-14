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
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
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
    setVerifying(true);

    try {
      const { data } = await axios.post("/api/user/verifyotp", {
        email,
        otp: otp.replace(/\s/g, ""),
      });

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success("Account verified successfully!");
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
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
      setResending(false);
    }
  };

  const formWrapper = "flex flex-col gap-2 w-full p-6";
  const inputClass = "border border-gray-300 rounded-lg w-full p-3 bg-white text-gray-900 placeholder-gray-500 outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";
  const buttonPrimary = "bg-blue-600 hover:bg-blue-700 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-lg">
      {step === 0 ? (
        <form onSubmit={handleRegister} className={formWrapper}>
          <p className="text-2xl font-bold text-center mb-6 text-gray-800">
            Create Account
          </p>

          <div className="space-y-4 w-full">
            <div className="w-full">
              <p className="font-medium text-gray-700 mb-2 text-sm">Full Name</p>
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
              <p className="font-medium text-gray-700 mb-2 text-sm">Email</p>
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
              <p className="font-medium text-gray-700 mb-2 text-sm">Password</p>
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
              <p className="font-medium text-gray-700 mb-2 text-sm">Confirm Password</p>
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
            <Link to="/login" className="text-gray-600 text-sm">
              Already have an account?{" "}
              <span className="text-blue-600 cursor-pointer font-medium hover:underline">
                Sign in
              </span>
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className={formWrapper}>
          <p className="text-2xl font-bold text-center mb-2 text-gray-800">
            Verify Email
          </p>

          <p className="text-gray-600 text-center mb-6 text-sm">
            We've sent a 6-digit OTP to <strong className="text-gray-800">{email}</strong>
          </p>

          <div className="w-full">
            <p className="font-medium text-gray-700 mb-2 text-sm">OTP Code</p>
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
            disabled={verifying || resending || otp.length !== 6}
            className={`${buttonPrimary} mt-6`}
          >
            {verifying ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="flex flex-col gap-3 mt-4 w-full">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={verifying || resending}
              className="bg-blue-500 hover:bg-blue-600 transition-all text-white w-full py-3 rounded-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium transition-colors text-center"
            >
              Back to Registration
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            OTP will expire in 5 minutes.
          </p>
        </form>
      )}
    </div>
  );
};

export default Register;