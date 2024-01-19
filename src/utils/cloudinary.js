import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

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
    return response;
  } catch (error) {
    fs.unlinkSync(localpath);
    return null;
  }
}

export { uploadOnCloudinary }