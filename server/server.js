/**
 * server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Express & Socket.IO server for NexChat.
 * Includes Gmail SMTP (Nodemailer) and Brevo API mail verification.
 */

import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import nodemailer from 'nodemailer';

import mongoose from 'mongoose';
import multer from 'multer';
import { User, Community, Message, Task, Report, Post } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

try {
  await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

let atlasConnected = false;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('🍃 MongoDB Atlas connected successfully!');
      atlasConnected = true;
      try {
        await syncFromAtlas();
        console.log('🔄 Data synced from MongoDB Atlas to local db.json successfully.');
      } catch (err) {
        console.error('⚠️ Error syncing data from MongoDB Atlas:', err.message);
      }
    })
    .catch((err) => console.warn('⚠️ MongoDB Atlas connection error (using local DB fallback):', err.message));
}

async function syncFromAtlas() {
  const users = await User.find({}).lean();
  const communities = await Community.find({}).lean();
  const messages = await Message.find({}).lean();
  const tasks = await Task.find({}).lean();
  const reports = await Report.find({}).lean();
  const posts = await Post.find({}).lean();

  if (users.length === 0) {
    console.log('Seeding MongoDB Atlas from local db.json...');
    const localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    await syncToAtlas(localDb);
    return;
  }

  const db = {
    currentUser: null,
    registeredUsers: users.map(u => ({
      id: (u.id && u.id !== 'undefined') ? (isNaN(u.id) ? u.id : Number(u.id)) : String(u._id),
      name: u.name,
      email: u.email,
      password: u.password,
      bio: u.bio,
      avatar: u.avatar,
      color: u.color,
      role: u.role,
      blockedUsers: u.blockedUsers
    })),
    chats: communities.map(c => ({
      id: (c.id && c.id !== 'undefined') ? (isNaN(c.id) ? c.id : Number(c.id)) : String(c._id),
      name: c.name,
      description: c.description,
      avatar: c.avatar,
      color: c.color,
      type: c.type,
      creator: c.creator ? (isNaN(c.creator) ? c.creator : Number(c.creator)) : '',
      coAdmins: (c.coAdmins || []).map(x => isNaN(x) ? x : Number(x)),
      members: (c.members || []).map(x => isNaN(x) ? x : Number(x))
    })),
    messages: {},
    tasks: tasks.map(t => ({
      id: (t.id && t.id !== 'undefined') ? t.id : String(t._id),
      communityId: t.communityId ? (isNaN(t.communityId) ? t.communityId : Number(t.communityId)) : '',
      title: t.title,
      description: t.description,
      externalPlatformUrl: t.externalPlatformUrl,
      assignedTo: (t.assignedTo || []).map(x => isNaN(x) ? x : Number(x)),
      dueDate: t.dueDate,
      status: t.status,
      submissions: (t.submissions || []).map(s => ({
        id: s.id,
        userId: s.userId ? (isNaN(s.userId) ? s.userId : Number(s.userId)) : '',
        userName: s.userName,
        proofScreenshotUrl: s.proofScreenshotUrl,
        fileUrl: s.fileUrl,
        notes: s.notes,
        status: s.status,
        submittedAt: s.submittedAt
      }))
    })),
    reports: reports.map(r => ({
      id: (r.id && r.id !== 'undefined') ? r.id : String(r._id),
      reporterId: r.reporterId ? (isNaN(r.reporterId) ? r.reporterId : Number(r.reporterId)) : '',
      reportedUserId: r.reportedUserId ? (isNaN(r.reportedUserId) ? r.reportedUserId : Number(r.reportedUserId)) : '',
      reason: r.reason,
      details: r.details,
      status: r.status
    })),
    posts: posts.map(p => ({
      id: (p.id && p.id !== 'undefined') ? p.id : String(p._id),
      authorId: p.authorId ? (isNaN(p.authorId) ? p.authorId : Number(p.authorId)) : '',
      authorName: p.authorName,
      authorAvatar: p.authorAvatar,
      authorColor: p.authorColor,
      text: p.text,
      mediaUrl: p.mediaUrl,
      likes: (p.likes || []).map(x => isNaN(x) ? x : Number(x)),
      comments: (p.comments || []).map(c => ({
        id: c.id,
        userId: c.userId ? (isNaN(c.userId) ? c.userId : Number(c.userId)) : '',
        userName: c.userName,
        userAvatar: c.userAvatar,
        text: c.text,
        ts: c.ts
      }))
    }))
  };

  messages.forEach(m => {
    const cid = String(m.chatId);
    db.messages[cid] = db.messages[cid] || [];
    db.messages[cid].push({
      id: m.id || `msg-${m._id}`,
      senderId: isNaN(m.senderId) ? m.senderId : Number(m.senderId),
      senderName: m.senderName,
      text: m.text,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileName: m.fileName,
      fileSize: m.fileSize,
      poll: m.poll,
      status: m.status,
      ts: m.ts
    });
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

async function syncToAtlas(db) {
  if (db.registeredUsers && Array.isArray(db.registeredUsers)) {
    for (const u of db.registeredUsers) {
      await User.updateOne(
        { email: u.email.toLowerCase().trim() },
        {
          name: u.name,
          password: u.password,
          avatar: u.avatar,
          color: u.color,
          bio: u.bio,
          role: u.role || 'user',
          blockedUsers: (u.blockedUsers || []).map(String),
          id: String(u.id)
        },
        { upsert: true }
      );
    }
  }

  if (db.chats && Array.isArray(db.chats)) {
    for (const c of db.chats) {
      await Community.updateOne(
        { name: c.name, type: c.type },
        {
          description: c.description || '',
          avatar: c.avatar,
          color: c.color,
          creator: String(c.creator),
          coAdmins: (c.coAdmins || []).map(String),
          members: (c.members || []).map(String),
          id: String(c.id)
        },
        { upsert: true }
      );
    }
  }

  if (db.messages) {
    for (const chatId of Object.keys(db.messages)) {
      for (const m of db.messages[chatId]) {
        await Message.updateOne(
          { id: m.id },
          {
            chatId: String(chatId),
            senderId: String(m.senderId),
            senderName: m.senderName,
            text: m.text || '',
            fileUrl: m.fileUrl,
            fileType: m.fileType,
            fileName: m.fileName,
            fileSize: m.fileSize,
            poll: m.poll,
            status: m.status,
            ts: m.ts
          },
          { upsert: true }
        );
      }
    }
  }

  if (db.tasks && Array.isArray(db.tasks)) {
    for (const t of db.tasks) {
      await Task.updateOne(
        { id: t.id },
        {
          communityId: String(t.communityId),
          title: t.title,
          description: t.description || '',
          externalPlatformUrl: t.externalPlatformUrl || '',
          assignedTo: (t.assignedTo || []).map(String),
          dueDate: t.dueDate || '',
          status: t.status || 'open',
          submissions: (t.submissions || []).map(s => ({
            id: s.id,
            userId: String(s.userId),
            userName: s.userName,
            proofScreenshotUrl: s.proofScreenshotUrl,
            fileUrl: s.fileUrl,
            notes: s.notes,
            status: s.status,
            submittedAt: s.submittedAt
          }))
        },
        { upsert: true }
      );
    }
  }

  if (db.reports && Array.isArray(db.reports)) {
    for (const r of db.reports) {
      await Report.updateOne(
        { id: r.id },
        {
          reporterId: String(r.reporterId),
          reportedUserId: String(r.reportedUserId),
          reason: r.reason,
          details: r.details || '',
          status: r.status || 'pending'
        },
        { upsert: true }
      );
    }
  }

  if (db.posts && Array.isArray(db.posts)) {
    for (const p of db.posts) {
      await Post.updateOne(
        { id: p.id },
        {
          authorId: String(p.authorId),
          authorName: p.authorName,
          authorAvatar: p.authorAvatar,
          authorColor: p.authorColor,
          text: p.text || '',
          mediaUrl: p.mediaUrl,
          likes: (p.likes || []).map(String),
          comments: (p.comments || []).map(c => ({
            id: c.id,
            userId: String(c.userId),
            userName: c.userName,
            userAvatar: c.userAvatar,
            text: c.text,
            ts: c.ts
          }))
        },
        { upsert: true }
      );
    }
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors());
app.use(express.json());

// ─── Temporary storage for pending registrations ───────────────────────────
const pendingVerifications = new Map();

// ─── Database helpers ────────────────────────────────────────────────────────

async function readDb() {
  try {
    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(rawData);
    if (!db.registeredUsers || db.registeredUsers.length === 0) {
      db.registeredUsers = [
        {
          id: 2,
          name: "ADARSH KUMAR",
          email: "jvmadarshkumar@gmail.com",
          password: "1234567890",
          bio: "Collaborator",
          avatar: "AD",
          color: "#4F46E5"
        },
        {
          id: 3,
          name: "user",
          email: "lpuadarshkumar@gmail.com",
          password: "1234567890",
          bio: "Collaborator",
          avatar: "US",
          color: "#06B6D4"
        }
      ];
      await writeDb(db);
    }
    if (!db.chats || db.chats.length === 0) {
      db.chats = [
        { id: 3, name: "Design Hub", type: "workspace", avatar: "DH", color: "#10B981", creator: 2, members: [2, 3] },
        { id: 4, name: "Engineering", type: "workspace", avatar: "EN", color: "#F59E0B", creator: 2, members: [2, 3] },
        { id: 5, name: "# general", type: "channel", avatar: "#G", color: "#EC4899", creator: 2, members: [2, 3] },
        { id: 6, name: "# announcements", type: "channel", avatar: "#A", color: "#8B5CF6", creator: 2, members: [2, 3] },
        { id: 8, name: "# random", type: "channel", avatar: "#R", color: "#06B6D4", creator: 2, members: [2, 3] }
      ];
      await writeDb(db);
    }
    return db;
  } catch (error) {
    console.error('[Server DB] Error reading DB file, returning empty state:', error);
    const defaultDb = {
      currentUser: null,
      registeredUsers: [
        {
          id: 2,
          name: "ADARSH KUMAR",
          email: "jvmadarshkumar@gmail.com",
          password: "1234567890",
          bio: "Collaborator",
          avatar: "AD",
          color: "#4F46E5"
        },
        {
          id: 3,
          name: "user",
          email: "lpuadarshkumar@gmail.com",
          password: "1234567890",
          bio: "Collaborator",
          avatar: "US",
          color: "#06B6D4"
        }
      ],
      chats: [
        { id: 3, name: "Design Hub", type: "workspace", avatar: "DH", color: "#10B981", creator: 2, members: [2, 3] },
        { id: 4, name: "Engineering", type: "workspace", avatar: "EN", color: "#F59E0B", creator: 2, members: [2, 3] },
        { id: 5, name: "# general", type: "channel", avatar: "#G", color: "#EC4899", creator: 2, members: [2, 3] },
        { id: 6, name: "# announcements", type: "channel", avatar: "#A", color: "#8B5CF6", creator: 2, members: [2, 3] },
        { id: 8, name: "# random", type: "channel", avatar: "#R", color: "#06B6D4", creator: 2, members: [2, 3] }
      ],
      messages: {
        "3": [
          {
            "id": "m-seed-1",
            "senderId": 2,
            "senderName": "ADARSH KUMAR",
            "text": "Hi user, did you check the new UI mocks for Design Hub?",
            "status": "seen",
            "ts": "10:30 AM"
          },
          {
            "id": "m-seed-2",
            "senderId": 3,
            "senderName": "user",
            "text": "Yes Adarsh, they look amazing! Very clean and responsive.",
            "status": "seen",
            "ts": "10:32 AM"
          }
        ],
        "4": [
          {
            "id": "m-seed-3",
            "senderId": 3,
            "senderName": "user",
            "text": "Hey Adarsh, is the proxy config for uploads ready?",
            "status": "seen",
            "ts": "11:15 AM"
          },
          {
            "id": "m-seed-4",
            "senderId": 2,
            "senderName": "ADARSH KUMAR",
            "text": "Yes, just merged it. It routes /uploads correctly to port 3001.",
            "status": "seen",
            "ts": "11:17 AM"
          }
        ],
        "5": [
          {
            "id": "m-seed-5",
            "senderId": 2,
            "senderName": "ADARSH KUMAR",
            "text": "Welcome everyone to #general channel!",
            "status": "seen",
            "ts": "09:00 AM"
          }
        ]
      }
    };
    await writeDb(defaultDb);
    return defaultDb;
  }
}

async function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    if (atlasConnected) {
      syncToAtlas(data).catch((err) => console.error('[Server DB] Sync to MongoDB Atlas failed:', err.message));
    }
  } catch (error) {
    console.error('[Server DB] Error writing to DB file:', error);
  }
}

// ─── Unified Email Sender Helper ─────────────────────────────────────────────

async function sendOtpEmail(email, name, otp) {
  const senderName = process.env.BREVO_SENDER_NAME || 'NexChat Workspace Team';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px; font-size: 24px;">Confirm Your NexChat Registration</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello <b>${name}</b>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">To activate your workspace access and complete registration, please verify your email address using the One-Time Password (OTP) code below:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this mail.</p>
      <div style="height: 1px; background-color: #e2e8f0; margin-top: 24px; margin-bottom: 16px;"></div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">NexChat Workspace Collaboration Services</p>
    </div>
  `;

  // ── Option 1: Gmail SMTP (Nodemailer) ──────────────────────────────────────
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass && smtpPass !== 'your_gmail_app_password_here') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${senderName}" <${smtpUser}>`,
        to: email,
        subject: 'NexChat - OTP Verification Code',
        html: htmlContent,
      });

      console.log(`[Gmail SMTP] Verification OTP sent successfully to ${email}`);
      return { sent: true, type: 'smtp' };
    } catch (err) {
      console.error('[Gmail SMTP] Error sending mail:', err.message);
      throw new Error(`Gmail SMTP delivery failed: ${err.message}`);
    }
  }

  // ── Option 2: Brevo REST API ───────────────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (apiKey && apiKey !== 'your_brevo_api_key_here' && senderEmail) {
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name }],
        subject: 'NexChat - OTP Verification Code',
        htmlContent,
      }, {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
      });
      console.log(`[Brevo SMTP] Verification OTP sent successfully to ${email}`);
      return { sent: true, type: 'brevo' };
    } catch (err) {
      console.error('[Brevo SMTP] Error sending email:', err.response?.data || err.message);
      throw new Error(`Brevo API delivery failed: ${err.response?.data?.message || err.message}`);
    }
  }

  // ── Option 3: Local Terminal Fallback (No keys configured) ─────────────────
  console.warn(`\n⚠️  [SMTP BYPASS] No credentials configured. DEVELOPER FALLBACK: Generated OTP for ${email} is: ${otp}\n`);
  return { fallback: true };
}

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

