import prisma from "../config/database";

/**
 * Generate a unique referral code
 * Format: TB + 8 random chars (uppercase alphanumeric)
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TB";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Ensure referral code is unique
 */
async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const exists = await prisma.affiliateProfile.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
    attempts++;
  } while (attempts < 10);
  throw new Error("Failed to generate unique referral code");
}

// ============================================================
// APPLY TO BECOME AFFILIATE
// ============================================================

export interface AffiliateApplyInput {
  name?: string;       // Optional - auto-filled from user profile
  phone?: string;      // Optional - auto-filled from user profile
  email?: string;      // Optional - auto-filled from user profile
  address?: string;    // Optional address
  acceptTerms: boolean; // MUST be true - terms acceptance is mandatory
}

export async function applyToAffiliate(
  userId: string,
  input: AffiliateApplyInput
) {
  // Terms acceptance is mandatory
  if (!input.acceptTerms) {
    throw new Error("You must accept the terms and conditions to become an affiliate");
  }

  // Check if user already has affiliate profile
  const existing = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error("You are already an affiliate");
  }

  // Check if user is inactive
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  // Generate unique referral code
  const referralCode = await generateUniqueReferralCode();

  // Create affiliate profile (NO commission rate here - each product has its own)
  const affiliateProfile = await prisma.affiliateProfile.create({
    data: {
      userId,
      referralCode,
      referralLink: `https://truebeauty.app/ref/${referralCode}`,
    },
  });

  // Update user to mark as affiliate
  await prisma.user.update({
    where: { id: userId },
    data: {
      isAffiliate: true,
      // Also update name/phone if provided and different
      ...(input.name && { name: input.name }),
      ...(input.phone && { phone: input.phone }),
    },
  });

  return {
    id: affiliateProfile.id,
    referralCode: affiliateProfile.referralCode,
    referralLink: affiliateProfile.referralLink,
    // NOTE: Commission rate is per-product, set by admin when adding product
    // Not stored in affiliate profile
    message: "Congratulations! You are now an affiliate.",
  };
}

// ============================================================
// GET AFFILIATE PROFILE
// ============================================================

export async function getAffiliateProfile(userId: string) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      referralCode: true,
      referralLink: true,
      walletBalance: true,
      totalEarnings: true,
      totalWithdrawals: true,
      minWithdrawalAmount: true,
      isActive: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      upiId: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  // Mask sensitive data
  const maskedProfile = {
    ...profile,
    accountNumber: profile.accountNumber
      ? "XXXX" + profile.accountNumber.slice(-4)
      : null,
  };

  return maskedProfile;
}

// ============================================================
// GET AFFILIATE STATS
// ============================================================

export async function getAffiliateStats(userId: string) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  // Get referral count
  const totalReferrals = await prisma.affiliateReferralTracking.count({
    where: { affiliateId: profile.id },
  });

  // Get converted referrals (users who made at least one order)
  const convertedReferrals = await prisma.affiliateReferralTracking.count({
    where: {
      affiliateId: profile.id,
      conversionOrderId: { not: null },
    },
  });

  // Get total orders from referrals
  const referralOrders = await prisma.order.findMany({
    where: { affiliateId: profile.id },
    select: { id: true, totalAmount: true, orderStatus: true },
  });

  const totalOrdersCount = referralOrders.length;
  const completedOrdersCount = referralOrders.filter(
    (o) => o.orderStatus === "delivered"
  ).length;
  const totalOrderAmount = referralOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );

  // Get earnings from AffiliateEarning
  const earnings = await prisma.affiliateEarning.findMany({
    where: { affiliateId: profile.id },
    select: { amount: true, type: true },
  });

  return {
    profile: {
      walletBalance: profile.walletBalance,
      totalEarnings: profile.totalEarnings,
      totalWithdrawals: profile.totalWithdrawals,
      minWithdrawalAmount: profile.minWithdrawalAmount,
      // NOTE: Commission rate is per-product (Product.commissionRate), not global
    },
    referrals: {
      total: totalReferrals,
      converted: convertedReferrals,
      conversionRate:
        totalReferrals > 0
          ? Math.round((convertedReferrals / totalReferrals) * 100)
          : 0,
    },
    orders: {
      total: totalOrdersCount,
      completed: completedOrdersCount,
      totalAmount: totalOrderAmount,
    },
    earnings: {
      total: profile.totalEarnings,
      fromCommission: earnings
        .filter((e) => e.type === "order_commission")
        .reduce((sum, e) => sum + e.amount, 0),
      manualAdjustments: earnings
        .filter((e) => e.type === "manual_adjustment")
        .reduce((sum, e) => sum + e.amount, 0),
    },
  };
}

