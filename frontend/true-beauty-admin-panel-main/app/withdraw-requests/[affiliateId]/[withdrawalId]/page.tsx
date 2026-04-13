"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Wallet,
  Banknote,
  CheckCircle2,
  XCircle,
  History,
  IndianRupee,
} from "lucide-react";
import { useAffiliates } from "@/lib/affiliates-context";
import {
  AFFILIATE_STATUS_CLASSES,
  AFFILIATE_STATUS_LABELS,
  WITHDRAWAL_STATUS_CLASSES,
  WITHDRAWAL_STATUS_LABELS,
} from "@/lib/affiliates-ui";
import { formatCurrency, formatDate } from "@/lib/withdraw-requests-utils";

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", DATE_TIME_OPTS);
}

export default function WithdrawRequestDetailPage() {
  const params = useParams();
  const { getAffiliateById, updateWithdrawalStatus } = useAffiliates();

  const affiliateId =
    typeof params.affiliateId === "string"
      ? params.affiliateId
      : (params.affiliateId?.[0] as string);
  const withdrawalId =
    typeof params.withdrawalId === "string"
      ? params.withdrawalId
      : (params.withdrawalId?.[0] as string);

  const affiliate = affiliateId ? getAffiliateById(affiliateId) : undefined;
  const withdrawal = affiliate?.withdrawals.find((w) => w.id === withdrawalId);

  if (!affiliateId || !withdrawalId || !affiliate || !withdrawal) {
    return (
      <div className="space-y-6">
        <Link
          href="/withdraw-requests"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Withdraw Requests
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Withdrawal request not found.</p>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    if (withdrawal.status !== "pending") return;
    if (
      window.confirm(
        `Approve withdrawal of ${formatCurrency(withdrawal.amount)}? Wallet balance will be deducted.`
      )
    ) {
      updateWithdrawalStatus(affiliate.id, withdrawal.id, "approved");
    }
  };

  const handleReject = () => {
    if (withdrawal.status !== "pending") return;
    const notes = window.prompt("Rejection reason (optional):");
    if (window.confirm("Reject this withdrawal request?")) {
      updateWithdrawalStatus(affiliate.id, withdrawal.id, "rejected", notes ?? undefined);
    }
  };

  const handleMarkPaid = () => {
    if (withdrawal.status !== "approved") return;
    if (window.confirm("Mark this withdrawal as paid? Confirm payment has been sent.")) {
      updateWithdrawalStatus(affiliate.id, withdrawal.id, "paid");
    }
  };

  const requestedAmount = withdrawal.amount;
  const totalPayouts = affiliate.withdrawals
    .filter((w) => w.status === "approved" || w.status === "paid")
    .reduce((sum, w) => sum + w.amount, 0);

  const totalCommission = affiliate.totalCommission;
  const referredUsers = affiliate.referredUsers ?? [];
  const referredOrders = affiliate.referredOrders ?? [];

  const REFERRED_USERS_PER_PAGE = 5;
  const [referredUsersPage, setReferredUsersPage] = useState(1);
  const totalReferredUsersPages =
    referredUsers.length === 0
      ? 1
      : Math.ceil(referredUsers.length / REFERRED_USERS_PER_PAGE);
  const currentReferredUsersPage = Math.min(
    referredUsersPage,
    totalReferredUsersPages
  );
  const referredUsersStartIndex =
    (currentReferredUsersPage - 1) * REFERRED_USERS_PER_PAGE;
  const currentReferredUsers = referredUsers.slice(
    referredUsersStartIndex,
    referredUsersStartIndex + REFERRED_USERS_PER_PAGE
  );

  const [selectedReferredUser, setSelectedReferredUser] = useState<{
    name: string;
    email: string;
    productName: string;
    amountDisplay: string;
    commissionDisplay: string;
    registeredOn: string;
  } | null>(null);

  const isPending = withdrawal.status === "pending";
  const isApproved = withdrawal.status === "approved";

  return (
    <div className="space-y-6">
      <Link
        href="/withdraw-requests"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Withdraw Requests
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Request {withdrawal.id}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              {formatCurrency(withdrawal.amount)}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {withdrawal.requestedAt && (
              <p className="text-xs text-gray-500">
                Requested: {formatDateTime(withdrawal.requestedAt)}
              </p>
            )}
            <span
              className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${
                WITHDRAWAL_STATUS_CLASSES[withdrawal.status] ??
                "bg-gray-50 text-gray-700"
              }`}
            >
              {WITHDRAWAL_STATUS_LABELS[withdrawal.status] ?? withdrawal.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-600" />
              Affiliate Info
            </h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="font-semibold text-gray-900">{affiliate.name}</span>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    AFFILIATE_STATUS_CLASSES[affiliate.status] ?? "bg-gray-50 text-gray-700"
                  }`}
                >
                  {AFFILIATE_STATUS_LABELS[affiliate.status] ?? affiliate.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-gray-600">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {affiliate.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {affiliate.phone}
                  </span>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  Referral code:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    {affiliate.referralCode}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-gray-600" />
              Bank/UPI Details
            </h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">{withdrawal.method}</p>
              {(withdrawal.bankName ||
                withdrawal.accountNumber ||
                withdrawal.ifsc ||
                withdrawal.upiId) && (
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {withdrawal.bankName && (
                    <div>
                      <dt className="text-xs text-gray-500 uppercase tracking-wider">
                        Bank Name
                      </dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {withdrawal.bankName}
                      </dd>
                    </div>
                  )}
                  {withdrawal.accountNumber && (
                    <div>
                      <dt className="text-xs text-gray-500 uppercase tracking-wider">
                        Account Number
                      </dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {withdrawal.accountNumber}
                      </dd>
                    </div>
                  )}
                  {withdrawal.ifsc && (
                    <div>
                      <dt className="text-xs text-gray-500 uppercase tracking-wider">
                        IFSC Code
                      </dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {withdrawal.ifsc}
                      </dd>
                    </div>
                  )}
                  {withdrawal.upiId && (
                    <div className="sm:col-span-3">
                      <dt className="text-xs text-gray-500 uppercase tracking-wider">
                        UPI ID
                      </dt>
                      <dd className="mt-0.5 font-medium text-gray-900">
                        {withdrawal.upiId}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {!withdrawal.bankName &&
                !withdrawal.accountNumber &&
                !withdrawal.ifsc &&
                !withdrawal.upiId && (
                  <p className="text-sm text-gray-500">
                    Full bank / UPI details are not available for this request.
                  </p>
                )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-gray-600" />
              Payment Summary
            </h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Requested Amount
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(requestedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Payouts
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(totalPayouts)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Wallet Balance
                </p>
                <p className="text-lg font-semibold text-emerald-700">
                  {formatCurrency(affiliate.walletBalance)}
                </p>
              </div>
            </div>
          </section>

          {referredUsers.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-600" />
                Referred Users & Earnings
              </h2>
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="py-2.5 pr-4 text-left font-semibold">
                          User Name
                        </th>
                        <th className="py-2.5 px-4 text-left font-semibold">
                          Email
                        </th>
                        <th className="py-2.5 px-4 text-left font-semibold">
                          Product Name
                         </th>
                         <th className="py-2.5 px-4 text-left font-semibold">
                          Amount
                         </th>
                         <th className="py-2.5 px-4 text-left font-semibold">
                          Commission Amount
                         </th>
                         <th className="py-2.5 px-4 text-left font-semibold">
                          Registered On
                        </th>
                        <th className="py-2.5 pl-4 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReferredUsers.map((user, index) => {
                        const globalIndex = referredUsersStartIndex + index;
                        const order = referredOrders[globalIndex];
                        const productName = order?.productName ?? "—";
                        const amountDisplay = order
                          ? formatCurrency(order.amount)
                          : "—";
                        const commissionDisplay = order
                          ? formatCurrency(
                              (order.amount * affiliate.commissionRate) / 100
                            )
                          : "—";
                        const registeredOnDisplay = formatDate(user.registeredAt);

                        return (
                          <tr
                            key={user.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2.5 pr-4 whitespace-nowrap text-gray-900">
                              {user.name}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                              {user.email}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                              {productName}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                              {amountDisplay}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                              {commissionDisplay}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                              {registeredOnDisplay}
                            </td>
                            <td className="py-2.5 pl-4 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReferredUser({
                                    name: user.name,
                                    email: user.email,
                                    productName,
                                    amountDisplay,
                                    commissionDisplay,
                                    registeredOn: registeredOnDisplay,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {referredUsers.length > REFERRED_USERS_PER_PAGE && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 mt-2">
                    <p className="text-xs text-gray-500">
                      Page {currentReferredUsersPage} of {totalReferredUsersPages}
                    </p>
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReferredUsersPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentReferredUsersPage === 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReferredUsersPage((prev) =>
                            Math.min(totalReferredUsersPages, prev + 1)
                          )
                        }
                        disabled={
                          currentReferredUsersPage === totalReferredUsersPages
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Total earnings via these users:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(totalCommission)}
                  </span>
                </p>
                {selectedReferredUser && (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Selected User
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedReferredUser.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {selectedReferredUser.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReferredUser(null)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Product
                        </p>
                        <p className="mt-0.5 font-medium text-gray-900">
                          {selectedReferredUser.productName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Amount
                        </p>
                        <p className="mt-0.5 font-medium text-gray-900">
                          {selectedReferredUser.amountDisplay}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Commission
                        </p>
                        <p className="mt-0.5 font-medium text-gray-900">
                          {selectedReferredUser.commissionDisplay}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Registered on {selectedReferredUser.registeredOn}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {withdrawal.auditEvents && withdrawal.auditEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-600" />
                Audit Trail
              </h2>
              <ul className="space-y-2">
                {withdrawal.auditEvents.map((evt, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium capitalize">
                      {evt.action.replace("_", " ")}
                    </span>
                    <span className="text-gray-500">
                      {formatDateTime(evt.date)}
                    </span>
                    {evt.notes && (
                      <span className="text-gray-500 italic">— {evt.notes}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(withdrawal.processedAt || withdrawal.paidAt) && (
            <p className="text-xs text-gray-500">
              {withdrawal.processedAt && (
                <>Processed: {formatDateTime(withdrawal.processedAt)}</>
              )}
              {withdrawal.processedAt && withdrawal.paidAt && " · "}
              {withdrawal.paidAt && (
                <>Marked paid: {formatDateTime(withdrawal.paidAt)}</>
              )}
            </p>
          )}

          {(isPending || isApproved) && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {isApproved && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Banknote className="w-4 h-4" />
                  Mark Paid
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
