import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; deprecate
import sharp from "sharp";
import crypto from "crypto";
import mex from "./mex.js";
import rx from "./rx.js";
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
app.use(rx);
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

async function uploadFileToS3(file, fileName) {
  /*minIO version*/
  await minioClient.putObject(process.env.AMPLIFY_BUCKET, fileName, file);
  return fileName;
}

app.post("/pdf/:id", upload.single("file"), async (req, res) => {
  try {
    const mex_id = req.params.id;
    const file = req.file;
    if (!file) {
      return res.status(400).send({ error: "File blob is required." });
    }
    if (file) {
      const buffer = file.buffer;
      const filename = file.originalname;
      await prisma.mEX.update({
        where: {
          id: Number(mex_id),
        },
        data: {
          examination_filename: filename,
        },
      });
      await uploadFileToS3(buffer, filename);
    }
    console.log("upload was success");
    return res.send({ success: true });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.send({ message: "Error uploading file" });
  }
});

//get specific single url to download examination file
app.get("/pdf/:mex_id", async (req, res) => {
  try {
    const id = req.params.mex_id;
    const files = await prisma.mEX.findMany({
      where: { id: Number(id) },
    });
    const fileWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await minioClient.presignedGetObject(
          process.env.AMPLIFY_BUCKET,
          file.examination_filename,
          30
        );
        return {
          fileUrl: url,
        };
      })
    );
    return res.send(fileWithUrls);
  } catch (error) {
    return res.status(400).send({ message: "Error loading image" });
  }
});

app.delete("/pdf/:mex_id", async (req, res) => {
  try {
    const mex_id = req.params.mex_id;
    const file = await prisma.mEX.findUnique({
      where: { id: Number(mex_id) },
    });
    await prisma.mEX.update({
      where: {
        id: Number(mex_id),
      },
      data: {
        examination_filename: "examination was deleted",
      },
    });

    await minioClient.removeObject(
      process.env.AMPLIFY_BUCKET,
      String(file.examination_filename)
    );
    res.send({ message: "file deleted" });
  } catch (error) {
    res.status(400).send({ message: "error while delete" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
