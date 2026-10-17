import type { FastifyPluginAsync } from 'fastify';
import prisma from '@shashka/database';
import { purchaseItemSchema, equipItemSchema } from '@shashka/validation';
import {
  WalletTransactionType,
  type ApiResponse,
} from '@shashka/shared-types';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { WalletService } from '../services/wallet.service.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export const shopRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper to verify feature flag
  const checkShopEnabled = async () => {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: 'shop_enabled' },
    });
    if (flag && !flag.enabled) {
      throw new ForbiddenError('Shop is currently disabled by system administration');
    }
  };

  // GET /api/shop/items
  fastify.get('/items', async (_req, reply) => {
    const items = await prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    const response: ApiResponse = {
      success: true,
      data: items,
    };

    return reply.send(response);
  });

  // POST /api/shop/purchase
  fastify.post(
    '/purchase',
    {
      preHandler: [authenticate, validateBody(purchaseItemSchema)],
    },
    async (req, reply) => {
      await checkShopEnabled();

      const authUser = req.user!;
      const { itemId } = req.body as { itemId: string };

      const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new NotFoundError('Shop item not found or unavailable');
      }

      // Check if user already owns this item
      const existing = await prisma.userInventory.findUnique({
        where: {
          userId_itemId: {
            userId: authUser.id,
            itemId,
          },
        },
      });

      if (existing) {
        throw new BadRequestError('You already own this item');
      }

      // Debit wallet inside transaction and record inventory
      const result = await prisma.$transaction(async (tx) => {
        // Debit funds
        await WalletService.debit(
          authUser.id,
          item.price,
          WalletTransactionType.SHOP_PURCHASE,
          `Purchased ${item.name}`,
          item.id,
          'SHOP_ITEM',
          tx,
        );

        // Add to inventory
        const inventoryItem = await tx.userInventory.create({
          data: {
            userId: authUser.id,
            itemId: item.id,
            isEquipped: false,
          },
          include: {
            item: true,
          },
        });

        return inventoryItem;
      });

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      return reply.status(201).send(response);
    },
  );

  // GET /api/shop/inventory
  fastify.get(
    '/inventory',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const authUser = req.user!;

      const inventory = await prisma.userInventory.findMany({
        where: { userId: authUser.id },
        include: { item: true },
        orderBy: { acquiredAt: 'desc' },
      });

      const response: ApiResponse = {
        success: true,
        data: inventory,
      };

      return reply.send(response);
    },
  );

  // POST /api/shop/equip
  fastify.post(
    '/equip',
    {
      preHandler: [authenticate, validateBody(equipItemSchema)],
    },
    async (req, reply) => {
      const authUser = req.user!;
      const { userInventoryId } = req.body as { userInventoryId: string };

      const inventoryItem = await prisma.userInventory.findFirst({
        where: {
          id: userInventoryId,
          userId: authUser.id,
        },
        include: { item: true },
      });

      if (!inventoryItem) {
        throw new NotFoundError('Inventory item not found');
      }

      // Unequip any items of the same category and equip this item
      await prisma.$transaction(async (tx) => {
        await tx.userInventory.updateMany({
          where: {
            userId: authUser.id,
            item: {
              category: inventoryItem.item.category,
            },
          },
          data: { isEquipped: false },
        });

        await tx.userInventory.update({
          where: { id: inventoryItem.id },
          data: { isEquipped: true },
        });
      });

      const updated = await prisma.userInventory.findUnique({
        where: { id: inventoryItem.id },
        include: { item: true },
      });

      const response: ApiResponse = {
        success: true,
        data: updated,
      };

      return reply.send(response);
    },
  );
};

export default shopRoutes;
