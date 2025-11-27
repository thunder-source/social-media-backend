import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export interface IMessage {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  readBy?: Types.ObjectId[];
  createdAt?: Date;
}

export type MessageDocument = HydratedDocument<IMessage>;
export type MessageModel = Model<IMessage>;

const MessageSchema = new Schema<IMessage, MessageModel>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, readBy: 1 });

export const Message = model<IMessage, MessageModel>('Message', MessageSchema);

