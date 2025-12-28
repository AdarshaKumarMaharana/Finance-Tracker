import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Register
export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, profileImageUrl } = req.body;

    // 1️⃣ Validation
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Firstname, lastname, email and password are required",
      });
    }

    const emailLower = email.toLowerCase();

    // 2️⃣ Check existing email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [emailLower]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // 3️⃣ Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Insert user
    const [result] = await pool.query(
      `INSERT INTO users 
       (firstname, lastname, email, password, profile_image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        firstname,
        lastname,
        emailLower,
        hashedPassword,
        profileImageUrl || null,
        true,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const emailLower = email.toLowerCase();

    // 2️⃣ Find user
    const [users] = await pool.query(
      `SELECT id, firstname, lastname, email, password,
              profile_image_url, is_active, created_at
       FROM users WHERE email = ?`,
      [emailLower]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not registered",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // 3️⃣ Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    // 4️⃣ JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5️⃣ Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profileImageUrl: user.profile_image_url,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
