// Implements the favoriteRouter using the Express Router
const express = require('express');
const Favorite = require('../models/favorite');
const { verifyUser, verifyAdmin }= require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.find()
            .populate('comments.author')
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.create(req.body)
            .then(favorite => {
                console.log('Favorite Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });
favoriteRouter.route('/:favoriteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .populate('comments.author')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /favorites/${req.params.favoriteId}`);
    })
    .put(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.findByIdAndUpdate(req.params.favoriteId, {
            $set: req.body
        }, { new: true })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.findByIdAndDelete(req.params.favoriteId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });
favoriteRouter.route('/:favoriteId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .populate('comments.author')
            .then(favorite => {
        //openssl version                
        if (favorite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite.comments);
        } else {
            err = new Error(`Favorite ${req.params.favoriteId} not found`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
        
    })
    .post(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .then(favorite => {
                if (favorite) {
                    req.body.author = req.user._id;
                    favorite.comments.push(req.body);
                    favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Favorite ${req.params.favoriteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.favoriteId}/comments`);
    })
    .delete(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .then(favorite => {
                if (favorite) {
                    for (let i = (favorite.comments.length - 1); i >= 0; i--) {
                        favorite.comments.id(favorite.comments[i]._id).remove();
                    }
                    favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Favorite ${req.params.favoriteId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });
favoriteRouter.route('/:favoriteId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .populate('comments.author')
            .then(favorite => {
                if (favorite && favorite.comments.id(req.params.commentId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite.comments.id(req.params.commentId));
                } else if (!favorite) {
                    err = new Error(`Favorite ${req.params.favoriteId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, verifyUser, verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /favorites/${req.params.favoriteId}/comments/${req.params.commentId}`);
    })
    .put(cors.corsWithOptions, verifyUser, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .then(favorite => {
                if (req.user._id.equals(favorite.comments.id(req.params.commentId).author)) {
                    if (favorite && favorite.comments.id(req.params.commentId)) {
                        if (req.body.rating) {
                            favorite.comments.id(req.params.commentId).rating = req.body.rating;
                        }
                        if (req.body.text) {
                            favorite.comments.id(req.params.commentId).text = req.body.text;
                        }
                        favorite.save()
                            .then(favorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch(err => next(err));
                    } else {
                        const err = new Error('Comment not found');
                        err.status = 404;
                        return next(err);
                    }
                } else {
                    const err = new Error(`Favorite ${req.params.favoriteId} or Comment ${req.params.commentId} not found`);
                    err.status = 403;
                    res.setHeader('Content-Type', 'text/plain');
                    return next(err);
                }
            })
            .catch(err => next(err));
    })

    .delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .then(favorite => {
                if (favorite && favorite.comments.id(req.params.commentId)) {
                    if (req.user._id.equals(favorite.comments.id(req.params.commentId).author)) {
                        favorite.comments.id(req.params.commentId).remove();
                        favorite.save()
                            .then(favorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch(err => next(err));
                    } else {
                        const err = new Error('You are not the author of the comment');
                        err.status = 403;
                        res.setHeader('Content-Type', 'text/plain');
                        return next(err);
                    }
                } else {
                    const err = new Error(`Favorite ${req.params.favoriteId} or Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

module.exports = favoriteRouter;
