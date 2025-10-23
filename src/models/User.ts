import mongoose, { Schema, Document } from 'mongoose';
import type {
  User as UserType,
  SocialPost,
  SocialHandle,
  SalesAttribution,
} from '../types';

export type UserDocument = UserType & Document;

const SocialHandleSchema = new Schema<SocialHandle>(
  {
    platform: {
      type: String,
      required: true,
      enum: [
        'instagram',
        'facebook',
        'twitter',
        'tiktok',
        'youtube',
        'linkedin',
        'other',
      ],
    },
    handle: { type: String, required: true },
  },
  { _id: false },
);

const SocialPostSchema = new Schema<SocialPost>(
  {
    postId: { type: String, required: true },
    platform: {
      type: String,
      required: true,
      enum: [
        'instagram',
        'facebook',
        'twitter',
        'tiktok',
        'youtube',
        'linkedin',
        'other',
      ],
    },
    url: { type: String },
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    reach: { type: Number, default: 0, min: 0 },
    engagement: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const SalesAttributionSchema = new Schema<SalesAttribution>(
  {
    programId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const UserSchema = new Schema<UserDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String, lowercase: true, trim: true },
    socialHandles: [SocialHandleSchema],
    programs: [
      {
        programId: { type: String, required: true, index: true },
        programName: { type: String, required: true },
      },
    ],
    posts: [SocialPostSchema],
    salesAttributions: [SalesAttributionSchema],
    joinDate: { type: Date },
    totalEngagement: { type: Number, default: 0, min: 0, index: true },
    totalSales: { type: Number, default: 0, min: 0, index: true },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

// Indexes for frequently fetched data
// Single field indexes
UserSchema.index({ createdAt: -1 }); // Default sort by creation date
UserSchema.index({ 'posts.platform': 1 }); // Platform filtering

// Compound indexes for common query patterns
UserSchema.index({ 'programs.programId': 1, totalEngagement: -1 }); // Program filtering + engagement sorting
UserSchema.index({ 'programs.programId': 1, createdAt: -1 }); // Program filtering + date sorting
UserSchema.index({ 'posts.platform': 1, totalEngagement: -1 }); // Platform filtering + engagement sorting
UserSchema.index({ 'posts.platform': 1, createdAt: -1 }); // Platform filtering + date sorting
UserSchema.index({ totalSales: -1, createdAt: -1 }); // Sales filtering/sorting + date sorting
UserSchema.index({ totalEngagement: -1, createdAt: -1 }); // Engagement sorting + date sorting

// Aggregation-specific indexes for analytics performance
UserSchema.index({ 'posts.platform': 1, 'posts.engagement': -1 }); // Platform + engagement for aggregation grouping
UserSchema.index({ 'posts.platform': 1, 'posts.likes': -1 }); // Platform + likes for aggregation
UserSchema.index({ 'posts.platform': 1, 'posts.comments': -1 }); // Platform + comments for aggregation
UserSchema.index({ 'posts.platform': 1, 'posts.shares': -1 }); // Platform + shares for aggregation
UserSchema.index({ 'posts.platform': 1, 'posts.reach': -1 }); // Platform + reach for aggregation
UserSchema.index({ 'salesAttributions.amount': -1 }); // Sales attribution aggregation
UserSchema.index({ 'salesAttributions.programId': 1 }); // Sales attribution by program

// Virtual for total posts count
UserSchema.virtual('postsCount').get(function () {
  return this.posts.length;
});

// Virtual for total sales count
UserSchema.virtual('salesCount').get(function () {
  return this.salesAttributions.length;
});

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
export default UserModel;
