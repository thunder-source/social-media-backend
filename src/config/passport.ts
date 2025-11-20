import passport from 'passport';
import { Profile, Strategy as GoogleStrategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import { User, IUser } from '../models/User';

const createGoogleStrategyOptions = (): StrategyOptions => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials are not defined in environment variables');
    }

    return {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL ?? '/api/auth/google/callback',
    };
};

const verifyGoogleProfile = async (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback
): Promise<void> => {
    try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            return done(null, existingUser);
        }

        const newUser = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            photo: profile.photos?.[0]?.value,
        });

        return done(null, newUser);
    } catch (error) {
        return done(error);
    }
};

export const configurePassport = (): void => {
    passport.use(new GoogleStrategy(createGoogleStrategyOptions(), verifyGoogleProfile));

    passport.serializeUser((user, done) => {
        done(null, (user as IUser)._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error as Error, null);
        }
    });
};

