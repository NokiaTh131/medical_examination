import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const rx = express();
const prisma = new PrismaClient();

rx.use(cors());
rx.use(express.json()); // Middleware to parse JSON bodies

// ---------------------------------
// RxList (Medicine) APIs
// ---------------------------------

// Add a new medicine to the RxList
rx.post("/api/rx", async (req, res) => {
  try {
    const { medicalName, quantity, use, note, mexId, unit } = req.body;

    const newMedicine = await prisma.rxList.create({
      data: {
        medicalName,
        quantity,
        use,
        note,
        mexId,
        unit,
      },
    });

    res.send({ message: "Medicine added successfully!", newMedicine });
  } catch (error) {
    res.status(400).send({ message: "Failed to add medicine", error });
  }
});

// Delete a medicine by ID from the RxList
rx.delete("/api/rx/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.rxList.delete({
      where: {
        id: id,
      },
    });

    res.send({ message: "Medicine deleted successfully!" });
  } catch (error) {
    res.status(400).send({ message: "Failed to delete medicine", error });
  }
});

// Get all medicines associated with a specific MEX
rx.get("/api/rx/:mex_id", async (req, res) => {
  try {
    const mexId = parseInt(req.params.mex_id);

    const medicines = await prisma.rxList.findMany({
      where: {
        mexId: mexId,
      },
    });

    res.send({ medicines });
  } catch (error) {
    res.status(400).send({ message: "Failed to fetch medicines", error });
  }
});

export default rx;
