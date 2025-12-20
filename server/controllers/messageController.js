// Text-Based AI chat message controller
import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imageKit from "../configs/imageKit.js";
import groq from "../configs/groq.js";

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
    if (!chat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }
    
    // Get the entire conversation history for context
    const conversationHistory = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the new user message to conversation history for API call
    conversationHistory.push({
      role: "user",
      content: prompt,
    });

    // Save user message to database
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Call GROQ API with updated model names
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Updated model name
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    });

    if (!completion.choices || !completion.choices[0]) {
      throw new Error("No response from AI model");
    }

    const reply = {
      role: "assistant",
      content: completion.choices[0].message.content,
      timestamp: Date.now(),
      isImage: false,
    };
    
    // Send response immediately
    res.json({ success: true, reply });
    
    // Save assistant reply to database
    chat.messages.push(reply);
    await chat.save();

    // Deduct credit
    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
    console.error("GROQ API Error:", error.message);
    
    // More specific error messages
    let errorMessage = error.message;
    if (error.message.includes("model")) {
      errorMessage = "AI model configuration error. Please try a different model.";
    } else if (error.message.includes("API key") || error.message.includes("authentication")) {
      errorMessage = "AI service authentication failed";
    } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
      errorMessage = "AI service is currently busy. Please try again later.";
    }
    
    res.json({ 
      success: false, 
      message: errorMessage 
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
    if (!chat) {
      return res.json({
        success: false,
        message: "Chat not found",
      });
    }
    
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
      timeout: 30000, // 30 second timeout
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
    console.error("Image Generation Error:", error.message);
    
    let errorMessage = error.message;
    if (error.message.includes("timeout")) {
      errorMessage = "Image generation timed out. Please try again.";
    } else if (error.message.includes("ENDPOINT")) {
      errorMessage = "Image service configuration error";
    }
    
    res.json({ 
      success: false, 
      message: errorMessage || "An error occurred while generating the image" 
    });
  }
};