// POST /api/auth/register (Triggers OTP)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, color } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: 'Display name must be at least 3 characters.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = await readDb();
  const exists = db.registeredUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'This email is already registered.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  pendingVerifications.set(email.toLowerCase().trim(), {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    color: color || '#6366F1',
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  try {
    const isMock = await sendOtpEmail(email.toLowerCase().trim(), name.trim(), otp);
    
    res.json({
      ok: true,
      message: 'Verification OTP sent to your email.',
      email: email.toLowerCase().trim(),
      isFallback: !!isMock.fallback,
      otp: isMock.fallback ? otp : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp (Validates OTP and saves user profile)
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required.' });
  }

  const pending = pendingVerifications.get(email.toLowerCase().trim());
  if (!pending) {
    return res.status(400).json({ error: 'No verification request found for this email address.' });
  }

  if (Date.now() > pending.expiresAt) {
    pendingVerifications.delete(email.toLowerCase().trim());
    return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
  }

  if (pending.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check your inputs.' });
  }

  const db = await readDb();
  
  if (db.registeredUsers.some((u) => u.email.toLowerCase() === pending.email.toLowerCase())) {
    pendingVerifications.delete(pending.email);
    return res.status(400).json({ error: 'This email is already registered.' });
  }

  const newUser = {
    id: db.registeredUsers.length + 1,
    name: pending.name,
    email: pending.email,
    password: pending.password,
    bio: 'Collaborator',
    avatar: pending.name.slice(0, 2).toUpperCase(),
    color: pending.color,
  };

  db.registeredUsers.push(newUser);
  db.currentUser = {
    id: newUser.id,
    name: newUser.name,
    bio: newUser.bio,
    avatar: newUser.avatar,
    color: newUser.color,
  };

  await writeDb(db);
  pendingVerifications.delete(pending.email);

  const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
  res.json({ ok: true, user: db.currentUser, token });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  const db = await readDb();
  const user = db.registeredUsers.find(
    (u) => u.email.toLowerCase().trim() === cleanEmail && u.password.trim() === cleanPass
  );

  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  db.currentUser = {
    id: user.id,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    color: user.color,
  };

  await writeDb(db);

  const token = `mock-jwt-token-${user.id}-${Date.now()}`;
  res.json({ ok: true, user: db.currentUser, token });
});

