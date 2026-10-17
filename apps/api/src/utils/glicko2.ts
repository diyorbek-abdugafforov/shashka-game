/**
 * Full Glicko-2 rating system implementation.
 * Reference: Mark E. Glickman, "Example of the Glicko-2 system" (2012)
 */

export interface GlickoPlayer {
  rating: number; // r (default: 1500)
  rd: number;     // RD - rating deviation (default: 350)
  vol: number;    // sigma - rating volatility (default: 0.06)
}

export interface MatchResultInput {
  player1: GlickoPlayer;
  player2: GlickoPlayer;
  score1: number; // 1 for win, 0.5 for draw, 0 for loss
}

export interface MatchResultOutput {
  player1: {
    rating: number;
    rd: number;
    vol: number;
    change: number;
  };
  player2: {
    rating: number;
    rd: number;
    vol: number;
    change: number;
  };
}

const SCALE = 173.7178;
const TAU = 0.5;           // System volatility constraint
const EPSILON = 0.000001;

export class Glicko2 {
  /**
   * Convert standard Glicko rating r to Glicko-2 scale mu.
   */
  public static ratingToMu(rating: number): number {
    return (rating - 1500) / SCALE;
  }

  /**
   * Convert Glicko RD to Glicko-2 scale phi.
   */
  public static rdToPhi(rd: number): number {
    return rd / SCALE;
  }

  /**
   * Convert Glicko-2 mu back to standard Glicko rating.
   */
  public static muToRating(mu: number): number {
    return mu * SCALE + 1500;
  }

  /**
   * Convert Glicko-2 phi back to standard Glicko RD.
   */
  public static phiToRd(phi: number): number {
    return phi * SCALE;
  }

  /**
   * Helper function g(phi).
   */
  public static g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * (phi ** 2)) / (Math.PI ** 2));
  }

  /**
   * Expected game outcome E(mu, mu_j, phi_j).
   */
  public static E(mu: number, mu_j: number, phi_j: number): number {
    return 1 / (1 + Math.exp(-this.g(phi_j) * (mu - mu_j)));
  }

  /**
   * Updates a single player's rating given a series of matches in a rating period.
   * Matches array: [ { opponent: GlickoPlayer, score: number } ]
   */
  public static updatePlayer(
    player: GlickoPlayer,
    matches: { opponent: GlickoPlayer; score: number }[],
  ): GlickoPlayer {
    const mu = this.ratingToMu(player.rating);
    const phi = this.rdToPhi(player.rd);
    const sigma = player.vol;

    // If player did not compete in this rating period
    if (matches.length === 0) {
      const phiPrime = Math.sqrt(phi ** 2 + sigma ** 2);
      return {
        rating: player.rating,
        rd: Math.min(this.phiToRd(phiPrime), 350),
        vol: sigma,
      };
    }

    // Step 3: Compute variance v
    let vSum = 0;
    for (const match of matches) {
      const mu_j = this.ratingToMu(match.opponent.rating);
      const phi_j = this.rdToPhi(match.opponent.rd);
      const gPhi = this.g(phi_j);
      const eVal = this.E(mu, mu_j, phi_j);
      vSum += (gPhi ** 2) * eVal * (1 - eVal);
    }
    const v = 1 / vSum;

    // Step 4: Compute Delta
    let deltaSum = 0;
    for (const match of matches) {
      const mu_j = this.ratingToMu(match.opponent.rating);
      const phi_j = this.rdToPhi(match.opponent.rd);
      const gPhi = this.g(phi_j);
      const eVal = this.E(mu, mu_j, phi_j);
      deltaSum += gPhi * (match.score - eVal);
    }
    const delta = v * deltaSum;

    // Step 5: Determine new volatility sigma' using Illinois algorithm
    const a = Math.log(sigma ** 2);

    const f = (x: number): number => {
      const ex = Math.exp(x);
      const numer1 = ex * (delta ** 2 - phi ** 2 - v - ex);
      const denom1 = 2 * ((phi ** 2 + v + ex) ** 2);
      const term2 = (x - a) / (TAU ** 2);
      return (numer1 / denom1) - term2;
    };

    let A = a;
    let B: number;

    if (delta ** 2 > phi ** 2 + v) {
      B = Math.log(delta ** 2 - phi ** 2 - v);
    } else {
      let k = 1;
      while (f(a - k * TAU) < 0) {
        k++;
      }
      B = a - k * TAU;
    }

    let fA = f(A);
    let fB = f(B);

    while (Math.abs(B - A) > EPSILON) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = f(C);

      if (fC * fB <= 0) {
        A = B;
        fA = fB;
      } else {
        fA /= 2;
      }

      B = C;
      fB = fC;
    }

    const sigmaPrime = Math.exp(A / 2);

    // Step 6: Update rating deviation to phi*
    const phiStar = Math.sqrt(phi ** 2 + sigmaPrime ** 2);

    // Step 7: Update phi' and mu'
    const phiPrime = 1 / Math.sqrt((1 / (phiStar ** 2)) + (1 / v));
    const muPrime = mu + (phiPrime ** 2) * deltaSum;

    // Step 8: Convert back to Glicko scale
    const newRating = Math.round(this.muToRating(muPrime) * 10) / 10;
    const newRd = Math.round(Math.min(this.phiToRd(phiPrime), 350) * 10) / 10;
    const newVol = Math.round(sigmaPrime * 1000000) / 1000000;

    return {
      rating: newRating,
      rd: newRd,
      vol: newVol,
    };
  }

  /**
   * Convenience method to update ratings after a 1v1 match.
   */
  public static calculateMatch(input: MatchResultInput): MatchResultOutput {
    const updated1 = this.updatePlayer(input.player1, [
      { opponent: input.player2, score: input.score1 },
    ]);
    const updated2 = this.updatePlayer(input.player2, [
      { opponent: input.player1, score: 1 - input.score1 },
    ]);

    return {
      player1: {
        rating: updated1.rating,
        rd: updated1.rd,
        vol: updated1.vol,
        change: Math.round((updated1.rating - input.player1.rating) * 10) / 10,
      },
      player2: {
        rating: updated2.rating,
        rd: updated2.rd,
        vol: updated2.vol,
        change: Math.round((updated2.rating - input.player2.rating) * 10) / 10,
      },
    };
  }
}

export default Glicko2;
