import axios from "axios";
import formData from "form-data";
import fs from "fs";
import { ApiError } from "./asyncHandler.util.js";

export const uploadImage = async (input, savePath) => {
  if (!input || !input.buffer) {
    throw new ApiError(400, "Image is required");
  }
  const baseFolder = process.env.AWS_BASE_FOLDER;

  let buffer;
  let filename = "image.jpg";
  let mimetype = "image/jpeg";

  // Handle different input types
  if (input instanceof ArrayBuffer) {
    // From Puppeteer screenshot
    buffer = Buffer.from(input);
    console.info(
      `wasArray Trying to upload ArrayBuffer (${buffer.length} bytes)...`,
    );
  } else if (Buffer.isBuffer(input)) {
    // Already a Buffer
    buffer = input;
    console.info(
      `wasBuffer Trying to upload Buffer (${buffer.length} bytes)...`,
    );
  } else if (input.buffer) {
    // From Multer file upload
    buffer = input.buffer;
    filename = input.originalname ?? "image.jpg";
    mimetype = input.mimetype || "image/jpeg";
    console.info(`wasMulter Trying to upload ${input.originalname}...`);
  } else {
    throw new ApiError(400, "Invalid image input type");
  }

  try {
    const uploadData = new formData();
    uploadData.append("file", buffer, {
      filename,
      contentType: mimetype,
    });
    if (!baseFolder) {
      throw new Error("Cannot uplaod image, no base folder found");
    }

    const uploadResult = await axios.post(
      `https://insta-cloud-service.onrender.com/api/image/upload?folderKey=${baseFolder}/images/${savePath}`,
      uploadData,
      {
        headers: {
          ...uploadData.getHeaders(),
          "x-instacloud-api-key": process.env.INSTACLOUD_S3_API_KEY,
          "Content-Type": "image/png", // or application/pdf
          "Content-Length": buffer.Length,
        },
      },
    );

    console.info(`File uploaded successfully ${filename}`, uploadResult.data);

    return {
      url: uploadResult.data.imageUrl,
      publicId: uploadResult.data.imageName,
    };
  } catch (error) {
    console.error("Image upload fail:", error.message);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to upload image",
      error,
    );
  }
};
