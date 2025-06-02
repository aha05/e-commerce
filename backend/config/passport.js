// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Models/User');

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user); // Pass null for error when user is found
        })
        .catch(err => {
            done(err); // Pass the error to the done callback
        });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, function (token, tokenSecret, profile, done) {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return done(err, user);
    });
}));
