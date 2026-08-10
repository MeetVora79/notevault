import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";

export const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const name = profile.displayName;

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
          } else {
            user = await User.create({
              name,
              email,
              googleId: profile.id,
            });
          }

          const appAccessToken = generateAccessToken(user._id);
          const appRefreshToken = generateRefreshToken(user._id);

          user.refreshTokens = [
            ...(user.refreshTokens || []),
            appRefreshToken,
          ].slice(-5);
          await user.save();

          return done(null, { user, appAccessToken, appRefreshToken });
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );

  return passport;
};

export default passport;
