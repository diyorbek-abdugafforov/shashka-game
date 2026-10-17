import prisma, { type Prisma } from '@shashka/database';
import { WalletTransactionType } from '@shashka/shared-types';
import { BadRequestError } from '../utils/errors.js';

export class WalletService {
  /**
   * Ensures a wallet exists for the given user, creating one if not present.
   */
  public static async getOrCreateWallet(
    userId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
    let wallet = await client.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await client.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    return wallet;
  }

  /**
   * Computes the balance directly from the immutable transaction ledger.
   */
  public static async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);

    const aggregate = await prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    const computedBalance = aggregate._sum.amount ?? 0;

    // Synchronize cached balance on wallet if it drifted
    if (wallet.balance !== computedBalance) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: computedBalance },
      });
    }

    return computedBalance;
  }

  /**
   * Credits tokens to the user's wallet with an immutable ledger entry.
   */
  public static async credit(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
    referenceType?: string,
    externalClient?: Prisma.TransactionClient,
  ) {
    if (amount <= 0) {
      throw new BadRequestError('Credit amount must be greater than zero');
    }

    const runInTx = async (tx: Prisma.TransactionClient) => {
      const wallet = await this.getOrCreateWallet(userId, tx);

      // Compute balance strictly from ledger
      const aggregate = await tx.walletTransaction.aggregate({
        where: { walletId: wallet.id },
        _sum: { amount: true },
      });

      const currentBalance = aggregate._sum.amount ?? 0;
      const balanceAfter = currentBalance + amount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          balanceAfter,
          type,
          description,
          referenceId,
          referenceType,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return {
        walletId: wallet.id,
        balance: balanceAfter,
        transaction,
      };
    };

    if (externalClient) {
      return runInTx(externalClient);
    }
    return prisma.$transaction(runInTx);
  }

  /**
   * Debits tokens from the user's wallet with an immutable ledger entry.
   */
  public static async debit(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
    referenceType?: string,
    externalClient?: Prisma.TransactionClient,
  ) {
    if (amount <= 0) {
      throw new BadRequestError('Debit amount must be greater than zero');
    }

    const runInTx = async (tx: Prisma.TransactionClient) => {
      const wallet = await this.getOrCreateWallet(userId, tx);

      // Compute balance strictly from ledger
      const aggregate = await tx.walletTransaction.aggregate({
        where: { walletId: wallet.id },
        _sum: { amount: true },
      });

      const currentBalance = aggregate._sum.amount ?? 0;

      if (currentBalance < amount) {
        throw new BadRequestError(
          `Insufficient funds: current balance is ${currentBalance}, required ${amount}`,
        );
      }

      const balanceAfter = currentBalance - amount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          balanceAfter,
          type,
          description,
          referenceId,
          referenceType,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return {
        walletId: wallet.id,
        balance: balanceAfter,
        transaction,
      };
    };

    if (externalClient) {
      return runInTx(externalClient);
    }
    return prisma.$transaction(runInTx);
  }

  /**
   * Returns paginated transaction history for a user.
   */
  public static async getTransactionHistory(
    userId: string,
    page = 1,
    limit = 20,
    type?: WalletTransactionType,
  ) {
    const wallet = await this.getOrCreateWallet(userId);
    const skip = (page - 1) * limit;

    const where: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
      ...(type ? { type } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      items: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }
}

export default WalletService;
