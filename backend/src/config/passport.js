import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from './env.js';
import logger from '../utils/logger.js';

const getDb = () => mongoose.connection.db;

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const usersCollection = getDb().collection('users');
        const email = profile.emails[0].value;

        // Check karo user already exist karta hai
        let user = await usersCollection.findOne({ email });

        if (user) {
          // Already registered — seedha login
          logger.info(`Google login: existing user ${email}`);
          return done(null, user);
        }

        // Naya user banao — default role patient
        const newUser = {
        id: `google-${profile.id}`,
        email,
        full_name: profile.displayName,
        role: 'pending',  // ← Role select karna baaki hai
        auth_provider: 'google',
        google_id: profile.id,
        is_active: true,
        otp_verified: true,
        phone_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        };

        await usersCollection.insertOne(newUser);
        logger.info(`Google signup: new user created ${email}`);
        return done(null, newUser);

      } catch (error) {
        logger.error('Google OAuth strategy error:', error);
        return done(error, null);
      }
    }
  )
);

export default passport;