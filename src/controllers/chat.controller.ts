import { Request, Response, NextFunction } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';

class ChatController {
  startChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { participants } = req.body;

      if (!Array.isArray(participants) || participants.length !== 2) {
        res.status(400).json({ message: 'Exactly two participants are required.' });
        return;
      }

      const chat = await Chat.create({ participants });

      res.status(201).json(chat);
    } catch (error) {
      next(error);
    }
  };

  getChatMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { chatId } = req.params;
      const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
      res.json(messages);
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController();

