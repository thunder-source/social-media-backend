import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export interface ILike {
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

export type LikeDocument = HydratedDocument<ILike>;
export type LikeModel = Model<ILike>;

const LikeSchema = new Schema<ILike, LikeModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Ensure a user cannot like the same post twice
LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 }); // For counting likes

export const Like = model<ILike, LikeModel>('Like', LikeSchema);
