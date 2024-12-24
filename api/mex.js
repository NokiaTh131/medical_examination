import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const mex = express();
const prisma = new PrismaClient();
mex.use(cors());
mex.use(express.json()); // Middleware to parse JSON bodies

mex.get(`/`, (req, res) => {
  res.send("HelloWorld");
});

mex.post("/api/addmex", async (req, res) => {
  try {
    const {
      docID,
      hn,
      chiefComplaint,
      presentHistory,
      examination,
      dx,
      rx,
      procedure,
      appointment,
      date,
    } = req.body;
    const newMEX = await prisma.mEX.create({
      data: {
        docID,
        hn,
        chiefComplaint,
        presentHistory,
        examination,
        dx,
        rx,
        procedure,
        appointment, // Optional field
        date: new Date(date),
      },
    });
    res.send({ newMEX });
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

mex.get("/api/getallmex", async (req, res) => {
  try {
    const allMex = await prisma.mEX.findMany({
      select: {
        hn: true,
        chiefComplaint: true,
        rx: true,
        procedure: true,
        date: true,
        User: {
          // Assuming the related table is `User` and contains the doctor's name
          select: {
            fName: true, // Replace `name` with the actual field in the related table
            lName: true,
          },
        },
      },
    });
    res.send(allMex);
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

mex.get("/api/getmex", async (req, res) => {
  try {
    const id = parseInt(req.query.id); // Convert `id` to an integer (if necessary)

    const mex = await prisma.mEX.findUnique({
      where: {
        id: id, // Find MEX by ID
      },
      include: {
        User: {
          // Include User (doctor) related to the MEX
          select: {
            fName: true, // First name of the doctor
            lName: true, // Last name of the doctor
            MedicalCertificate: {
              // Include the related MedicalCertificate
              select: {
                medicalLicense: true, // Assuming medical license is the field you need
              },
            },
          },
        },
      },
    });

    if (!mex) {
      return res.status(404).send({ message: "MEX not found" });
    }

    res.send(mex);
  } catch (error) {
    console.error("Error fetching MEX:", error);
    res.status(400).send({ message: "Error fetching MEX", error });
  }
});

mex.put("/api/updatemex/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id); // Get the ID from the request params
    const data = req.body;

    // Update the MEX record with the provided data
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

mex.delete(`/api/deletemex`, async (req, res) => {
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

export default mex;
