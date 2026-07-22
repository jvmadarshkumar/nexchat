import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'US' },
  color: { type: String, default: '#6366F1' },
  bio: { type: String, default: 'Collaborator' },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  blockedUsers: [{ type: String }],
}, { timestamps: true });

const CommunitySchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '#G' },
  color: { type: String, default: '#EC4899' },
  type: { type: String, default: 'channel', enum: ['channel', 'group', 'workspace', 'direct'] },
  creator: { type: String, required: true },
  coAdmins: [{ type: String }],
  members: [{ type: String }],
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  id: { type: String },
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, default: '' },
  fileUrl: { type: String, default: null },
  fileType: { type: String, default: null },
  fileName: { type: String, default: null },
  fileSize: { type: Number, default: 0 },
  poll: {
    question: String,
    options: [{
      id: String,
      text: String,
      votes: [String],
    }],
  },
  status: { type: String, default: 'delivered', enum: ['sent', 'delivered', 'seen'] },
  ts: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  id: { type: String },
  communityId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  externalPlatformUrl: { type: String, default: '' },
  assignedTo: [{ type: String }],
  dueDate: { type: String, default: '' },
  status: { type: String, default: 'open', enum: ['open', 'completed'] },
  submissions: [{
    userId: String,
    userName: String,
    proofScreenshotUrl: String,
    fileUrl: String,
    notes: String,
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    submittedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  id: { type: String },
  reporterId: { type: String, required: true },
  reportedUserId: { type: String, required: true },
  reason: { type: String, required: true },
  details: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'reviewed', 'dismissed'] },
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  id: { type: String },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: 'US' },
  authorColor: { type: String, default: '#6366F1' },
  text: { type: String, default: '' },
  mediaUrl: { type: String, default: null },
  likes: [{ type: String }],
  comments: [{
    id: String,
    userId: String,
    userName: String,
    userAvatar: String,
    text: String,
    ts: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  }],
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Community = mongoose.models.Community || mongoose.model('Community', CommunitySchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
