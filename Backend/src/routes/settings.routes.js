import express from "express";
import {
  saveGrokApiKey,
  removeGrokApiKey,
  getSettingsStatus,
} from "../controllers/settingsController.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/status", authMiddleware, getSettingsStatus);
router.post("/save-grok-key", authMiddleware, saveGrokApiKey);
router.delete("/remove-grok-key", authMiddleware, removeGrokApiKey);

export default router;