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
  pushSubscription?: any;
  _id?: boolean;
}

export type UserDocument = HydratedDocument<IUser>;
export type UserModel = Model<IUser>;

const UserSchema = new Schema<IUser, UserModel>(
  {
    googleId: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    email: {
      type: String,
      required: true,
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
    pushSubscription: {
      type: Object, // Store the whole subscription object
      default: null,
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

// Define indexes explicitly to avoid duplicates
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ name: 1 });

export const User = model<IUser, UserModel>('User', UserSchema);

