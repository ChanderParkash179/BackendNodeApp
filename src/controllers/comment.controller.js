import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { APIError } from "../utils/api.error.js"
import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"

const getVideoComments = async_handler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = async_handler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = async_handler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = async_handler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}