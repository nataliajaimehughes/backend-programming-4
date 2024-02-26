// Implements the favoriteRouter using the Express Router
const express = require('express');
const Favorite = require('../models/favorite');
const { verifyUser } = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, verifyUser, (req, res, next) => { // next is used to handle errors
    Favorite.findOne({ user : req.user._id} )
    .populate('user')
    .populate('campsites')
    .then(favorite => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(favorite);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, verifyUser, (req, res, next) => {
    const campsites = req.body.campsites;
    Favorite.findOne({ user : req.user._id })
    .then(favorite => {
        if(favorite) {
            campsites.forEach(campsite => {
                if(!favorite.campsites.includes(req.params.campsiteId)) {
                    favorite.campsites.push(req.params.campsiteId)
                }
            })
            favorite.save()
            .then(favorite => {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(favorite);
            })
            .catch(err => next(err));
        } else {
            Favorite.create({ user : req.user._id, campsites}) // identical key-value pair simplifies to campsites
            .then(favorite => {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(favorite);
            })
            .catch(err => next(err));
        }
    }) 
})
.put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user : req.user._id })
    .then(response => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(response);
    })
    .catch(err => next(err));
})
favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, verifyUser, (req, res) => {
    const campsites = req.body.campsites;
    Favorite.findOne({ user : req.user._id })
    .then(favorite => {
        if(favorite) {
            campsites.forEach(campsite => {
                if(!favorite.campsites.includes(req.params.campsiteId)) {
                    favorite.campsites.push(req.params.campsiteId)
                    favorite.save()
                    .then(favorite => {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(200).json(favorite);
                    })
                    .catch(err => next(err));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(409).send('This campsite is already in the favorites list.');
                }
                });
        } else {
            Favorite.create({ user : req.user._id, campsites: [req.params.campsiteId]})
            .then(favorite => {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).json(favorite);
            })
            .catch(err => next(err));
        }
    });
})
.put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    Favorite.findOne({ user : req.user._id })
    .then(favorite => {
        if (favorite) {
            const index = favorite.campsites.indexOf(req.params.campsiteId);
            if(index !== -1) {
                favorite.campsites.splice(index, 1);
                favorite.save()
                .then(favorite => {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).json(favorite);
                })
                .catch(err => next(err));
            } else {
                res.setHeader('Content-Type', 'text/plain');
                res.status(404).send('Campsite was not found in your favorites list.');
            }
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.status(404).send('You do not have any favorites to delete.');
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;

