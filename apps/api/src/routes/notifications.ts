import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@shashka/database';
import { authenticate } from '../middleware/auth.js';

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/notifications
  fastify.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const authUser = req.user!;

    try {
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: authUser.id },
            { userId: null }, // Global announcements
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      return reply.send({
        success: true,
        data: notifications,
      });
    } catch (err: any) {
      return reply.send({
        success: true,
        data: [],
      });
    }
  });

  // PATCH /api/notifications/:id/read
  fastify.patch('/:id/read', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return reply.send({
        success: true,
        data: { id, isRead: true },
      });
    } catch (err) {
      return reply.send({ success: true });
    }
  });

  // POST /api/notifications/broadcast (Admin only broadcast)
  fastify.post('/broadcast', { preHandler: [authenticate] }, async (req, reply) => {
    const authUser = req.user!;
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ success: false, error: { message: 'Ruxsat berilmagan' } });
    }

    const body = (req.body as any) || {};
    const title = body.title?.trim() || "Admin e'loni 📢";
    const message = body.message?.trim() || '';

    if (!message) {
      return reply.status(400).send({ success: false, error: { message: 'Xabar matnini kiriting' } });
    }

    const created = await prisma.notification.create({
      data: {
        userId: null,
        title,
        message,
        type: 'ADMIN_BROADCAST',
      },
    });

    if (fastify.io) {
      fastify.io.emit('notification:received', {
        id: created.id,
        title,
        message,
        type: 'ADMIN_BROADCAST',
        createdAt: created.createdAt,
      });
    }

    return reply.send({
      success: true,
      data: created,
    });
  });
};

export default notificationRoutes;
