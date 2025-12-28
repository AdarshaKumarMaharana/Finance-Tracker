import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js"; // tumhara wahi protect
import express from "express";
const router = express.Router();

// Ye dono protected hain → protect middleware use karo
router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, updateProfile);

export default router;
