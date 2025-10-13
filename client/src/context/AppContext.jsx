import { createContext, useContext, useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";
import { useState } from "react";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChat] = useState([]);
  const [selectedChats, setSelectedChats] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme" || "light"));

  const fetchUser = async () => {
    setUser(dummyUserData);
  };

  const fetchUserChats = async () => {
    setChat(dummyChats);
    setSelectedChats(dummyChats[0]);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
    else{
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchUserChats();
    } else {
      setChat([]);
      setSelectedChats(null);
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    navigate,
    user,
    setUser,
    chats,
    setChat,
    selectedChats,
    setSelectedChats,
    theme,
    fetchUser,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
