import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { APIError } from "../utils/api.error.js"
import { APIResponse } from "../utils/api.response.js"
import { async_handler } from "../utils/async.handler.js"


const createPlaylist = async_handler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
})

const getUserPlaylists = async_handler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
})

const getPlaylistById = async_handler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = async_handler(async (req, res) => {
    const { playlistId, videoId } = req.params
})

const removeVideoFromPlaylist = async_handler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = async_handler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
})

const updatePlaylist = async_handler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
