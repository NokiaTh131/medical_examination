import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; deprecate
import sharp from "sharp";
import crypto from "crypto";
import mex from "./mex.js";
import * as Minio from "minio";
// import {
//   S3Client,
//   PutObjectCommand,
//   GetObjectCommand,
//   DeleteObjectCommand,
// } from "@aws-sdk/client-s3"; deprecate
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const app = express();
const PORT = 3001;
const prisma = new PrismaClient();
app.use(cors());
app.use(mex);
app.use(express.json());

//aws client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

//minIO client
const minioClient = new Minio.Client({
  endPoint: "s3.ap-southeast-1.amazonaws.com",
  //local endpoint
  //endPoint: "play.min.io",
  //port: 9000,
  useSSL: true,
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY,
  // accessKey: "minioadmin", // Replace with your MinIO access key
  // secretKey: "minioadmin",
  region: process.env.AWS_REGION, //remove this when use local endpoint
});

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

async function uploadImageToS3(file, fileName) {
  const resizedImageBuffer = await sharp(file).toBuffer();

  /* s3 version
  const params = {
    Bucket: process.env.AMPLIFY_BUCKET,
    Key: `${fileName}`,
    Body: resizedImageBuffer,
    ContentType: "image/jpeg",
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  */

  /*minIO version*/
  await minioClient.putObject(
    process.env.AMPLIFY_BUCKET,
    fileName,
    resizedImageBuffer
  );

  return fileName;
}
// upload
app.post("/images/upload/:id", upload.array("file", 12), async (req, res) => {
  try {
    const mex_id = req.params.id;
    const files = req.files;
    if (!files) {
      return res.json({ error: "File blob is required." }, { status: 400 });
    }
    const uploadFiles = [];
    for (const file of files) {
      if (file) {
        const fileGenname = generateFileName();
        const buffer = file.buffer;
        const fileName = await uploadImageToS3(buffer, fileGenname);
        await prisma.exPhoto.create({
          data: {
            photo: fileGenname,
            mexId: Number(mex_id),
          },
        });
        uploadFiles.push(fileName);
      }
    }
    console.log("upload was success");
    return res.send({ success: true, uploadFiles });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.send({ message: "Error uploading image" });
  }
});

app.get("/images/:mexid", async (req, res) => {
  try {
    const id = req.params.mexid;
    const all_images = await prisma.exPhoto.findMany({
      where: { mexId: Number(id) },
      orderBy: { id: "asc" },
    });
    const imagesWithUrls = await Promise.all(
      all_images.map(async (image) => {
        // const getObjectParams = { // this use when aws-sdk s3 version directly
        //   Bucket: process.env.AMPLIFY_BUCKET,
        //   Key: image.photo,
        // };
        // const command = new GetObjectCommand(getObjectParams);
        // const url = await getSignedUrl(s3Client, command, {
        //   expiresIn: 60 * 5,
        // });
        const url = await minioClient.presignedGetObject(
          process.env.AMPLIFY_BUCKET,
          image.photo,
          60 * 60
        );
        return {
          ...image,
          imageUrl: url,
        };
      })
    );

    return res.send(imagesWithUrls);
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(400).send({ message: "Error loading image" });
  }
});

app.delete("/images/:mexId/delete", async (req, res) => {
  try {
    const mex_id = req.params.mexId;
    const id = req.query.id;
    const image = await prisma.exPhoto.findUnique({
      where: { id: Number(id), mexId: Number(mex_id) },
    });
    //this use when use aws-sdk s3 version
    // const deleteParams = {
    //   Bucket: process.env.AMPLIFY_BUCKET,
    //   Key: image?.photo,
    // };
    // await s3Client.send(new DeleteObjectCommand(deleteParams));
    await minioClient.removeObject(process.env.AMPLIFY_BUCKET, image.photo);
    await prisma.exPhoto.delete({
      where: { id: Number(id), mexId: Number(mex_id) },
    });
    res.send({ message: "Project deleted" });
  } catch (error) {
    res.status(400).send({ message: "error while delete" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
