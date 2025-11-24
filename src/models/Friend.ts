import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export interface IFriend {
  user: Types.ObjectId;
  friend: Types.ObjectId;
  createdAt: Date;
}

export type FriendDocument = HydratedDocument<IFriend>;
export type FriendModel = Model<IFriend>;

const FriendSchema = new Schema<IFriend, FriendModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    friend: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Ensure a user cannot be friends with the same person twice
FriendSchema.index({ user: 1, friend: 1 }, { unique: true });
FriendSchema.index({ user: 1 }); // For fetching friends list

export const Friend = model<IFriend, FriendModel>('Friend', FriendSchema);
