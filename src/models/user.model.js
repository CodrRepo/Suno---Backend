const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    artistName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileType: {
      type: String,
      enum: ["listener", "artist", "admin"],
      default: "listener",
    },
    profilePicture: {
      type: String,
      default: "https://i.pinimg.com/1200x/2f/99/94/2f99946425de51668c202ef924a35531.jpg",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },
    followingList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    createDate: {
      type: Date,
      default: Date.now,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
