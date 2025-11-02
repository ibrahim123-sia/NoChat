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

  const formWrapper = "flex flex-col gap-4 w-full max-w-md p-8 text-gray-100";
  const inputClass = "border border-purple-400/40 rounded-xl w-full p-4 bg-purple-900/30 text-white placeholder-purple-300/60 outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/60 transition-all duration-300 backdrop-blur-sm";
  const buttonPrimary = "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-white w-full py-4 rounded-xl cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/20";
  const buttonSecondary = "bg-purple-700/80 hover:bg-purple-800 transition-all duration-300 text-white w-full py-4 rounded-xl cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30";
  const linkBtn = "text-purple-300 hover:text-purple-200 cursor-pointer text-sm font-medium transition-colors";

  return (
    <div className="w-full">
      {step === 0 ? (
        <form onSubmit={handleRegister} className={formWrapper}>
          <div className="text-center mb-8">
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Create Account
            </p>
            <p className="text-purple-200/80 mt-2">Join our AI chatbot platform</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="font-medium text-purple-200 mb-2 block">Full Name</label>
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
                minLength={6}
              />
            </div>

            <div>
              <label className="font-medium text-purple-200 mb-2 block">Confirm Password</label>
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

          <button type="submit" disabled={loading} className={`${buttonPrimary} mt-8`}>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-purple-200">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-300 hover:text-purple-200 font-semibold underline underline-offset-2 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className={formWrapper}>
          <div className="text-center mb-8">
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Verify Email
            </p>
            <p className="text-purple-200 mt-4">
              We've sent a 6-digit OTP to <br />
              <strong className="text-purple-300 text-lg">{email}</strong>
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="font-medium text-purple-200 mb-2 block">OTP Code</label>
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
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className={`${buttonPrimary} mt-8`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : (
              "Verify OTP"
            )}
          </button>

          <div className="space-y-3 mt-4">
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
              className={`${linkBtn} text-center w-full py-3 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-colors`}
            >
              Back to Registration
            </button>
          </div>

          <p className="text-xs text-purple-300/80 text-center mt-6">
            OTP will expire in 5 minutes. Check your spam folder if you don't see the email.
          </p>
        </form>
      )}
    </div>
  );
};

export default Register;