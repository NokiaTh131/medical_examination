import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const mex = express();
const prisma = new PrismaClient();
mex.use(cors());
mex.use(express.json()); // Middleware to parse JSON bodies

/**
 * @swagger
 * /api/mex:
 *   post:
 *     tags:
 *       - Medical examination record
 *     summary: Create a new medical examination (MEX) record
 *     description: Creates a new MEX record with patient and examination details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               docID:
 *                 type: integer
 *                 description: The ID of the doctor performing the examination.
 *                 example: 101
 *               hn:
 *                 type: string
 *                 description: The patient's hospital number.
 *                 example: "HN123456"
 *               chiefComplaint:
 *                 type: string
 *                 description: The chief complaint reported by the patient.
 *                 example: "Fever and headache"
 *               presentHistory:
 *                 type: string
 *                 description: The patient's present medical history.
 *                 example: "Patient has had a fever for 3 days"
 *               dx:
 *                 type: string
 *                 description: The diagnosis of the patient.
 *                 example: "Viral infection"
 *               procedure:
 *                 type: string
 *                 description: The procedure performed during the examination.
 *                 example: "Blood test"
 *               appointment:
 *                 type: string
 *                 description: The scheduled appointment date and time.
 *                 example: "2025-03-10T09:00:00Z"
 *     responses:
 *       200:
 *         description: Successfully created a new MEX record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newMEX:
 *                   type: object
 *                   description: The newly created MEX record.
 *       400:
 *         description: Failed to create the MEX record due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error na kub"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.post("/exam/api/mex", async (req, res) => {
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
/**
 * @swagger
 * /api/mex/{patient_id}:
 *   get:
 *     tags:
 *       - Medical examination record
 *     summary: Retrieve all medical examination (MEX) records for a specific patient
 *     description: Fetches a list of MEX records for a given patient ID (hn), including examination details and related prescriptions.
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The hospital number (hn) of the patient to fetch MEX records.
 *     responses:
 *       200:
 *         description: Successfully retrieved the MEX records.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   hn:
 *                     type: integer
 *                     example: 123456
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-02-24T08:00:00Z"
 *                   dx:
 *                     type: string
 *                     example: "Viral infection"
 *                   RxList:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         medicalName:
 *                           type: string
 *                           example: "Paracetamol"
 *                         quantity:
 *                           type: integer
 *                           example: 10
 *                         note:
 *                           type: string
 *                           example: "might make your drowsy"
 *                         unit:
 *                           type: string
 *                           example: "tablets"
 *                         mexId:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Failed to fetch MEX records due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error na kub"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.get("/exam/api/mex/:patient_id", async (req, res) => {
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
        dx: true,
        RxList: true,
      },

      orderBy: { date: "desc" },
    });
    res.send(allMex);
  } catch (error) {
    res.status(400).send({ message: "Error na kub", error });
  }
});

//get specific medical examination
/**
 * @swagger
 * /api/mex:
 *   get:
 *     tags:
 *       - Medical examination record
 *     summary: Retrieve a medical examination (MEX) record by ID and associated details
 *     description: Fetches a MEX record by its ID, along with patient vital signs, prescription list, and the file download URL.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX record to retrieve.
 *     responses:
 *       200:
 *         description: Successfully retrieved the MEX record with associated details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 hn:
 *                   type: string
 *                   example: "HN123456"
 *                 chiefComplaint:
 *                   type: string
 *                   example: "Fever and headache"
 *                 presentHistory:
 *                   type: string
 *                   example: "Patient has had a high fever for the past 3 days."
 *                 examination_filename:
 *                   type: string
 *                   example: "123456-180d68c4-3fe6-409f-b8b2-1d127fb0d832.pdf"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-02-24T08:00:00Z"
 *                 dx:
 *                   type: string
 *                   example: "Viral infection"
 *                 download_url:
 *                   type: string
 *                   example: "http://localhost:3001/api/file/1"
 *                 patientRecord:
 *                   type: object
 *                   properties:
 *                     bloodPressure:
 *                       type: string
 *                       example: "120/80"
 *                     temperature:
 *                       type: string
 *                       example: "37.5°C"
 *                     respiratoryRate:
 *                       type: string
 *                       example: "18 breaths/min"
 *                 procedure:
 *                   type: object
 *                   properties:
 *                     นวด:
 *                       type: string
 *                       example: "นวดหลัง 30 นาที"
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-24T08:00:00Z"
 *                     description:
 *                       type: string
 *                       example: "ตรวจอาการ"
 *                     time:
 *                       type: string
 *                       example: "16:00"
 *                     queue:
 *                       type: string
 *                       example: "99"
 *                 RxList:
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
 *                       unit:
 *                         type: string
 *                         example: "tablets"
 *                       note:
 *                         type: string
 *                         example: "Avoid alcohol while taking this medicine"
 *                       mexId:
 *                         type: integer
 *                         example: 1
 *       400:
 *         description: Failed to fetch MEX record due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching MEX"
 *                 error:
 *                   type: object
 *                   description: Error details.
 *       404:
 *         description: MEX record not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "MEX not found"
 */
