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

/**
 * @swagger
 * /api/rx:
 *   post:
 *     tags:
 *       - Prescription Record
 *     summary: Add a new medicine to the prescription list
 *     description: Creates a new medicine entry with details such as name, quantity, usage instructions, and notes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicalName:
 *                 type: string
 *                 description: Name of the medicine.
 *                 example: "Paracetamol"
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the medicine.
 *                 example: 10
 *               use:
 *                 type: string
 *                 description: Usage instructions.
 *                 example: "Take one tablet every 6 hours"
 *               note:
 *                 type: string
 *                 description: Additional notes.
 *                 example: "Avoid alcohol while taking this medicine"
 *               mexId:
 *                 type: integer
 *                 description: The ID of the medical examination record this medicine is linked to.
 *                 example: 123
 *               unit:
 *                 type: string
 *                 description: Unit of measurement for the quantity.
 *                 example: "tablets"
 *     responses:
 *       200:
 *         description: Successfully added the medicine.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medicine added successfully!"
 *                 newMedicine:
 *                   type: object
 *                   description: The newly created medicine entry.
 *       400:
 *         description: Failed to add medicine due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to add medicine"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
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
/**
 * @swagger
 * /api/rx/{id}:
 *   delete:
 *     tags:
 *       - Prescription Record
 *     summary: Delete a medicine entry from the prescription list
 *     description: Deletes a specific medicine entry by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the medicine entry to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted the medicine.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Medicine deleted successfully!"
 *       400:
 *         description: Failed to delete medicine due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete medicine"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
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
/**
 * @swagger
 * /api/rx/{mex_id}:
 *   get:
 *     tags:
 *       - Prescription Record
 *     summary: Retrieve all medicines for a specific medical examination record
 *     description: Fetches a list of medicines associated with a given medical examination ID (mex_id).
 *     parameters:
 *       - in: path
 *         name: mex_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the medical examination record.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of medicines.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medicines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       medicalName:
 *                         type: string
 *                         example: "Paracetamol"
 *                       quantity:
 *                         type: integer
 *                         example: 10
 *                       use:
 *                         type: string
 *                         example: "Take one tablet every 6 hours"
 *                       note:
 *                         type: string
 *                         example: "Avoid alcohol while taking this medicine"
 *                       mexId:
 *                         type: integer
 *                         example: 123
 *                       unit:
 *                         type: string
 *                         example: "tablets"
 *       400:
 *         description: Failed to fetch medicines due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch medicines"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
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
