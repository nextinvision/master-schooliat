import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import createTransportSchema from "../schemas/transport/create-transport.schema.js";
import updateTransportSchema from "../schemas/transport/update-transport.schema.js";
import getTransportsSchema from "../schemas/transport/get-transports.schema.js";
import deleteTransportSchema from "../schemas/transport/delete-transport.schema.js";

const router = Router();

router.post(
  "/",
  withPermission(Permission.CREATE_TRANSPORT),
  validateRequest(createTransportSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    const newTransport = await prisma.transport.create({
      data: {
        type: request.type,
        ownerFirstName: request.ownerFirstName,
        ownerLastName: request.ownerLastName,
        driverFirstName: request.driverFirstName,
        driverLastName: request.driverLastName,
        driverDateOfBirth: new Date(request.driverDateOfBirth),
        driverContact: request.driverContact,
        driverGender: request.driverGender,
        driverPhotoLink: request.driverPhotoLink,
        conductorFirstName: request.conductorFirstName,
        conductorLastName: request.conductorLastName,
        conductorDateOfBirth: new Date(request.conductorDateOfBirth),
        conductorContact: request.conductorContact,
        conductorGender: request.conductorGender,
        conductorPhotoLink: request.conductorPhotoLink,
        licenseNumber: request.licenseNumber,
        vehicleNumber: request.vehicleNumber,
        createdBy: currentUser.id,
        schoolId: currentUser.schoolId,
      },
    });

    return res
      .status(201)
      .json({ message: "Transport created!", data: newTransport });
  },
);

router.get(
  "/",
  withPermission(Permission.GET_TRANSPORTS),
  validateRequest(getTransportsSchema),
  async (req, res) => {
    const currentUser = req.context.user;

    const transports = await prisma.transport.findMany({
      where: {
        schoolId: currentUser.schoolId || null,
        deletedAt: null,
        deletedBy: null,
      },
    });

    return res.json({ message: "Transports fetched!", data: transports });
  },
);

router.patch(
  "/:id",
  withPermission(Permission.EDIT_TRANSPORT),
  validateRequest(updateTransportSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if transport exists and is not deleted
    const existingTransport = await prisma.transport.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingTransport) {
      return res.status(404).json({ message: "Transport not found!" });
    }

    // Build update data object with only provided fields
    const transportUpdateData = {};

    if (updateData.type !== undefined)
      transportUpdateData.type = updateData.type;
    if (updateData.ownerFirstName !== undefined)
      transportUpdateData.ownerFirstName = updateData.ownerFirstName;
    if (updateData.ownerLastName !== undefined)
      transportUpdateData.ownerLastName = updateData.ownerLastName;
    if (updateData.driverFirstName !== undefined)
      transportUpdateData.driverFirstName = updateData.driverFirstName;
    if (updateData.driverLastName !== undefined)
      transportUpdateData.driverLastName = updateData.driverLastName;
    if (updateData.driverDateOfBirth !== undefined)
      transportUpdateData.driverDateOfBirth = new Date(
        updateData.driverDateOfBirth,
      );
    if (updateData.driverContact !== undefined)
      transportUpdateData.driverContact = updateData.driverContact;
    if (updateData.driverGender !== undefined)
      transportUpdateData.driverGender = updateData.driverGender;
    if (updateData.driverPhotoLink !== undefined)
      transportUpdateData.driverPhotoLink = updateData.driverPhotoLink;
    if (updateData.conductorFirstName !== undefined)
      transportUpdateData.conductorFirstName = updateData.conductorFirstName;
    if (updateData.conductorLastName !== undefined)
      transportUpdateData.conductorLastName = updateData.conductorLastName;
    if (updateData.conductorDateOfBirth !== undefined)
      transportUpdateData.conductorDateOfBirth = updateData.conductorDateOfBirth
        ? new Date(updateData.conductorDateOfBirth)
        : null;
    if (updateData.conductorContact !== undefined)
      transportUpdateData.conductorContact = updateData.conductorContact;
    if (updateData.conductorGender !== undefined)
      transportUpdateData.conductorGender = updateData.conductorGender;
    if (updateData.conductorPhotoLink !== undefined)
      transportUpdateData.conductorPhotoLink = updateData.conductorPhotoLink;
    if (updateData.licenseNumber !== undefined)
      transportUpdateData.licenseNumber = updateData.licenseNumber;
    if (updateData.vehicleNumber !== undefined)
      transportUpdateData.vehicleNumber = updateData.vehicleNumber;

    transportUpdateData.updatedBy = currentUser.id;

    const updatedTransport = await prisma.transport.update({
      where: { id },
      data: transportUpdateData,
    });

    return res.json({ message: "Transport updated!", data: updatedTransport });
  },
);

// DELETE endpoint for soft deletion of transport
router.delete(
  "/:id",
  withPermission(Permission.DELETE_TRANSPORT),
  validateRequest(deleteTransportSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingTransport = await prisma.transport.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingTransport) {
      return res.status(404).json({ message: "Transport not found!" });
    }

    await prisma.transport.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });

    return res.json({ message: "Transport deleted!" });
  },
);

export default router;
