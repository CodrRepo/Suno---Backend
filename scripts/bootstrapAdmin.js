require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../src/models/user.model');

async function connectDB() {
  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is missing in environment variables.');
  }

  await mongoose.connect(process.env.MONGODB_URL, { dbName: 'SunoApp' });
}

function loadAdminConfig() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.');
  }

  return {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    profilePicture: process.env.ADMIN_PROFILE_PICTURE ? String(process.env.ADMIN_PROFILE_PICTURE).trim() : '',
    bio: process.env.ADMIN_BIO ? String(process.env.ADMIN_BIO).trim() : '',
  };
}

async function upsertAdmin() {
  const admin = loadAdminConfig();
  const hashedPassword = await bcrypt.hash(admin.password, 10);

  const existing = await User.findOne({ email: admin.email });

  if (!existing) {
    const created = await User.create({
      name: admin.name,
      email: admin.email,
      password: hashedPassword,
      profileType: 'admin',
      profilePicture: admin.profilePicture,
      bio: admin.bio,
    });

    console.log('Admin account created:', {
      _id: created._id.toString(),
      email: created.email,
      profileType: created.profileType,
    });
    return;
  }

  existing.name = admin.name;
  existing.password = hashedPassword;
  existing.profileType = 'admin';
  existing.profilePicture = admin.profilePicture;
  existing.bio = admin.bio;
  await existing.save();

  console.log('Admin account updated:', {
    _id: existing._id.toString(),
    email: existing.email,
    profileType: existing.profileType,
  });
}

(async function run() {
  try {
    await connectDB();
    await upsertAdmin();
    console.log('Admin bootstrap completed successfully.');
  } catch (err) {
    console.error('Failed to bootstrap admin account:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
