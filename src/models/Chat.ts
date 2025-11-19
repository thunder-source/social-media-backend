import { Schema, model, Document, Types } from 'mongoose';

export interface IChat extends Document {
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
}

const ChatSchema = new Schema<IChat>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    },
    { timestamps: true }
);

export const Chat = model<IChat>('Chat', ChatSchema);

