import mongoose from 'mongoose';

type MongooseConnection = typeof mongoose;


const createConnectionOptions = (): mongoose.ConnectOptions => ({
    maxPoolSize: Number(process.env.MONGODB_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 30000,
    autoIndex: process.env.NODE_ENV !== 'production',
});

export const connectDatabase = async (): Promise<MongooseConnection> => {
    const { MONGODB_URI } = process.env;

    if (!MONGODB_URI) {
        throw new Error(
            'MONGODB_URI environment variable is not defined. Please create a .env file with MONGODB_URI=mongodb://localhost:27017/your-database-name'
        );
    }

    try {
        mongoose.set('strictQuery', true);
        const connection = await mongoose.connect(MONGODB_URI, createConnectionOptions());

        connection.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });

        connection.connection.on('disconnected', () => {
            console.warn('MongoDB connection lost.');
        });

        return connection;
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