function getUserFromAuthHeader(req, registeredUsers, defaultUser) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer mock-jwt-token-')) {
    const parts = authHeader.split('-');
    const userIdVal = parts[3];
    if (userIdVal) {
      const user = registeredUsers.find((u) => String(u.id) === String(userIdVal));
      if (user) {
        return {
          id: user.id,
          name: user.name,
          bio: user.bio || 'Collaborator',
          avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
          color: user.color || '#6366F1',
        };
      }
    }
  }
  return defaultUser || (registeredUsers.length > 0 ? {
    id: registeredUsers[0].id,
    name: registeredUsers[0].name,
    bio: registeredUsers[0].bio || 'Collaborator',
    avatar: registeredUsers[0].avatar || registeredUsers[0].name.slice(0, 2).toUpperCase(),
    color: registeredUsers[0].color || '#6366F1',
  } : null);
}

// ─── Data Endpoints ──────────────────────────────────────────────────────────

app.get('/api/users/me', async (req, res) => {
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) {
    return res.status(401).json({ error: 'No active session.' });
  }
  res.json(user);
});

app.patch('/api/users/me', async (req, res) => {
  const { name, bio, avatar } = req.body;
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: 'Display name must be at least 3 characters.' });
  }
  if (bio && bio.length > 100) {
    return res.status(400).json({ error: 'Bio must be under 100 characters.' });
  }

  const db = await readDb();
  if (!db.currentUser) {
    return res.status(401).json({ error: 'No active session.' });
  }

  db.currentUser.name = name;
  db.currentUser.bio = bio;
  if (avatar !== undefined) {
    db.currentUser.avatar = avatar;
  }

  const matchIndex = db.registeredUsers.findIndex((u) => u.id === db.currentUser.id);
  if (matchIndex !== -1) {
    db.registeredUsers[matchIndex].name = name;
    db.registeredUsers[matchIndex].bio = bio;
    if (avatar !== undefined) {
      db.registeredUsers[matchIndex].avatar = avatar;
    }
  }

  await writeDb(db);
  io.emit('profileUpdated', db.currentUser);
  res.json({ ok: true, currentUser: db.currentUser });
});

