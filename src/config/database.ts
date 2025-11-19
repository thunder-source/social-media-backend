import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<typeof mongoose> => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not defined');
    }

    mongoose.set('strictQuery', true);

    return mongoose.connect(uri);
};

