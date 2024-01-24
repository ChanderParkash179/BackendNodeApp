import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/api.error.js"
import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"
import { STATUS_CODE } from '../constants.js';

const createTweet = async_handler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body;

    const created = await Tweet.create({
        content,
        owner: req.user?._id
    });

    const tweet = await Tweet.populate(
        created,
        {
            path: 'owner',
            model: User,
            select: {
                password: 0,
                refreshToken: 0,
                watchHistory: 0,
                _id: 0,
                createdAt: 0,
                updatedAt: 0,
                username: 0,
                __v: 0,
            }
        }
    );

    return res
        .status(201)
        .json(
            new APIResponse(
                STATUS_CODE.CREATED,
                tweet,
                'user tweet is tweeted successfully!'
            )
        )
});

const getUserTweets = async_handler(async (req, res) => {
    // TODO: get user tweets

    const userId = req.params.userId;

    const user = await Tweet.find({ owner: userId });

    return res
        .status(200)
        .json(
            new APIResponse(
                STATUS_CODE.OK,
                user,
                "tweets found successfully against the provided user!"
            )
        )
})

const updateTweet = async_handler(async (req, res) => {
    //TODO: update tweet

    const id = req.params.tweetId;
    const { content } = req.body;

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: id,
            owner: req.user._id
        },
        {
            content
        },
        {
            new: true
        }
    );

    if (!tweet) throw new APIError(STATUS_CODE.NOT_FOUND, "no tweet found for delete!");

    return res
        .status(201)
        .json(
            new APIResponse(
                STATUS_CODE.CREATED,
                tweet,
                "tweet updated successfully!"
            )
        );
})

const deleteTweet = async_handler(async (req, res) => {
    //TODO: delete tweet

    const id = req.params.tweetId;

    const tweet = await Tweet.findOneAndDelete({
        _id: id,
        owner: req.user._id
    });

    if (!tweet) throw new APIError(STATUS_CODE.NOT_FOUND, "no tweet found for delete!");

    return res
        .status(200)
        .json(
            new APIResponse(
                STATUS_CODE.OK,
                {},
                "tweet deleted successfully!"
            )
        );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}