app.get('/api/users/search', async (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  const currentUserId = user?.id;

  const matches = db.registeredUsers
    .filter((u) => String(u.id) !== String(currentUserId))
    .filter((u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
      color: u.color || '#6366F1',
      bio: u.bio || 'Collaborator',
    }));

  res.json(matches);
});

function formatChatForUser(chat, currentUser, registeredUsers) {
  if (chat.type !== 'direct') return chat;

  const currentIdStr = String(currentUser?.id);
  const isParticipant = chat.participants && Array.isArray(chat.participants)
    ? chat.participants.map(String).includes(currentIdStr)
    : (String(chat.targetUserId) === currentIdStr || chat.participants?.length === undefined);

  if (!isParticipant && chat.participants && chat.participants.length > 0) {
    return null; // Don't expose private direct chats to non-participants
  }

  let otherUserId = null;
  if (chat.participants && Array.isArray(chat.participants)) {
    otherUserId = chat.participants.find((p) => String(p) !== currentIdStr);
  } else if (chat.targetUserId && String(chat.targetUserId) !== currentIdStr) {
    otherUserId = chat.targetUserId;
  }

  if (otherUserId) {
    const otherUser = registeredUsers.find((u) => String(u.id) === String(otherUserId));
    if (otherUser) {
      return {
        ...chat,
        name: otherUser.name,
        targetUserId: otherUser.id,
        avatar: otherUser.avatar || otherUser.name.slice(0, 2).toUpperCase(),
        color: otherUser.color || '#6366F1',
      };
    }
  }

  return chat;
}

