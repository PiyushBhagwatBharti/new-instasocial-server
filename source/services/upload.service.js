import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AWS = require("aws-sdk");
import { ApiError, ApiResponse } from "../utilities/asyncHandler.util.js";
import { sluggify } from "../utilities/idGenerators.util.js";

// 🔹 S3 Instance
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

/**
 * 🔹 Upload Object (returns signed URL + file URL)
 * @param {Object} params
 * @param {string} params.fileName
 * @param {string} params.fileType
 * @param {string} [params.folder] - optional folder path
 * @param {boolean} [params.isPublic] - public-read or not
 */
const uploadObject = async ({
  fileName,
  fileType,
  folder = "uploads",
  isPublic = true,
}) => {
  try {
    const key = `${folder}/${Date.now()}-${sluggify(fileName)}`;

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 60 * 5, // signed URL expiry (seconds)
    };

    // 👇 only add ACL if public
    // if (isPublic) {
    //   s3Params.ACL = "public-read";
    // }

    const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
};

/**
 * 🔹 Delete Object
 * @param {string} key - full object key (e.g. uploads/123-file.png)
 */
const deleteObject = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    // don't throw to allow safe deletion loop
  }
};

const getPresignedUrl = async (req, res, next) => {
  try {
    const {
      fileName,
      fileType,
      folder = "uploads",
      isPublic = true,
    } = req.body;

    if (!fileName || !fileType) {
      throw new ApiError(400, "fileName and fileType are required");
    }

    const actualFolder = `${req.tenant.domain}/${folder}`;

    const result = await uploadObject({
      fileName,
      fileType,
      folder: actualFolder,
      isPublic,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, result, "Presigned URL generated successfully"),
      );
  } catch (error) {
    console.error("Error generating presigned url:", error);
    throw new ApiError(500, "Failed to generate presigned URL");
  }
};

export { getPresignedUrl, deleteObject };
