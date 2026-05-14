// Text-Based AI chat message controller
import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imageKit from "../configs/imageKit.js";
import groq from "../configs/groq.js";

// Limit how many prior messages we send to the model. Sending the full chat
// every time makes responses slower and burns tokens — the last ~12 turns
// is plenty of context for a chatbot.
const HISTORY_LIMIT = 12;

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credit to use this feature",
      });
    }

    const { chatId, prompt } = req.body;

    // Use lean() — we only need the messages array as plain JS, no Mongoose doc
    // overhead. We'll write back with a separate $push, which is faster than
    // loading + mutating + .save() on the entire document.
    const chat = await Chat.findOne({ userId, _id: chatId }, { messages: 1 }).lean();
    if (!chat) {
      return res.json({ success: false, message: "Chat not found" });
    }

    const recentHistory = chat.messages
      .slice(-HISTORY_LIMIT)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    recentHistory.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: recentHistory,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    });

    if (!completion.choices || !completion.choices[0]) {
      throw new Error("No response from AI model");
    }

    const now = Date.now();
    const userMsg = { role: "user", content: prompt, timestamp: now, isImage: false };
    const reply = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: now + 1,
      isImage: false,
    };

    // Respond to the client FIRST so the UI updates instantly. Persist after.
    res.json({ success: true, reply });

    // Fire-and-forget DB writes (in parallel) — user is already seeing the reply.
    Promise.all([
      Chat.updateOne({ _id: chatId, userId }, { $push: { messages: { $each: [userMsg, reply] } } }),
      User.updateOne({ _id: userId }, { $inc: { credits: -1 } }),
    ]).catch((err) => console.error("Post-response persistence error:", err));
  } catch (error) {
    console.error("GROQ API Error:", error.message);

    let errorMessage = error.message;
    if (error.message.includes("model")) {
      errorMessage = "AI model configuration error. Please try a different model.";
    } else if (error.message.includes("API key") || error.message.includes("authentication")) {
      errorMessage = "AI service authentication failed";
    } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
      errorMessage = "AI service is currently busy. Please try again later.";
    }

    if (!res.headersSent) {
      res.json({ success: false, message: errorMessage });
    }
  }
};

// image generation message controller
export const imageMessageController = async function (req, res) {
  try {
    const userId = req.user._id;

    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credit to use this feature",
      });
    }

    const { prompt, chatId, isPublished } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId }, { _id: 1 }).lean();
    if (!chat) {
      return res.json({ success: false, message: "Chat not found" });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const generatedImageUrl = `${
      process.env.IMAGEKIT_URL_ENDPOINT
    }/ik-genimg-prompt-${encodedPrompt}/nochat/${Date.now()}.png?tr=w-800,h-800`;

    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    const uploadResponse = await imageKit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "nochat",
    });

    const now = Date.now();
    const userMsg = { role: "user", content: prompt, timestamp: now, isImage: false };
    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: now + 1,
      isImage: true,
      isPublished: !!isPublished,
    };

    res.json({ success: true, reply });

    Promise.all([
      Chat.updateOne({ _id: chatId, userId }, { $push: { messages: { $each: [userMsg, reply] } } }),
      User.updateOne({ _id: userId }, { $inc: { credits: -2 } }),
    ]).catch((err) => console.error("Post-response persistence error:", err));
  } catch (error) {
    console.error("Image Generation Error:", error.message);

    let errorMessage = error.message;
    if (error.message.includes("timeout")) {
      errorMessage = "Image generation timed out. Please try again.";
    } else if (error.message.includes("ENDPOINT")) {
      errorMessage = "Image service configuration error";
    }

    if (!res.headersSent) {
      res.json({
        success: false,
        message: errorMessage || "An error occurred while generating the image",
      });
    }
  }
};