app.post('/api/chats/direct', async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required.' });
  }

  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const targetUser = db.registeredUsers.find((u) => String(u.id) === String(targetUserId));
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  // Check if a direct chat room already exists between user.id and targetUser.id
  let chat = db.chats.find((c) => {
    if (c.type !== 'direct') return false;
    if (c.participants && Array.isArray(c.participants)) {
      return c.participants.map(String).includes(String(user.id)) && c.participants.map(String).includes(String(targetUser.id));
    }
    return (String(c.targetUserId) === String(targetUser.id) || String(c.targetUserId) === String(user.id)) ||
           (c.name.toLowerCase() === targetUser.name.toLowerCase() || c.name.toLowerCase() === user.name.toLowerCase());
  });

  if (!chat) {
    const nextId = Math.max(0, ...db.chats.map((c) => Number(c.id) || 0)) + 1;
    chat = {
      id: nextId,
      type: 'direct',
      participants: [user.id, targetUser.id],
      targetUserId: targetUser.id,
      name: targetUser.name,
      avatar: targetUser.avatar || targetUser.name.slice(0, 2).toUpperCase(),
      color: targetUser.color || '#6366F1',
      lastMessage: 'Start of your direct conversation',
      unread: 0,
    };
    db.chats.push(chat);
    db.messages[chat.id] = db.messages[chat.id] || [];
    await writeDb(db);
  } else {
    chat.participants = [user.id, targetUser.id];
    await writeDb(db);
  }

  const formattedForUser = formatChatForUser(chat, user, db.registeredUsers);
  io.emit('chatCreated', formattedForUser);
  res.json(formattedForUser);
});

app.get('/api/chats', async (req, res) => {
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  const formattedChats = db.chats
    .map((c) => formatChatForUser(c, user, db.registeredUsers))
    .filter(Boolean);
  res.json(formattedChats);
});

app.get('/api/chats/:chatId/messages', async (req, res) => {
  const chatId = req.params.chatId;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);

  if (user) {
    const chatIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
    if (chatIndex !== -1 && db.chats[chatIndex].type !== 'direct') {
      const comm = db.chats[chatIndex];
      comm.members = comm.members || [];
      if (!comm.members.map(String).includes(String(user.id))) {
        comm.members.push(user.id);
        db.chats[chatIndex] = comm;
        await writeDb(db);
        io.emit('chatUpdated', { chatId, community: comm });
      }
    }
  }

  const list = db.messages[chatId] || [];
  res.json(list);
});

app.use('/uploads', express.static(UPLOADS_DIR));

// ─── File Upload Endpoint ─────────────────────────────────────────────────────

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    ok: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
  });
});

// ─── User Moderation Endpoints ───────────────────────────────────────────────

