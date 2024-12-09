import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const app = express();
const PORT = 3001;
const prisma = new PrismaClient();
app.use(cors());

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

async function uploadImageToS3(file, fileName) {
  const resizedImageBuffer = await sharp(file).toBuffer();

  const params = {
    Bucket: process.env.AMPLIFY_BUCKET,
    Key: `${fileName}`,
    Body: resizedImageBuffer,
    ContentType: "image/jpeg",
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

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
    const allimages = await prisma.exPhoto.findMany({
      where: { mexId: Number(id) },
      orderBy: { id: "asc" },
    });
    const imagesWithUrls = await Promise.all(
      allimages.map(async (image) => {
        const getObjectParams = {
          Bucket: process.env.AMPLIFY_BUCKET,
          Key: image.photo,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 60 * 5,
        });
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
    const deleteParams = {
      Bucket: process.env.AMPLIFY_BUCKET,
      Key: image?.photo,
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
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
