import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { APIError } from "../utils/api.error.js"
import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"

const toggleVideoLike = async_handler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
})

const toggleCommentLike = async_handler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = async_handler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = async_handler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}