app.post('/api/users/block', async (req, res) => {
  const { targetUserId } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.blockedUsers = db.blockedUsers || {};
  db.blockedUsers[user.id] = db.blockedUsers[user.id] || [];
  if (!db.blockedUsers[user.id].includes(String(targetUserId))) {
    db.blockedUsers[user.id].push(String(targetUserId));
    await writeDb(db);
  }
  res.json({ ok: true, blockedUsers: db.blockedUsers[user.id] });
});

app.post('/api/users/report', async (req, res) => {
  const { reportedUserId, reason, details } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.reports = db.reports || [];
  const newReport = {
    id: `rep-${Date.now()}`,
    reporterId: user.id,
    reportedUserId,
    reason,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.reports.push(newReport);
  await writeDb(db);
  res.json({ ok: true, report: newReport });
});

// ─── Community & Group Administration Endpoints ──────────────────────────────

app.post('/api/communities', async (req, res) => {
  const { name, description, avatar, color, type } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const nextId = Math.max(0, ...db.chats.map((c) => Number(c.id) || 0)) + 1;
  const newComm = {
    id: nextId,
    name: name.startsWith('#') || type !== 'channel' ? name : `# ${name}`,
    description: description || '',
    type: type || 'channel',
    avatar: avatar || (type === 'channel' ? '#C' : 'CM'),
    color: color || '#EC4899',
    creator: user.id,
    coAdmins: [],
    members: [user.id],
    lastMessage: 'Community created',
    unread: 0,
  };

  db.chats.push(newComm);
  db.messages[newComm.id] = [];
  await writeDb(db);

  io.emit('chatCreated', newComm);
  res.json(newComm);
});

app.get('/api/communities/:id/details', async (req, res) => {
  const chatId = req.params.id;
  const db = await readDb();
  const comm = db.chats.find((c) => String(c.id) === String(chatId));
  if (!comm) return res.status(404).json({ error: 'Community not found' });

  const creatorId = String(comm.creator || '');
  const coAdminIds = (comm.coAdmins || []).map(String);
  const memberIds = (comm.members || [comm.creator]).map(String);

  // Hydrate full member objects
  const detailedMembers = db.registeredUsers
    .filter((u) => memberIds.includes(String(u.id)))
    .map((u) => {
      let role = 'member';
      if (String(u.id) === creatorId) role = 'admin';
      else if (coAdminIds.includes(String(u.id))) role = 'coadmin';

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
        color: u.color || '#6366F1',
        role,
      };
    });

  // Hydrate non-members so admin can add them
  const nonMembers = db.registeredUsers
    .filter((u) => !memberIds.includes(String(u.id)))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
      color: u.color || '#6366F1',
    }));

  res.json({
    ...comm,
    detailedMembers,
    nonMembers,
  });
});

app.post('/api/communities/:id/members/add', async (req, res) => {
  const chatId = req.params.id;
  const { targetUserId } = req.body;
  const db = await readDb();
  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  const comm = db.chats[commIndex];
  comm.members = comm.members || [];
  if (!comm.members.map(String).includes(String(targetUserId))) {
    comm.members.push(targetUserId);
    db.chats[commIndex] = comm;
    await writeDb(db);
  }

  io.emit('chatUpdated', { chatId, community: comm });
  res.json({ ok: true, community: comm });
});

app.post('/api/communities/:id/members/remove', async (req, res) => {
  const chatId = req.params.id;
  const { targetUserId } = req.body;
  const db = await readDb();
  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  const comm = db.chats[commIndex];
  comm.members = (comm.members || []).filter((m) => String(m) !== String(targetUserId));
  comm.coAdmins = (comm.coAdmins || []).filter((m) => String(m) !== String(targetUserId));
  db.chats[commIndex] = comm;
  await writeDb(db);

  io.emit('chatUpdated', { chatId, community: comm });
  res.json({ ok: true, community: comm });
});

app.post('/api/communities/:id/coadmins', async (req, res) => {
  const { targetUserId } = req.body;
  const chatId = req.params.id;
  const db = await readDb();
  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  const comm = db.chats[commIndex];
  comm.coAdmins = comm.coAdmins || [];
  if (comm.coAdmins.length >= 2 && !comm.coAdmins.includes(String(targetUserId))) {
    return res.status(400).json({ error: 'Maximum 2 Co-Admins allowed per community.' });
  }
  if (!comm.coAdmins.includes(String(targetUserId))) {
    comm.coAdmins.push(String(targetUserId));
    db.chats[commIndex] = comm;
    await writeDb(db);
  }
  res.json({ ok: true, community: comm });
});

app.post('/api/communities/:id/transfer', async (req, res) => {
  const { newCreatorId } = req.body;
  const chatId = req.params.id;
  const db = await readDb();
  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  db.chats[commIndex].creator = newCreatorId;
  await writeDb(db);
  res.json({ ok: true, community: db.chats[commIndex] });
});

