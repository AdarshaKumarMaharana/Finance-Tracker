import express from "express";
import {
  getCategories,
  addCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getCategories);
router.post("/", protect, addCategory);

export default router;
