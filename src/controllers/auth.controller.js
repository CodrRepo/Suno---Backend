const userModel = require("../models/user.model");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  try {
    const { name, email, password, profileType, profilePicture } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const allowedTypes = ["listener", "artist"];
    const resolvedType = profileType || "listener";
    if (!allowedTypes.includes(resolvedType)) {
      return res.status(400).json({ message: "profileType must be listener or artist" });
    }

    const existingUser = await userModel.findOne({ email});
    if (existingUser) {
      return res.status(409).json({ message: `An account with this email already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      profileType: resolvedType,
      profilePicture: profilePicture || "",
      bio: "",
    });

    const token = jwt.sign(
      { _id: user._id, email: user.email, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        artistName: user.artistName,
        email: user.email,
        profileType: user.profileType,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        createDate: user.createDate,
        lastLoginDate: user.lastLoginDate,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "No user found with this email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLoginDate = new Date();
    await user.save();

    const token = jwt.sign(
      { _id: user._id, email: user.email, profileType: user.profileType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        artistName: user.artistName,
        email: user.email,
        profileType: user.profileType,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        createDate: user.createDate,
        lastLoginDate: user.lastLoginDate,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: "/"
  });
  return res.status(200).json({ message: "Logged out successfully" });
}

module.exports = { register, login, logout };