app.post('/api/communities/:id/leave', async (req, res) => {
  const chatId = req.params.id;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  const comm = db.chats[commIndex];
  comm.members = (comm.members || []).filter((m) => String(m) !== String(user.id));
  comm.coAdmins = (comm.coAdmins || []).filter((m) => String(m) !== String(user.id));
  
  db.chats[commIndex] = comm;
  await writeDb(db);

  io.emit('chatUpdated', { chatId, community: comm });
  res.json({ ok: true, community: comm });
});

app.delete('/api/communities/:id', async (req, res) => {
  const chatId = req.params.id;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const commIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (commIndex === -1) return res.status(404).json({ error: 'Community not found' });

  const comm = db.chats[commIndex];
  if (String(comm.creator) !== String(user.id)) {
    return res.status(403).json({ error: 'Only the creator can delete this group.' });
  }

  db.chats = db.chats.filter((c) => String(c.id) !== String(chatId));
  delete db.messages[chatId];
  await writeDb(db);

  io.emit('chatDeleted', { chatId });
  res.json({ ok: true });
});

// ─── Twitter/X Style Community Posts & Feed ────────────────────────────────────

app.get('/api/posts', async (req, res) => {
  const db = await readDb();
  const posts = (db.posts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.post('/api/posts', async (req, res) => {
  const { text, mediaUrl } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.posts = db.posts || [];
  const newPost = {
    id: `post-${Date.now()}`,
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
    authorColor: user.color || '#6366F1',
    text: text ? text.trim() : '',
    mediaUrl: mediaUrl || null,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };

  db.posts.unshift(newPost);
  await writeDb(db);

  io.emit('newPostCreated', newPost);
  res.json(newPost);
});

app.post('/api/posts/:id/like', async (req, res) => {
  const postId = req.params.id;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.posts = db.posts || [];
  const post = db.posts.find((p) => String(p.id) === String(postId));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.likes = post.likes || [];
  const userIdStr = String(user.id);
  if (post.likes.includes(userIdStr)) {
    post.likes = post.likes.filter((id) => id !== userIdStr);
  } else {
    post.likes.push(userIdStr);
  }

  await writeDb(db);
  io.emit('postUpdated', post);
  res.json(post);
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });

  db.posts = db.posts || [];
  const post = db.posts.find((p) => String(p.id) === String(postId));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  post.comments = post.comments || [];
  const comment = {
    id: `c-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
    text: text.trim(),
    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  post.comments.push(comment);
  await writeDb(db);

  io.emit('postUpdated', post);
  res.json(comment);
});

// ─── Project Tasks & Proof Submissions ──────────────────────────────────────

app.get('/api/tasks/:communityId', async (req, res) => {
  const { communityId } = req.params;
  const db = await readDb();
  const tasks = (db.tasks || []).filter((t) => String(t.communityId) === String(communityId));
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const { communityId, title, description, externalPlatformUrl, assignedTo, dueDate } = req.body;
  const db = await readDb();
  db.tasks = db.tasks || [];
  const newTask = {
    id: `task-${Date.now()}`,
    communityId,
    title,
    description: description || '',
    externalPlatformUrl: externalPlatformUrl || '',
    assignedTo: assignedTo || [],
    dueDate: dueDate || '',
    status: 'open',
    submissions: [],
  };
  db.tasks.push(newTask);
  await writeDb(db);

  io.to(`chat:${communityId}`).emit('taskCreated', newTask);
  res.json(newTask);
});

app.post('/api/tasks/:id/submit-proof', async (req, res) => {
  const taskId = req.params.id;
  const { proofScreenshotUrl, fileUrl, notes } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const taskIndex = (db.tasks || []).findIndex((t) => String(t.id) === String(taskId));
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  const submission = {
    id: `sub-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    proofScreenshotUrl: proofScreenshotUrl || null,
    fileUrl: fileUrl || null,
    notes: notes || '',
    status: 'completed',
    submittedAt: new Date().toISOString(),
  };

  db.tasks[taskIndex].submissions.push(submission);
  await writeDb(db);

  io.to(`chat:${db.tasks[taskIndex].communityId}`).emit('taskSubmitted', { taskId, submission });
  res.json({ ok: true, submission });
});

// ─── Polls & MCQs ────────────────────────────────────────────────────────────

app.post('/api/polls', async (req, res) => {
  const { chatId, question, options } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const pollData = {
    question,
    options: options.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, votes: [] })),
  };

  const newMsg = {
    id: `m-poll-${Date.now()}`,
    senderId: user.id,
    senderName: user.name,
    text: `📊 Poll: ${question}`,
    poll: pollData,
    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  db.messages[chatId] = db.messages[chatId] || [];
  db.messages[chatId].push(newMsg);
  await writeDb(db);

  io.to(`chat:${chatId}`).emit('newMessage', { chatId, message: newMsg });
  res.json(newMsg);
});

