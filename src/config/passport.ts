import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from '../models/User';

export const configurePassport = (): void => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID ?? '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
                callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '/auth/google/callback',
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const existingUser = await User.findOne({ googleId: profile.id });

                    if (existingUser) {
                        return done(null, existingUser);
                    }

                    const newUser = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails?.[0]?.value,
                    });

                    return done(null, newUser);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );

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

