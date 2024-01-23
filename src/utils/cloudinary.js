import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { IMAGE_EXTENSIONS } from '../constants.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});


const uploadOnCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;

    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto"
    });

    console.log(`📂 file is uploaded on cloudinary successfully! URL: [${response.url}]`);
    fs.unlinkSync(localpath);
    return response;
  } catch (error) {
    fs.unlinkSync(localpath);
    return null;
  }
}

const removeFromCloudinary = async (url, path) => {
  try {
    const fileExtension = url.split('.').pop().toLowerCase();
    const res_type = (IMAGE_EXTENSIONS.includes(fileExtension)) ? "image" : "auto";
    const image = url.match(/\/([^\/]+)\.[^\/]+$/)[1];

    let response = "";
    const search = await searchOnCloudinary(image);

    if (search.resources.lengt !== 0) {
      response = await cloudinary.api
        .delete_resources(
          [image],
          {
            type: 'upload',
            resource_type: res_type
          }
        );
    }

    return response;
  } catch (error) {
    fs.unlinkSync(path);
    console.log(error)
    return null;
  }
}

const searchOnCloudinary = async (image) => {
  try {
    const search = await cloudinary.search
      .expression(image.concat("*"))
      .sort_by('created_at', 'desc')
      .execute();

    return search;
  } catch (error) {
    fs.unlinkSync(path);
    console.log(error)
    return null;
  }
}

export { uploadOnCloudinary, removeFromCloudinary, searchOnCloudinary }