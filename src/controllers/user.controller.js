const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const { cloudinary } = require("../middleware/upload.middleware");

function getCloudinaryPublicId(url) {
  if (!url) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  const withoutVersion = parts[1].replace(/^v\d+\//, '');
  return withoutVersion.replace(/\.[^.]+$/, '');
}

// GET /api/users/me
async function getMe(req, res) {
  try {
    const user = req.user;

    return res.status(200).json({
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
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// PATCH /api/users/me
async function updateMe(req, res) {
  try {
    const { name, artistName, bio, profilePicture, currentPassword, newPassword } = req.body || {};

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      user.name = name.trim();
    }

    if (artistName !== undefined) {
      if (user.profileType !== "artist") {
        return res.status(403).json({ message: "Only artists can set an artist name" });
      }
      user.artistName = artistName.trim();
    }

    if (bio !== undefined) user.bio = bio.trim();
    if (profilePicture !== undefined) user.profilePicture = profilePicture.trim();

    if (newPassword !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
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
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/users/me
async function deleteMe(req, res) {
  try {
    const user = await userModel.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.clearCookie("token");

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// PATCH /api/users/me/profile-type
async function updateProfileType(req, res) {
  try {
    const { profileType } = req.body || {};
    if (!['listener', 'artist'].includes(profileType)) {
      return res.status(400).json({ message: 'Profile type must be listener or artist' });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profileType === 'admin') {
      return res.status(403).json({ message: 'Admin profile type cannot be changed' });
    }

    user.profileType = profileType;
    await user.save();

    return res.status(200).json({
      message: 'Profile type updated',
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
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// PATCH /api/users/me/avatar
async function updateAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old avatar from Cloudinary if it exists
    if (user.profilePicture) {
      const publicId = getCloudinaryPublicId(user.profilePicture);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }

    user.profilePicture = req.file.path;
    await user.save();

    return res.status(200).json({
      message: 'Avatar updated',
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
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// GET /api/users/artists/:artistId
async function getArtistById(req, res) {
  try {
    const { artistId } = req.params;
    const [artist, currentUser] = await Promise.all([
      userModel.findById(artistId).select('name artistName profilePicture bio followers'),
      userModel.findById(req.user._id).select('followingList following'),
    ]);
    if (!artist) return res.status(404).json({ message: 'Artist not found' });
    const isFollowing = currentUser.followingList.map(id => id.toString()).includes(artistId);
    return res.status(200).json({ artist, isFollowing });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// POST /api/users/artists/:artistId/follow — toggle follow/unfollow
async function toggleFollow(req, res) {
  try {
    const { artistId } = req.params;
    if (artistId === req.user._id.toString())
      return res.status(400).json({ message: 'You cannot follow yourself' });

    const [currentUser, artist] = await Promise.all([
      userModel.findById(req.user._id),
      userModel.findById(artistId),
    ]);
    if (!artist) return res.status(404).json({ message: 'Artist not found' });

    const alreadyFollowing = currentUser.followingList.map(id => id.toString()).includes(artistId);

    if (alreadyFollowing) {
      currentUser.followingList.pull(artistId);
      currentUser.following = Math.max(0, currentUser.following - 1);
      artist.followers = Math.max(0, artist.followers - 1);
    } else {
      currentUser.followingList.push(artistId);
      currentUser.following += 1;
      artist.followers += 1;
    }

    await Promise.all([currentUser.save(), artist.save()]);

    return res.status(200).json({
      isFollowing: !alreadyFollowing,
      artistFollowers: artist.followers,
      userFollowing: currentUser.following,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// GET /api/users/artists
async function getArtists(req, res) {
  try {
    const artists = await userModel
      .find({ artistName: { $ne: "" } })
      .select('name artistName profilePicture bio')
      .sort({ createDate: -1 });

    return res.status(200).json({ artists });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { getMe, updateMe, deleteMe, updateProfileType, getArtists, getArtistById, toggleFollow, updateAvatar };
