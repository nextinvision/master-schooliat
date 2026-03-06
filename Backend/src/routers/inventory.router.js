import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import logger from "../config/logger.js";

const router = Router();

// GET all inventory items for the school
router.get(
    "/",
    withPermission(Permission.GET_INVENTORY),
    async (req, res) => {
        const currentUser = req.context.user;
        const schoolId = currentUser.schoolId;

        if (!schoolId) {
            return res.status(400).json({ message: "User is not associated with a school!" });
        }

        const { type, category, unit, condition, search, page = 1, limit = 50 } = req.query;

        const where = {
            schoolId,
            deletedAt: null,
        };

        if (type) where.type = type;
        if (category) where.category = category;
        if (unit) where.unit = unit;
        if (condition) where.condition = condition;
        if (search) {
            where.itemName = { contains: search, mode: "insensitive" };
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const [items, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: parseInt(limit, 10),
            }),
            prisma.inventoryItem.count({ where }),
        ]);

        return res.json({
            message: "Inventory items fetched!",
            data: items,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(total / parseInt(limit, 10)),
            },
        });
    },
);

// POST create inventory item
router.post(
    "/",
    withPermission(Permission.CREATE_INVENTORY_ITEM),
    async (req, res) => {
        const currentUser = req.context.user;
        const schoolId = currentUser.schoolId;

        if (!schoolId) {
            return res.status(400).json({ message: "User is not associated with a school!" });
        }

        const { itemName, itemCode, category, unit, type, totalStock, condition } = req.body.request || req.body;

        if (!itemName || !itemCode || !category || !unit) {
            return res.status(400).json({ message: "itemName, itemCode, category, and unit are required!" });
        }

        // Check for duplicate itemCode within the school
        const existing = await prisma.inventoryItem.findFirst({
            where: { itemCode, schoolId, deletedAt: null },
        });
        if (existing) {
            return res.status(400).json({ message: `Item code '${itemCode}' already exists!` });
        }

        const item = await prisma.inventoryItem.create({
            data: {
                itemName,
                itemCode,
                category,
                unit,
                type: type || "NON_CONSUMABLE",
                totalStock: totalStock || 0,
                condition: condition || "NEW",
                schoolId,
                createdBy: currentUser.id,
            },
        });

        return res.status(201).json({
            message: "Inventory item created!",
            data: item,
        });
    },
);

// PATCH update inventory item
router.patch(
    "/:id",
    withPermission(Permission.EDIT_INVENTORY_ITEM),
    async (req, res) => {
        const currentUser = req.context.user;
        const schoolId = currentUser.schoolId;
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({ message: "User is not associated with a school!" });
        }

        const item = await prisma.inventoryItem.findFirst({
            where: { id, schoolId, deletedAt: null },
        });

        if (!item) {
            return res.status(404).json({ message: "Inventory item not found!" });
        }

        const updates = req.body.request || req.body;
        const allowedFields = ["itemName", "itemCode", "category", "unit", "type", "totalStock", "issuedQty", "issuedTo", "lastIssuedDate", "condition"];
        const data = { updatedBy: currentUser.id };

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                data[field] = updates[field];
            }
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data,
        });

        return res.json({
            message: "Inventory item updated!",
            data: updatedItem,
        });
    },
);

// DELETE inventory item (soft delete)
router.delete(
    "/:id",
    withPermission(Permission.DELETE_INVENTORY_ITEM),
    async (req, res) => {
        const currentUser = req.context.user;
        const schoolId = currentUser.schoolId;
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({ message: "User is not associated with a school!" });
        }

        const item = await prisma.inventoryItem.findFirst({
            where: { id, schoolId, deletedAt: null },
        });

        if (!item) {
            return res.status(404).json({ message: "Inventory item not found!" });
        }

        await prisma.inventoryItem.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: currentUser.id,
            },
        });

        return res.json({ message: "Inventory item deleted!" });
    },
);

export default router;
