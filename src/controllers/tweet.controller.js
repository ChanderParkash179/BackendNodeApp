import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { APIError } from "../utils/api.error.js"
import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"

const createTweet = async_handler(async (req, res) => {
    //TODO: create tweet
})

const getUserTweets = async_handler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = async_handler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = async_handler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
