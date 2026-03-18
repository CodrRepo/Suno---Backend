const User = require('../models/user.model');
const Song = require('../models/song.model');
const Album = require('../models/album.model');
const Playlist = require('../models/playlist.model');
const ListeningHistory = require('../models/history.model');
const ConcertRequest = require('../models/concertRequest.model');
const { cloudinary } = require('../middleware/upload.middleware');

function getCloudinaryPublicId(url) {
  if (!url) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;

  let tail = parts[1].split('?')[0];
  const pathParts = tail.split('/');
  const versionIndex = pathParts.findIndex((p) => /^v\d+$/.test(p));

  if (versionIndex >= 0) {
    tail = pathParts.slice(versionIndex + 1).join('/');
  }

  return tail.replace(/\.[^/.]+$/, '');
}

async function destroyCloudinaryAsset(url, resourceType = 'image') {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return true;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch {
    return false;
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find()
      .select('_id name artistName email profileType profilePicture followers following createDate lastLoginDate')
      .sort({ createDate: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function listSongs(req, res) {
  try {
    const songs = await Song.find()
      .populate('artistId', 'name artistName email profileType')
      .sort({ uploadDate: -1 });

    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function deleteSongAdmin(req, res) {
  try {
    const { songId } = req.params;
    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    // Cleanup DB references first. Avoid transactions here because many local MongoDB
    // setups run as standalone and throw transaction errors.
    await Promise.all([
      Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } }),
      ListeningHistory.deleteMany({ songId: song._id }),
      Song.deleteOne({ _id: song._id }),
    ]);

    // Then remove files from Cloudinary.
    const [audioDeleted, coverDeleted] = await Promise.all([
      destroyCloudinaryAsset(song.audioUrl, 'video'),
      destroyCloudinaryAsset(song.coverArtUrl, 'image'),
    ]);

    const failedAssets = [];
    if (!audioDeleted) failedAssets.push('audio');
    if (!coverDeleted) failedAssets.push('coverArt');

    if (failedAssets.length) {
      return res.status(200).json({
        message: 'Song deleted from database references, but some Cloudinary assets could not be removed.',
        failedAssets,
      });
    }

    return res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function deleteUserAdmin(req, res) {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Admin cannot delete own account' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const songs = await Song.find({ artistId: user._id }).select('_id audioUrl coverArtUrl');
    const songIds = songs.map((s) => s._id);

    const albums = await Album.find({ userId: user._id }).select('_id coverImage');
    const albumIds = albums.map((a) => a._id);

    const playlists = await Playlist.find({ userId: user._id }).select('_id coverImage');
    const playlistIds = playlists.map((p) => p._id);

    const cloudTasks = [];
    songs.forEach((s) => {
      cloudTasks.push(destroyCloudinaryAsset(s.audioUrl, 'video'));
      cloudTasks.push(destroyCloudinaryAsset(s.coverArtUrl, 'image'));
    });
    albums.forEach((a) => cloudTasks.push(destroyCloudinaryAsset(a.coverImage, 'image')));
    playlists.forEach((p) => cloudTasks.push(destroyCloudinaryAsset(p.coverImage, 'image')));
    cloudTasks.push(destroyCloudinaryAsset(user.profilePicture, 'image'));

    await Promise.all(cloudTasks);

    await Promise.all([
      // Remove all songs created by the user and all references
      Song.deleteMany({ artistId: user._id }),
      Playlist.updateMany({ songs: { $in: songIds } }, { $pull: { songs: { $in: songIds } } }),
      ListeningHistory.deleteMany({ $or: [{ userId: user._id }, { songId: { $in: songIds } }] }),

      // Remove user-owned resources
      Playlist.deleteMany({ _id: { $in: playlistIds } }),
      Album.deleteMany({ _id: { $in: albumIds } }),
      ConcertRequest.deleteMany({ $or: [{ userId: user._id }, { artistId: user._id }] }),

      // Remove follow relationships and account itself
      User.updateMany({}, { $pull: { followingList: user._id } }),
      User.deleteOne({ _id: user._id }),
    ]);

    return res.status(200).json({ message: 'User and related data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  listUsers,
  listSongs,
  deleteSongAdmin,
  deleteUserAdmin,
};
