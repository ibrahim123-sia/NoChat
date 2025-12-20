// Text-Based AI chat message controller
import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imageKit from "../configs/imageKit.js";
import groq from "../configs/groq.js"; // Make sure to update your config import

export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // check credits
    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "You don't have enough credit to use this feature",
      });
    }
    
    const { chatId, prompt } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });
    
    // Get the entire conversation history for context
    const conversationHistory = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the new user message
    conversationHistory.push({
      role: "user",
      content: prompt,
    });

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Call GROQ API
    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768", // You can use other GROQ models like "llama2-70b-4096", "gemma2-9b-it", etc.
      messages: conversationHistory, // Send full conversation history for context
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
      isImage: false,
    };
    
    res.json({ success: true, reply });
    
    chat.messages.push(reply);
    await chat.save();

    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
    console.error("GROQ API Error:", error);
    res.json({ 
      success: false, 
      message: error.message || "An error occurred while processing your request" 
    });
  }
};

// image generation message controller
export const imageMessageController = async function (req, res) {
  try {
    const userId = req.user._id;
    
    // check credits
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credit to use this feature",
      });
    }
    
    const { prompt, chatId, isPublished } = req.body;

    // find chats
    const chat = await Chat.findOne({ userId, _id: chatId });
    
    // push user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // encode the prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // construct image kit ai generation URL
    const generatedImageUrl = `${
      process.env.IMAGEKIT_URL_ENDPOINT
    }/ik-genimg-prompt-${encodedPrompt}/nochat/${Date.now()}.png?tr=w-800,h-800`;

    // trigger generation by fetching from imagekit
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // convert to base64
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    // upload to image kit media library
    const uploadResponse = await imageKit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "nochat",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };
    
    res.json({ success: true, reply });

    chat.messages.push(reply);
    await chat.save();
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
  } catch (error) {
    console.error("Image Generation Error:", error);
    res.json({ 
      success: false, 
      message: error.message || "An error occurred while generating the image" 
    });
  }
};