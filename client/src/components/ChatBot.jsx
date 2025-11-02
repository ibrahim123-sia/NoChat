import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Message from "./Message";
import toast from "react-hot-toast";
import chatbot from "../assets/c1.png";

const ChatBot = () => {
  const containRef = useRef(null);
  const { selectedChat, theme, user, axios, token, setUser } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast.error("Login to send message");

      setLoading(true);
      const promptCopy = prompt;
      setPrompt("");
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: prompt,
          timestamp: Date.now(),
          isImage: false,
        },
      ]);
      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt, isPublished },
        { headers: { Authorization: token } }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        // decrease credit
        if (mode === "image") {
          setUser((prev) => ({ ...prev, credits: prev.credits - 2 }));
        } else {
          setUser((prev) => ({ ...prev, credits: prev.credits - 1 }));
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPrompt("");
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
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col justify-between max-md:m-2 md:m-5 lg:m-10 xl:mx-30 max-md:mt-4 2xl:pr-40">
      <div ref={containRef} className="flex-1 max-md:mb-3 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary max-md:py-4">
            <img 
              src={chatbot} 
              alt="" 
              className="w-full max-md:max-w-20 sm:max-w-32 md:max-w-40" 
            />
            <p className="mt-2 max-md:text-xl md:text-4xl lg:text-6xl text-center text-gray-400 dark:text-white">
              Ask me Anything
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {/* Loading Animation */}
        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
          </div>
        )}
      </div>

      {mode === "image" && (
        <label className="inline-flex items-center gap-2 max-md:mb-2 mb-3 text-sm mx-auto max-md:text-xs">
          <p className="max-md:text-xs">Published Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/*prompt input  */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583C79]/30 border-primary dark:border-[#80609F]/30
      rounded-full w-full max-w-2xl p-2 max-md:p-1.5 max-md:pl-3 pl-4 mx-auto flex gap-3 max-md:gap-2 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-sm max-md:text-xs pl-2 max-md:pl-1 pr-1 outline-none bg-transparent"
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
          placeholder="Type your prompt here..."
          required
          className="flex-1 w-full text-sm max-md:text-xs outline-none bg-transparent"
        />
        <button disabled={loading} className="max-md:pr-1">
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className="w-7 max-md:w-6 cursor-pointer"
            alt=""
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBot;