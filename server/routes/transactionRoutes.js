import express from "express";
import { getDashboardSummary } from "../controllers/transactionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);

export default router;
