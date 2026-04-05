import { AccountantClient } from "@/components/AccountantClient";

export const dynamic = "force-dynamic";

function parseBudget(): number {
  const raw = process.env.ACCOUNTANT_BUDGET_RUB?.trim();
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 10000;
}

export default function AccountantPage() {
  const budgetRub = parseBudget();
  return <AccountantClient budgetRub={budgetRub} />;
}
