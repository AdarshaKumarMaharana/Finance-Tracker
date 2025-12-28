import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `SELECT id, firstname, lastname, email, profile_image_url, created_at
       FROM users 
       WHERE id = ? AND is_active = 1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profileImageUrl: user.profile_image_url,
        joinedDate: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstname, lastname, email, password, profileImageUrl } = req.body;

    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        message: "Firstname, lastname and email are required",
      });
    }

    const emailLower = email.toLowerCase();

    // Check duplicate email (except current user)
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [emailLower, userId]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already used by another account",
      });
    }

    // Build dynamic update
    let updateFields = ["firstname = ?", "lastname = ?", "email = ?"];
    let updateValues = [firstname.trim(), lastname.trim(), emailLower];

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (profileImageUrl !== undefined) {
      if (profileImageUrl === "" || profileImageUrl === null) {
        updateFields.push("profile_image_url = NULL");
      } else {
        updateFields.push("profile_image_url = ?");
        updateValues.push(profileImageUrl);
      }
    }

    updateValues.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    const [result] = await pool.query(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return fresh data
    const [updated] = await pool.query(
      `SELECT id, firstname, lastname, email, profile_image_url, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updated[0].id,
        firstname: updated[0].firstname,
        lastname: updated[0].lastname,
        email: updated[0].email,
        profileImageUrl: updated[0].profile_image_url,
        joinedDate: updated[0].created_at,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
