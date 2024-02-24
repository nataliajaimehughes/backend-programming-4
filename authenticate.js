const passport = require('passport')
const User = require('./models/user')
const config = require('./config')

const LocalStrategy = require('passport-local').Strategy

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')

const FacebookTokenStrategy = require('passport-facebook-token');


passport.use(new LocalStrategy(User.authenticate()))

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.secretKey
}
passport.use(
    new JwtStrategy(
        opts,
        (jwt_payload, done) => {
            User.findOne({ _id: jwt_payload._id }).then(user => {
                if(!user) return done(null, false)
                return done(null, user)
            }).catch(err => done(err, null))
        }
    )
)

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

exports.getToken = user => {
    return jwt.sign(user, config.secretKey, { expiresIn: "1h" })
}

exports.verifyUser = passport.authenticate('jwt', { session: false })

exports.verifyAdmin = (req, res, next) => {
    if (req.user.admin) {
        return next()
    }
    const err = new Error('You are not authorized to perform this operation!')
    err.status = 403
    return next(err)
}

passport.use(
    new FacebookTokenStrategy(
        {
            clientID: config.facebook.clientId,
            clientSecret: config.facebook.clientSecret
        }, 
        (accessToken, refreshToken, profile, done) => {
            User.findOne({facebookId: profile.id}, (err, user) => {
                console.error('Error during user lookup:', err);
                if (err) {
                    return done(err, false);
                }
                if (!err && user) {
                    return done(null, user);
                } else {
                    user = new User({ username: profile.displayName });
                    user.facebookId = profile.id;
                    user.firstname = profile.name.givenName;
                    user.lastname = profile.name.familyName;
                    user.save((err, user) => {
                        if (err) {
                            return done(err, false);
                        } else {
                            return done(null, user);
                        }
                    });
                }
            });
        }
    )
);
