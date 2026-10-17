import { InlineKeyboard } from 'grammy';
import { prisma } from '@shashka/database';
import type { BotContext } from '../types.js';
import { UserService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

export async function handleAdminCommand(ctx: BotContext): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply("⛔ Kechirasiz, sizda administratorlik huquqi yo'q.");
    return;
  }

  try {
    const [totalUsers, totalGames, totalCoinsResult, activeReports] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.report.count({ where: { status: 'PENDING' } }).catch(() => 0),
    ]);

    const totalCoins = totalCoinsResult._sum.balance || 0;

    const message = [
      '👑 *ADMINISTRATOR BOSHQARUV PANELI*',
      '━━━━━━━━━━━━━━━━━━━━',
      `👥 *Foydalanuvchilar:* ${totalUsers} ta`,
      `🎮 *Jami o‘yinlar:* ${totalGames} ta`,
      `💰 *Tizimdagi tangalar:* ${totalCoins.toLocaleString()} ta`,
      `⚠️ *Ko‘rib chiqilmagan shikoyatlar:* ${activeReports} ta`,
      '━━━━━━━━━━━━━━━━━━━━',
      '🛠 *Admin buyruqlari:*',
      '📢 `/broadcast <matn>` — Barcha bot a‘zolariga ommaviy xabar yuborish',
      '🎁 `/givecoins <tg_id> <miqdor>` — O‘yinchiga tanga berish',
      '⛔ `/ban <tg_id>` — Foydalanuvchini bloklash',
      '✅ `/unban <tg_id>` — Blokdan chiqarish',
      '📊 `/stats` — Shaxsiy o‘yin statistikasi',
    ].join('\n');

    const kb = new InlineKeyboard()
      .text('📢 Ommaviy xabar yuborish', 'admin:help_broadcast')
      .row()
      .text('🔄 Statistikani yangilash', 'admin:refresh_stats')
      .row()
      .text('🔙 Asosiy menyu', 'menu:main');

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error executing admin command');
    await ctx.reply("❌ Statistika yuklanmadi. Ma'lumotlar bazasi aloqasini tekshiring.");
  }
}

export async function handleGiveCoinsCommand(ctx: BotContext): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply("⛔ Bu buyruq faqat administratorlar uchun.");
    return;
  }

  const parts = (ctx.message?.text || '').split(/\s+/).slice(1);
  if (parts.length < 2) {
    await ctx.reply("ℹ️ *Foydalanish:* `/givecoins <tg_id> <miqdor>`\nMasalan: `/givecoins 123456789 500`", {
      parse_mode: 'Markdown',
    });
    return;
  }

  const [tgId, amountStr] = parts;
  const amount = parseInt(amountStr || '0', 10);

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply("❌ Miqdor musbat butun son bo‘lishi kerak.");
    return;
  }

  try {
    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId: tgId },
      include: { user: true },
    });

    if (!account || !account.user) {
      await ctx.reply(`❌ Telegram ID: \`${tgId}\` bo‘yicha foydalanuvchi topilmadi.`);
      return;
    }

    const newBalance = await UserService.addCoins(
      account.user.id,
      amount,
      `Administrator tomonidan qo‘shildi: ${ctx.from?.id}`,
    );

    await ctx.reply(
      `✅ *Muvaffaqiyatli!* \nFoydalanuvchi: *${account.user.displayName}* (\`${tgId}\`)\n` +
      `Qo‘shilgan summa: *+${amount.toLocaleString()} tanga*\n` +
      `Yangi balans: *${newBalance.toLocaleString()} tanga*`,
      { parse_mode: 'Markdown' },
    );

    // Notify recipient if possible
    try {
      await ctx.api.sendMessage(
        tgId!,
        `🎁 *Sizga administrator tomonidan +${amount.toLocaleString()} tanga berildi!*\nBalansingiz: ${newBalance.toLocaleString()} tanga`,
        { parse_mode: 'Markdown' },
      );
    } catch {}
  } catch (error) {
    logger.error({ err: error }, 'Error in givecoins command');
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}

export async function handleBanCommand(ctx: BotContext): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply("⛔ Bu buyruq faqat administratorlar uchun.");
    return;
  }

  const tgId = (ctx.message?.text || '').split(/\s+/)[1];
  if (!tgId) {
    await ctx.reply("ℹ️ *Foydalanish:* `/ban <tg_id>`\nMasalan: `/ban 123456789`", {
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId: tgId },
      include: { user: true },
    });

    if (!account || !account.user) {
      await ctx.reply(`❌ Telegram ID: \`${tgId}\` bo‘yicha foydalanuvchi topilmadi.`);
      return;
    }

    await prisma.user.update({
      where: { id: account.user.id },
      data: { isBanned: true, banReason: 'Admin qarori bilan chetlashtirildi' },
    });

    await ctx.reply(`⛔ Foydalanuvchi *${account.user.displayName}* (\`${tgId}\`) bloklandi.`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in ban command');
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}

export async function handleUnbanCommand(ctx: BotContext): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply("⛔ Bu buyruq faqat administratorlar uchun.");
    return;
  }

  const tgId = (ctx.message?.text || '').split(/\s+/)[1];
  if (!tgId) {
    await ctx.reply("ℹ️ *Foydalanish:* `/unban <tg_id>`\nMasalan: `/unban 123456789`", {
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    const account = await prisma.telegramAccount.findUnique({
      where: { telegramId: tgId },
      include: { user: true },
    });

    if (!account || !account.user) {
      await ctx.reply(`❌ Telegram ID: \`${tgId}\` bo‘yicha foydalanuvchi topilmadi.`);
      return;
    }

    await prisma.user.update({
      where: { id: account.user.id },
      data: { isBanned: false, banReason: null, bannedUntil: null },
    });

    await ctx.reply(`✅ Foydalanuvchi *${account.user.displayName}* (\`${tgId}\`) blokdan chiqarildi.`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in unban command');
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}
