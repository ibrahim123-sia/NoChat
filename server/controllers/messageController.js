// Text-Based AI chat message controller
import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imageKit from "../configs/imageKit.js";
import openai from "../configs/openai.js";
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // check credits
    if (req.user.credit < 1) {
      return res.json({
        success: false,
        message: "You dont have enough credit to use this feature",
      });
    }
    const { chatId, prompt } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const { choices } = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };
    res.json({ success: true, reply });
    chat.messages.push(reply);
    await chat.save();

    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// image generation message controller

export const imageMessageController = async function (req, res) {
  try {
    const userId = req.user._id;
    // check credits
    if (req.user.credit < 2) {
      return res.json({
        success: false,
        message: "You dont have enough credit to use this feature",
      });
    }
    const { prompt, chatId, isPublished } = req.body;

    // find chaats
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

    // contruct image kit ai generation URL
    const generatedImageUrl = `${
      process.env.IMAGEKIT_URL_ENDPOINT
    }/ik-genimg-prompt-${encodedPrompt}/nochat/${Date.now()}.png?tr=w-800,h-800`;

    // trigger generatio by fetching from imagekit
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
    res.json({ success: false, message: error.message });
  }
};
