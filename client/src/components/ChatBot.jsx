import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Message from "./Message";
import toast from "react-hot-toast";
import chatbot from "../assets/c1.png";

const ChatBot = () => {
  const containRef = useRef(null);
  const { selectedChat, user, axios, token, setUser } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!user) return toast.error("Login to send message");

    const promptCopy = trimmed;
    setLoading(true);
    setPrompt("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
        isImage: false,
      },
    ]);

    try {
      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt: trimmed, isPublished },
        { headers: { Authorization: token } }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        if (mode === "image") {
          setUser((prev) => ({ ...prev, credits: prev.credits - 2 }));
        } else {
          setUser((prev) => ({ ...prev, credits: prev.credits - 1 }));
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error(error.message);
      setPrompt(promptCopy);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (containRef.current) {
      containRef.current.scrollTo({
        top: containRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  return (
    <div className="flex-1 flex flex-col justify-between px-3 sm:px-5 md:px-10 xl:px-30 py-3 sm:py-5 pt-14 md:pt-5 h-screen min-w-0 w-full">
      <div
        ref={containRef}
        className="flex-1 mb-3 sm:mb-5 overflow-y-auto overscroll-contain scroll-smooth pr-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img src={chatbot} alt="" className="w-28 sm:w-40 max-w-40" />
            <p className="mt-3 sm:mt-5 text-2xl sm:text-4xl md:text-6xl text-center text-gray-400 dark:text-white">
              Ask me Anything
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {loading && (
          <div className="loader flex items-center gap-1.5 my-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
          </div>
        )}
      </div>

      {mode === "image" && (
        <label className="inline-flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm mx-auto">
          <p>Publish Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30
      rounded-full w-full max-w-2xl p-2 sm:p-3 pl-3 sm:pl-4 mx-auto flex gap-2 sm:gap-4 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-xs sm:text-sm pl-1 sm:pl-3 pr-1 sm:pr-2 outline-none bg-transparent shrink-0"
        >
          <option value="text" className="dark:bg-purple-900">
            Text
          </option>
          <option value="image" className="dark:bg-purple-900">
            Image
          </option>
        </select>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          type="text"
          placeholder="Type your prompt..."
          required
          className="flex-1 w-full text-sm outline-none bg-transparent min-w-0"
        />
        <button disabled={loading} type="submit" className="shrink-0">
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className="w-7 sm:w-8 cursor-pointer"
            alt=""
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
