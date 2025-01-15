import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const mex = express();
const prisma = new PrismaClient();
mex.use(cors());
mex.use(express.json()); // Middleware to parse JSON bodies

mex.post("/api/mex", async (req, res) => {
  try {
    const {
      docID,
      hn,
      chiefComplaint,
      presentHistory,
      dx,
      procedure,
      appointment,
    } = req.body;
    const newMEX = await prisma.mEX.create({
      data: {
        docID,
        hn,
        chiefComplaint,
        presentHistory,
        dx,
        procedure,
        appointment,
        date: new Date(),
        examination_filename: "No examination",
      },
    });
    res.send({ newMEX });
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

//get all mex of interest patient
mex.get("/api/mex/:patient_id", async (req, res) => {
  try {
    const id = req.params.patient_id;
    const allMex = await prisma.mEX.findMany({
      where: {
        hn: Number(id),
      },
      select: {
        id: true,
        hn: true,
        date: true,
        User: {
          select: {
            fName: true,
            lName: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    res.send(allMex);
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

//get specific medical examination
mex.get("/api/mex", async (req, res) => {
  try {
    //mex_id
    const id = parseInt(req.query.id);
    const data = await fetch(`http://localhost:3001/file/${id}`, {
      method: "GET",
    });
    const download_url = await data.json();
    const mex = await prisma.mEX.findUnique({
      where: {
        id: id,
      },
      include: {
        patientRecord: {
          select: {
            bloodPressure: true,
            temperature: true,
            respiratoryRate: true,
          },
        },
        User: {
          select: {
            fName: true,
            lName: true,
            MedicalCertificate: {
              select: {
                medicalLicense: true, // medical license is the field you need
              },
            },
          },
        },
      },
    });

    if (!mex) {
      return res.status(404).send({ message: "MEX not found" });
    }
    const record_info = {
      ...mex,
      download_url,
    };

    res.send(record_info);
  } catch (error) {
    console.error("Error fetching MEX:", error);
    res.status(400).send({ message: "Error fetching MEX", error });
  }
});

mex.put("/api/mex/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedMEX = await prisma.mEX.update({
      where: {
        id: id,
      },
      data,
    });

    res.send({ updatedMEX });
  } catch (error) {
    console.error("Error during update:", error);
    res.status(400).send({ message: "Error updating MEX", error });
  }
});

//api fetch from patient information group
mex.get("/patient/:patient_id", async (req, res) => {
  //get patient by id
  const patient_id = req.params.patient_id;
  res.send({ patient_id: patient_id });
});

mex.delete(`/api/mex`, async (req, res) => {
  try {
    const id = parseInt(req.query.id); // Convert `id` to an integer (if necessary)
    await prisma.mEX.delete({
      where: {
        id: id, // Find MEX by ID
      },
    });

    res.send({ message: "Delete Success!" });
  } catch (error) {
    console.error("Error during delete:", error);
    res.status(400).send({ message: "Error to delete MEX", error });
  }
});

//add patient record to database
mex.post("/api/patient_record/:mex_id", async (req, res) => {
  try {
    const mexId = parseInt(req.params.mex_id);
    const { bloodPressure, temperature, respiratoryRate } = req.body;
    const newPatientRecord = await prisma.patientRecord.create({
      data: {
        bloodPressure,
        temperature,
        respiratoryRate,
        mexId,
      },
    });

    res.send({ newPatientRecord });
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

//get single patient record of interest medical examination
mex.get("/api/patient_record/:mex_id", async (req, res) => {
  try {
    const mex_id = req.params.mex_id;
    const Record = await prisma.patientRecord.findMany({
      where: {
        mexId: Number(mex_id),
      },
    });
    res.send(Record);
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

export default mex;
