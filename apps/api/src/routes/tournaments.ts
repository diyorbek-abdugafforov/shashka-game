import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@shashka/database';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

export const tournamentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/tournaments
  fastify.get('/', { preHandler: [optionalAuthenticate] }, async (_req, reply) => {
    try {
      let tournaments = await prisma.tournament.findMany({
        orderBy: { startTime: 'asc' },
      });

      // Default sample upcoming tournament if DB has none yet
      if (tournaments.length === 0) {
        const sampleDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const sample = await prisma.tournament.create({
          data: {
            title: "Haftalik Oltin Shashka Kubogi",
            description: "Eng kuchli shashkachilar o'rtasida shiddatli onlayn turnir!",
            mode: 'CLASSIC',
            status: 'UPCOMING',
            startTime: sampleDate,
            prize: '1000 tanga + Maxsus unvon',
            maxPlayers: 16,
            participants: [],
          },
        });
        tournaments = [sample];
      }

      return reply.send({
        success: true,
        data: tournaments,
      });
    } catch (err: any) {
      return reply.send({
        success: true,
        data: [],
      });
    }
  });

  // POST /api/tournaments (Create tournament)
  fastify.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const authUser = req.user!;
    const body = (req.body as any) || {};

    const title = body.title?.trim() || "Do'stlararo Shashka Turniri";
    const description = body.description?.trim() || "Barcha uchun ochiq turnir";
    const mode = body.mode || 'CLASSIC';
    const prize = body.prize?.trim() || "500 tanga";
    const maxPlayers = parseInt(body.maxPlayers || '16', 10);
    const startTime = body.startTime ? new Date(body.startTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const tournament = await prisma.tournament.create({
        data: {
          title,
          description,
          mode,
          status: 'UPCOMING',
          startTime,
          prize,
          maxPlayers,
          creatorId: authUser.id,
          participants: [
            {
              id: authUser.id,
              displayName: authUser.displayName,
              avatarUrl: authUser.avatarUrl,
              score: 0,
              joinedAt: new Date().toISOString(),
            },
          ],
        },
      });

      // Global notification about new tournament
      try {
        await prisma.notification.create({
          data: {
            userId: null,
            title: "Yangi turnir e'lon qilindi! 🏆",
            message: `"${title}" turniriga ro'yxatdan o'tish ochildi! Sovg'a: ${prize}`,
            type: 'SYSTEM',
            data: { tournamentId: tournament.id },
          },
        });
        if (fastify.io) {
          fastify.io.emit('notification:received', {
            title: "Yangi turnir e'lon qilindi! 🏆",
            message: `"${title}" turniri! Sovg'a: ${prize}`,
          });
        }
      } catch {}

      return reply.status(201).send({
        success: true,
        data: tournament,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { message: err.message || 'Turnir yaratishda xatolik yuz berdi' },
      });
    }
  });

  // POST /api/tournaments/:id/join
  fastify.post('/:id/join', { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const authUser = req.user!;

    try {
      const tournament = await prisma.tournament.findUnique({ where: { id } });
      if (!tournament) {
        return reply.status(404).send({ success: false, error: { message: 'Turnir topilmadi' } });
      }

      const participants = (tournament.participants as any[]) || [];
      const alreadyJoined = participants.some((p) => p.id === authUser.id);

      if (alreadyJoined) {
        return reply.send({ success: true, data: tournament });
      }

      if (participants.length >= tournament.maxPlayers) {
        return reply.status(400).send({
          success: false,
          error: { message: "Turnirda bo'sh o'rin qolmagan" },
        });
      }

      const updatedParticipants = [
        ...participants,
        {
          id: authUser.id,
          displayName: authUser.displayName,
          avatarUrl: authUser.avatarUrl,
          score: 0,
          joinedAt: new Date().toISOString(),
        },
      ];

      const updated = await prisma.tournament.update({
        where: { id },
        data: {
          participants: updatedParticipants,
        },
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { message: err.message || 'Turnirga qo\'shilishda xatolik' },
      });
    }
  });
};

export default tournamentRoutes;