app.post('/api/polls/:chatId/messages/:messageId/vote', async (req, res) => {
  const { chatId, messageId } = req.params;
  const { optionId } = req.body;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const msgList = db.messages[chatId] || [];
  const msgIndex = msgList.findIndex((m) => String(m.id) === String(messageId));
  if (msgIndex === -1 || !msgList[msgIndex].poll) {
    return res.status(404).json({ error: 'Poll message not found' });
  }

  const poll = msgList[msgIndex].poll;
  const userId = String(user.id);

  poll.options.forEach((opt) => {
    opt.votes = (opt.votes || []).filter((v) => String(v) !== userId);
    if (opt.id === optionId) {
      opt.votes.push(userId);
    }
  });

  db.messages[chatId][msgIndex].poll = poll;
  await writeDb(db);

  io.to(`chat:${chatId}`).emit('pollUpdated', { chatId, messageId, poll });
  res.json({ ok: true, poll });
});

app.post('/api/chats/:chatId/read', async (req, res) => {
  const chatId = req.params.chatId;
  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);

  // Clear unread badge for this chat
  const chatIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (chatIndex !== -1) {
    db.chats[chatIndex].unread = 0;
  }

  // Mark messages sent by the other party as seen
  const messages = db.messages[chatId] || [];
  let hasUpdatedStatus = false;
  db.messages[chatId] = messages.map((m) => {
    if (String(m.senderId) !== String(user?.id) && m.status !== 'seen') {
      hasUpdatedStatus = true;
      return { ...m, status: 'seen' };
    }
    return m;
  });

  await writeDb(db);

  if (hasUpdatedStatus) {
    io.to(`chat:${chatId}`).emit('messagesSeen', { chatId, seenBy: user?.id });
  }

  res.json({ ok: true, chatId });
});

app.post('/api/chats/:chatId/messages', async (req, res) => {
  const chatId = req.params.chatId;
  const { text, fileUrl, fileType, fileName, fileSize, senderId, senderName } = req.body;

  if ((!text || !text.trim()) && !fileUrl) {
    return res.status(400).json({ error: 'Message text or file attachment is required.' });
  }

  const db = await readDb();
  const user = getUserFromAuthHeader(req, db.registeredUsers, db.currentUser);
  if (!user) {
    return res.status(401).json({ error: 'Session unauthorized.' });
  }

  const existing = db.messages[chatId] || [];
  const now = new Date();
  const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: `m-${Date.now()}`,
    senderId: senderId || user.id,
    senderName: senderName || user.name,
    text: text ? text.trim() : (fileName ? `Attached file: ${fileName}` : ''),
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    fileName: fileName || null,
    fileSize: fileSize || 0,
    status: 'delivered',
    ts,
  };

  db.messages[chatId] = [...existing, newMsg];

  const chatIndex = db.chats.findIndex((c) => String(c.id) === String(chatId));
  if (chatIndex !== -1) {
    db.chats[chatIndex].lastMessage = text ? (text.length > 30 ? text.slice(0, 30) + '...' : text) : `📁 ${fileName || 'Attachment'}`;
  }

  await writeDb(db);

  io.to(`chat:${chatId}`).emit('newMessage', { chatId, message: newMsg });
  io.emit('chatUpdated', { chatId, lastMessage: db.chats[chatIndex]?.lastMessage });

  res.json(newMsg);
});

// ─── Socket.IO WebSockets ────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('joinChat', (chatId) => {
    socket.rooms.forEach((r) => {
      if (r.startsWith('chat:')) {
        socket.leave(r);
      }
    });

    socket.join(`chat:${chatId}`);
    console.log(`[Socket] Client ${socket.id} joined chat:${chatId}`);
  });

  // WebRTC Call Signaling
  socket.on('call-user', ({ userToCall, signalData, from, name, isVideo, chatId }) => {
    io.to(`chat:${chatId}`).emit('call-made', { signal: signalData, from, name, isVideo, chatId });
  });

  socket.on('make-answer', ({ to, signal }) => {
    io.to(to).emit('answer-made', { signal, from: socket.id });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('end-call', ({ chatId }) => {
    io.to(`chat:${chatId}`).emit('call-ended');
  });

  // Whiteboard drawing sync
  socket.on('whiteboard-stroke', ({ roomId, strokeData }) => {
    socket.to(`chat:${roomId}`).emit('whiteboard-stroke', strokeData);
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    socket.to(`chat:${roomId}`).emit('whiteboard-clear');
  });

  // PPT Presenter slide deck sync
  socket.on('ppt-slide-change', ({ roomId, pageIndex, totalPages, slideData }) => {
    socket.to(`chat:${roomId}`).emit('ppt-slide-change', { pageIndex, totalPages, slideData });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 NexChat Backend ready at http://localhost:${PORT}`);
});
