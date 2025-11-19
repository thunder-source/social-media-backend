import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export type NotificationType =
  | 'friend_request'
  | 'message'
  | 'like'
  | 'comment';

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  fromUser: Types.ObjectId;
  postId?: Types.ObjectId;
  friendRequestId?: Types.ObjectId;
  message: string;
  read: boolean;
  createdAt?: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;
export type NotificationModel = Model<INotification>;

const NotificationSchema = new Schema<INotification, NotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['friend_request', 'message', 'like', 'comment'],
      required: true,
    },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    friendRequestId: { type: Schema.Types.ObjectId, ref: 'FriendRequest' },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  NotificationSchema
);

