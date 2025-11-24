import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export type MediaType = 'image' | 'video' | null;

export interface IPostComment {
  userId: Types.ObjectId;
  text: string;
  createdAt?: Date;
}

export interface IPost {
  userId: Types.ObjectId;
  text: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  likesCount?: number;
  comments?: IPostComment[];
  createdAt?: Date;
  updatedAt?: Date;
  commentsCount?: number;
}

export type PostDocument = HydratedDocument<IPost>;
export type PostModel = Model<IPost>;

const CommentSchema = new Schema<IPostComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost, PostModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2200,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', null],
      default: null,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: {
      type: [CommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

PostSchema.virtual('commentsCount').get(function (this: PostDocument) {
  return this.comments?.length ?? 0;
});

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'comments.userId': 1 });

export const Post = model<IPost, PostModel>('Post', PostSchema);

