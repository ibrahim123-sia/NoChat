import React, { memo, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import moment from "moment";
import Markdown from "react-markdown";
import Prism from "prismjs";

const MessageInner = ({ message }) => {
  const ref = useRef(null);
  useEffect(() => {
    // Only run Prism on this message's DOM subtree (not the whole page) and
    // only for assistant text messages that may contain code blocks.
    if (message.role === "assistant" && !message.isImage && ref.current) {
      Prism.highlightAllUnder(ref.current);
    }
  }, [message.content, message.role, message.isImage]);

  return (
    <div ref={ref} className="w-full">
      {message.role === "user" ? (
        <div className="flex items-start justify-end my-3 sm:my-4 gap-2">
          <div
            className="flex flex-col gap-2 p-2 px-3 sm:px-4 bg-slate-50 dark:bg-[#57317C]/30
          border border-[#80609F]/30 rounded-md max-w-[80%] sm:max-w-2xl break-words"
          >
            <p className="text-sm dark:text-primary whitespace-pre-wrap break-words">{message.content}</p>
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <img src={assets.user_icon} alt="" className="w-7 sm:w-8 rounded-full shrink-0" />
        </div>
      ) : (
        <div
          className="flex flex-col gap-2 p-2 px-3 sm:px-4 max-w-[90%] sm:max-w-2xl bg-primary/20
        dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-3 sm:my-4 break-words overflow-x-auto"
        >
          {message.isImage ? (
            <img
              src={message.content}
              alt=""
              loading="lazy"
              className="w-full max-w-md mt-2 rounded-md"
            />
          ) : (
            <div className="text-sm dark:text-primary reset-tw break-words">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
            {moment(message.timestamp).fromNow()}
          </span>
        </div>
      )}
    </div>
  );
};

const Message = memo(MessageInner, (prev, next) =>
  prev.message.content === next.message.content &&
  prev.message.timestamp === next.message.timestamp
);

export default Message;
