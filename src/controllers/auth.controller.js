const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../utils/db");

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!["principal", "teacher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Email already exists",
      });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [users] = await db.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
};
