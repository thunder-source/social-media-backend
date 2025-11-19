import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest {
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: FriendRequestStatus;
  triggeredFromPostId?: Types.ObjectId;
  createdAt?: Date;
}

export type FriendRequestDocument = HydratedDocument<IFriendRequest>;
export type FriendRequestModel = Model<IFriendRequest>;

const FriendRequestSchema = new Schema<IFriendRequest, FriendRequestModel>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    triggeredFromPostId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

FriendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
FriendRequestSchema.index({ to: 1, status: 1 });

export const FriendRequest = model<IFriendRequest, FriendRequestModel>(
  'FriendRequest',
  FriendRequestSchema
);