// ============================================================
// GET WALLET BALANCE & TRANSACTION HISTORY
// ============================================================

export async function getWalletHistory(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletLedger.findMany({
      where: { affiliateId: profile.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        description: true,
        orderId: true,
        withdrawalId: true,
        createdAt: true,
      },
    }),
    prisma.walletLedger.count({ where: { affiliateId: profile.id } }),
  ]);

  return {
    balance: profile.walletBalance,
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// REQUEST WITHDRAWAL
// ============================================================

export interface WithdrawalRequestInput {
  amount: number;
  method: "upi" | "bank_transfer";
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export async function requestWithdrawal(
  userId: string,
  input: WithdrawalRequestInput
) {
  // Get affiliate profile
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  // Check minimum withdrawal amount
  if (input.amount < profile.minWithdrawalAmount) {
    throw new Error(
      `Minimum withdrawal amount is ₹${profile.minWithdrawalAmount}`
    );
  }

  // Check sufficient balance
  if (input.amount > profile.walletBalance) {
    throw new Error("Insufficient wallet balance");
  }

  // Check KYC status
  const kyc = await prisma.userKyc.findUnique({
    where: { userId },
  });

  const kycVerified = kyc?.status === "verified" || (kyc?.aadharVerified && kyc?.panVerified);
  const kycCheckedAt = new Date();

  // Create withdrawal request
  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      affiliateId: profile.id,
      amount: input.amount,
      method: input.method,
      upiId: input.upiId,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode,
      status: "pending",
      kycVerified,
      kycCheckedAt,
      minimumAmount: profile.minWithdrawalAmount,
    },
  });

  // Deduct from wallet balance (for now, keeping it simple)
  // In a real system, you might want to lock the amount until approved/rejected
  await prisma.affiliateProfile.update({
    where: { id: profile.id },
    data: {
      walletBalance: profile.walletBalance - input.amount,
    },
  });

  // Create wallet ledger entry
  await prisma.walletLedger.create({
    data: {
      affiliateId: profile.id,
      type: "WITHDRAWAL_DEBIT",
      amount: input.amount,
      balanceAfter: profile.walletBalance - input.amount,
      description: `Withdrawal request #${withdrawal.id.slice(0, 8)}`,
      withdrawalId: withdrawal.id,
    },
  });

  return {
    id: withdrawal.id,
    amount: withdrawal.amount,
    method: withdrawal.method,
    status: withdrawal.status,
    requestedAt: withdrawal.requestedAt,
    kycVerified,
    message: "Withdrawal request submitted successfully",
  };
}

// ============================================================
// LIST WITHDRAWAL HISTORY
// ============================================================

export async function getWithdrawalHistory(
  userId: string,
  options: { page?: number; limit?: number; status?: string } = {}
) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { affiliateId: profile.id };
  if (options.status) {
    where.status = options.status;
  }

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        method: true,
        upiId: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        status: true,
        kycVerified: true,
        note: true,
        requestedAt: true,
        processedAt: true,
        paidAt: true,
      },
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  // Mask sensitive data
  const maskedWithdrawals = withdrawals.map((w) => ({
    ...w,
    accountNumber: w.accountNumber ? "XXXX" + w.accountNumber.slice(-4) : null,
    upiId: w.upiId,
  }));

  return {
    withdrawals: maskedWithdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// UPDATE BANK DETAILS
// ============================================================

export interface UpdateBankDetailsInput {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export async function updateBankDetails(
  userId: string,
  input: UpdateBankDetailsInput
) {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Affiliate profile not found");
  }

  const updated = await prisma.affiliateProfile.update({
    where: { id: profile.id },
    data: {
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode,
      upiId: input.upiId,
    },
    select: {
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      upiId: true,
    },
  });

  // Mask account number in response
  if (updated.accountNumber) {
    (updated as any).accountNumber =
      "XXXX" + updated.accountNumber.slice(-4);
  }

  return updated;
}

// ============================================================
// CHECK IF USER IS AFFILIATE
// ============================================================

export async function isUserAffiliate(userId: string): Promise<boolean> {
  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });
  return !!profile;
}