import { Schema, model, Document, Types } from 'mongoose';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: FriendRequestStatus;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const FriendRequest = model<IFriendRequest>('FriendRequest', FriendRequestSchema);

