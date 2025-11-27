import { Schema, Types, model, HydratedDocument, Model } from 'mongoose';

export interface IChat {
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    updatedAt?: Date;
}

export type ChatDocument = HydratedDocument<IChat>;
export type ChatModel = Model<IChat>;

const ChatSchema = new Schema<IChat, ChatModel>(
    {
        participants: {
            type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
            validate: {
                validator: (value: Types.ObjectId[]) =>
                    Array.isArray(value) && value.length === 2,
                message: 'Chat must include exactly two participants.',
            },
        },
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        toJSON: { virtuals: true, versionKey: false },
        toObject: { virtuals: true, versionKey: false },
    }
);

ChatSchema.pre('validate', function (this: ChatDocument, next) {
    if (Array.isArray(this.participants)) {
        this.participants = this.participants
            .map((id) => new Types.ObjectId(id))
            .sort((a, b) => a.toString().localeCompare(b.toString()));
    }
    next();
});

// Compound unique index on sorted participants array to prevent duplicate chats
// This ensures that a chat between user A and user B is unique
// but allows each user to participate in multiple different chats
ChatSchema.index({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });
ChatSchema.index({ participants: 1, updatedAt: -1 });
ChatSchema.index({ updatedAt: -1 });

export const Chat = model<IChat, ChatModel>('Chat', ChatSchema);

