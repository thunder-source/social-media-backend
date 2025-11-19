import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export interface IUser {
  googleId?: string;
  email: string;
  name: string;
  photo?: string;
  password?: string;
  friends?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  friendsCount?: number;
}

export type UserDocument = HydratedDocument<IUser>;
export type UserModel = Model<IUser>;

const UserSchema = new Schema<IUser, UserModel>(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    friends: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

UserSchema.virtual('friendsCount').get(function (this: UserDocument) {
  return this.friends?.length ?? 0;
});

UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ name: 1 });

export const User = model<IUser, UserModel>('User', UserSchema);

