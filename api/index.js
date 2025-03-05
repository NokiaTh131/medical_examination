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
import { swaggerUi, swaggerSpec } from "../swagger.js";
dotenv.config();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const app = express();
const PORT = 5004;
const prisma = new PrismaClient();
app.use(cors());
app.use(mex);
app.use(rx);
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
  // endPoint: "s3.ap-southeast-1.amazonaws.com",
  // accessKey: process.env.AWS_ACCESS_KEY_ID,
  // secretKey: process.env.AWS_SECRET_ACCESS_KEY,
  // region: process.env.AWS_REGION, //remove this when use local endpoint
  endPoint: process.env.ENDPOINT, // MinIO server address
  port: 9400,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY_ID,
  secretKey: process.env.MINIO_SECRET_ACCESS_KEY,
});

const objectbucket = process.env.AMPLIFY_BUCKET;

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
  await minioClient.putObject(objectbucket, fileName, file, {
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline",
  });
  return fileName;
}

/**
 * @swagger
 * /api/file/{id}:
 *   post:
 *     tags:
 *       - Examination pdf file
 *     summary: Upload a file and update examination record
 *     description: Uploads a file to S3 and updates the `examination_filename` field in the database for a specific MEX record.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX record to update.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *     responses:
 *       200:
 *         description: File uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: File is required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "File blob is required."
 *       500:
 *         description: Internal server error while uploading file.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error uploading file"
 */

app.post("/exam/api/file/:id", upload.single("file"), async (req, res) => {
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
/**
 * @swagger
 * /api/file/{mex_id}:
 *   get:
 *     tags:
 *       - Examination pdf file
 *     summary: Retrieve file URLs for a specific MEX record file
 *     description: Fetches the examination file associated with a given MEX ID and returns a pre-signed URL for downloading.
 *     parameters:
 *       - in: path
 *         name: mex_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX record whose file URLs need to be retrieved.
 *     responses:
 *       200:
 *         description: Successfully retrieved file URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileUrl:
 *                     type: string
 *                     format: uri
 *                     example: "https://s3.example.com/bucket/file.pdf"
 *       400:
 *         description: Error loading image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error loading image"
 */

app.get("/exam/api/file/:mex_id", async (req, res) => {
  try {
    const id = req.params.mex_id;
    const files = await prisma.mEX.findMany({
      where: { id: Number(id) },
    });
    const fileWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await minioClient.presignedGetObject(
          objectbucket,
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

/**
 * @swagger
 * /api/file/{mex_id}:
 *   delete:
 *     tags:
 *       - Examination pdf file
 *     summary: Delete an examination file for a specific MEX record
 *     description: Deletes the examination file associated with a given MEX ID from storage and updates the record.
 *     parameters:
 *       - in: path
 *         name: mex_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX record whose file needs to be deleted.
 *     responses:
 *       200:
 *         description: Successfully deleted the file.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "file deleted"
 *       400:
 *         description: Error while deleting the file.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "error while delete"
 */

app.delete("/exam/api/file/:mex_id", async (req, res) => {
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
      objectbucket,
      String(file.examination_filename)
    );
    res.send({ message: "file deleted" });
  } catch (error) {
    res.status(400).send({ message: "error while delete" });
  }
});

app.get("/exam/api-docs.json", (req, res) => {
  res.json(swaggerSpec); // This will return the Swagger JSON
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://10.10.184.148:${PORT}`);
});

export default app;
