import userModel from "../models/user.model.js";
import { encrypt } from "../utils/encryption.js";

/*
    Save Groq / AI API Key
*/
export const saveGrokApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid API key is required",
      });
    }

    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const encryptedKey = encrypt(apiKey.trim());
    user.grokApiKey = encryptedKey;
    await user.save();

    res.status(200).json({
      success: true,
      message: "API key saved and encrypted successfully",
      hasCustomKey: true,
    });
  } catch (error) {
    console.error("Save API Key Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving API key",
    });
  }
};

/*
    Remove Groq / AI API Key
*/
export const removeGrokApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.grokApiKey = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Custom API key removed. Using system default engine.",
      hasCustomKey: false,
    });
  } catch (error) {
    console.error("Remove API Key Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing API key",
    });
  }
};

/*
    Get System & Settings Status
*/
export const getSettingsStatus = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    res.status(200).json({
      success: true,
      hasCustomKey: !!user?.grokApiKey,
      systemAiActive: !!process.env.GOOGLE_GENAI_API_KEY,
      ocrEngine: "Tesseract.js + PDF.js",
      mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings status",
    });
  }
};