mex.get("/exam/api/mex", async (req, res) => {
  try {
    //mex_id
    const id = parseInt(req.query.id);
    const data = await fetch(
      `https://clinic.se.cpe.eng.cmu.ac.th/exam/api/file/${id}`,
      {
        method: "GET",
      }
    );
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
            pulse: true,
          },
        },
        RxList: true,
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

/**
 * @swagger
 * /api/mex/{id}:
 *   put:
 *     tags:
 *       - Medical examination record
 *     summary: Update a medical examination (MEX) record by ID
 *     description: Updates an existing MEX record with new data for a specific ID.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               docID:
 *                 type: integer
 *                 example: 123
 *               hn:
 *                 type: string
 *                 example: "HN123456"
 *               chiefComplaint:
 *                 type: string
 *                 example: "Headache"
 *               presentHistory:
 *                 type: string
 *                 example: "Patient has a history of fever."
 *               dx:
 *                 type: string
 *                 example: "Viral infection"
 *               procedure:
 *                 type: string
 *                 example: "Physical examination"
 *               appointment:
 *                 type: string
 *                 example: "2025-02-26T10:00:00Z"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-02-24T08:00:00Z"
 *               examination_filename:
 *                 type: string
 *                 example: "Johny-examfile.pdf"
 *     responses:
 *       200:
 *         description: Successfully updated the MEX record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedMEX:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     docID:
 *                       type: integer
 *                       example: 123
 *                     hn:
 *                       type: string
 *                       example: "HN123456"
 *                     chiefComplaint:
 *                       type: string
 *                       example: "Headache"
 *                     presentHistory:
 *                       type: string
 *                       example: "Patient has a history of fever."
 *                     dx:
 *                       type: string
 *                       example: "Viral infection"
 *                     procedure:
 *                       type: string
 *                       example: "Physical examination"
 *                     appointment:
 *                       type: string
 *                       example: "2025-02-26T10:00:00Z"
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-24T08:00:00Z"
 *                     examination_filename:
 *                       type: string
 *                       example: "Johny-examfile.pdf"
 *       400:
 *         description: Failed to update MEX record due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error updating MEX"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.put("/exam/api/mex/:id", async (req, res) => {
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

/**
 * @swagger
 * /api/mex:
 *   delete:
 *     tags:
 *       - Medical examination record
 *     summary: Delete a medical examination (MEX) record by ID
 *     description: Deletes an existing MEX record by ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX record to delete.
 *     responses:
 *       200:
 *         description: Successfully deleted the MEX record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Delete Success!"
 *       400:
 *         description: Failed to delete MEX record due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error to delete MEX"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.delete(`/exam/api/mex`, async (req, res) => {
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
/**
 * @swagger
 * /api/patient_record/{mex_id}:
 *   post:
 *     tags:
 *       - Patient medical record
 *     summary: Create a patient record for a specific medical examination (MEX)
 *     description: Creates a new patient record containing blood pressure, temperature, and respiratory rate for a given MEX.
 *     parameters:
 *       - in: path
 *         name: mex_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX to associate the patient record with.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bloodPressure:
 *                 type: string
 *                 description: The patient's blood pressure.
 *                 example: "120/80"
 *               temperature:
 *                 type: string
 *                 description: The patient's temperature.
 *                 example: "36.6"
 *               respiratoryRate:
 *                 type: integer
 *                 description: The patient's respiratory rate.
 *                 example: 16
 *     responses:
 *       200:
 *         description: Successfully created a new patient record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newPatientRecord:
 *                   type: object
 *                   description: The newly created patient record.
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: The ID of the new patient record.
 *                       example: 1
 *                     bloodPressure:
 *                       type: string
 *                       description: The patient's blood pressure.
 *                       example: "120/80"
 *                     temperature:
 *                       type: string
 *                       description: The patient's temperature.
 *                       example: "36.6"
 *                     respiratoryRate:
 *                       type: integer
 *                       description: The patient's respiratory rate.
 *                       example: 16
 *       400:
 *         description: Failed to create patient record due to invalid data or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error na kub"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.post("/exam/api/patient_record/:mex_id", async (req, res) => {
  try {
    const mexId = parseInt(req.params.mex_id);
    const { bloodPressure, pulse, temperature, respiratoryRate } = req.body;
    const newPatientRecord = await prisma.patientRecord.create({
      data: {
        bloodPressure,
        pulse,
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
/**
 * @swagger
 * /api/patient_record/{mex_id}:
 *   get:
 *     tags:
 *       - Patient medical record
 *     summary: Get the patient record for a specific medical examination (MEX)
 *     description: Retrieves the patient record associated with a given MEX ID, including blood pressure, temperature, and respiratory rate.
 *     parameters:
 *       - in: path
 *         name: mex_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the MEX for which the patient record should be fetched.
 *     responses:
 *       200:
 *         description: Successfully retrieved the patient record.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The ID of the patient record.
 *                     example: 1
 *                   bloodPressure:
 *                     type: string
 *                     description: The patient's blood pressure.
 *                     example: "120/80"
 *                   temperature:
 *                     type: string
 *                     description: The patient's temperature.
 *                     example: "36.6"
 *                   respiratoryRate:
 *                     type: integer
 *                     description: The patient's respiratory rate.
 *                     example: 16
 *                   mexId:
 *                     type: integer
 *                     description: The MEX ID associated with the patient record.
 *                     example: 123
 *       400:
 *         description: Failed to retrieve the patient record due to an error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error na kub"
 *                 error:
 *                   type: object
 *                   description: Error details.
 */
mex.get("/exam/api/patient_record/:mex_id", async (req, res) => {
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
