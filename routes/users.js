const express = require('express');
const User = require('../models/user')
const passport = require('passport');
const { getToken, verifyUser, verifyAdmin } = require('../authenticate');
const cors = require('./cors');

const router = express.Router();

router.get('/', cors.corsWithOptions, verifyUser, verifyAdmin, function(req, res, next) {
  User.find().then(users => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.json(users)
  }).catch(err => next(err))
});

router.post('/signup', cors.corsWithOptions, (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    err => {
      if(err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        return res.json({ err })
      }
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.json({ success: true, status: 'Registration successful!'})
      })
    }
  )
})

router.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
  const token = getToken({ _id: req.user._id })
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.json({ success: true, token, status: 'You are successfully logged in!'})
})

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
      const token = getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});


module.exports = router;