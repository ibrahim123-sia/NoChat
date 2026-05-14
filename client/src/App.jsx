import React, { useState } from "react";
import SideBar from "./components/SideBar";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ChatBox from "./components/ChatBot";
import Credits from "./pages/Credits";
import Community from "./pages/Community";
import { assets } from "./assets/assets";
import "./assets/prism.css";
import Loading from "./pages/Loading";
import { useAppContext } from "./context/AppContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { user, loadingUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  if (pathname === "/loading" || loadingUser) return <Loading />;

  return (
    <>
      <Toaster />
      {user && !isMenuOpen && (
        <img
          src={assets.menu_icon}
          alt="Open menu"
          className="fixed top-3 left-3 w-8 h-8 cursor-pointer
          md:hidden not-dark:invert z-30 p-1 rounded bg-white/70 dark:bg-black/50 backdrop-blur"
          onClick={() => setIsMenuOpen(true)}
        />
      )}

      {user ? (
        <div className="dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white">
          <div className="flex h-screen w-screen overflow-hidden">
            <SideBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Routes>
              <Route path="/" element={<ChatBox />}></Route>
              <Route path="/credits" element={<Credits />}></Route>
              <Route path="/community" element={<Community />}></Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="w-full max-w-md mx-auto">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </>
  );
};

export default App;