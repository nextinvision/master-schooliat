import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import paginateUtil from "../utils/paginate.util.js";

const router = Router();

router.post(
  "/",
  withPermission(Permission.CREATE_LOCATION),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    // Validate region exists
    await prisma.region.findUniqueOrThrow({
      where: { id: request.regionId },
    });

    // Validate employee exists
    await prisma.user.findUniqueOrThrow({
      where: { id: request.employeeId },
    });

    const newLocation = await prisma.location.create({
      data: {
        name: request.name,
        regionId: request.regionId,
        employeeId: request.employeeId,
        createdBy: currentUser.id,
      },
    });

    return res.status(201).json({
      message: "Location created!",
      data: newLocation,
    });
  },
);

router.get("/", withPermission(Permission.GET_LOCATIONS), async (req, res) => {
  const { employeeId, regionId } = req.query;

  const where = {
    deletedAt: null,
  };

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (regionId) {
    where.regionId = regionId;
  }

  const locations = await prisma.location.findMany({
    where,
    include: {
      region: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    ...paginateUtil.getPaginationParams(req),
  });

  return res.json({
    message: "Locations fetched!",
    data: locations,
  });
});

router.delete(
  "/:id",
  withPermission(Permission.DELETE_LOCATION),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    await prisma.location.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });

    return res.json({
      message: "Location deleted!",
    });
  },
);

export default router;
