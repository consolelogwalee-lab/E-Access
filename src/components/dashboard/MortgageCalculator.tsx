"use client";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { naira } from "@/lib/format";

export function MortgageCalculator({ price }: { price: number | string }) {
  const P = Number(price);
  const [depositPct, setDepositPct] = useState(30);
  const [rate, setRate] = useState(18);
  const [years, setYears] = useState(15);

  const { monthly, totalInterest, loan } = useMemo(() => {
    const loan = P * (1 - depositPct / 100);
    const r = rate / 100 / 12;
    const n = years * 12;
    const monthly = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
    return { monthly, totalInterest: monthly * n - loan, loan };
  }, [P, depositPct, rate, years]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
        <Calculator size={17} className="text-brand-500" /> Payment Calculator
      </h3>
      <p className="body-r mt-1 text-neutral-400">Estimate monthly payments for this property</p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Down payment</span>
            <span className="font-semibold text-neutral-800">{depositPct}% • {naira(Math.round(P * depositPct / 100))}</span>
          </div>
          <input type="range" min={10} max={90} step={5} value={depositPct}
            onChange={(e) => setDepositPct(Number(e.target.value))}
            className="w-full accent-[#0d06a7]" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Interest rate</span>
            <span className="font-semibold text-neutral-800">{rate}% p.a.</span>
          </div>
          <input type="range" min={6} max={30} step={0.5} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-[#0d06a7]" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Term</span>
            <span className="font-semibold text-neutral-800">{years} years</span>
          </div>
          <input type="range" min={5} max={30} step={5} value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-[#0d06a7]" />
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-neutral-50 p-4">
        <div className="caption text-neutral-500">Estimated monthly payment</div>
        <div className="mt-1 text-xl font-bold text-brand-500">{naira(Math.round(monthly))}<span className="text-sm font-medium text-neutral-400">/month</span></div>
        <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
          <span>Loan: {naira(Math.round(loan))}</span>
          <span>Total interest: {naira(Math.round(totalInterest))}</span>
        </div>
      </div>
      <p className="caption mt-3 text-neutral-400">
        Estimates only. Actual mortgage terms depend on your lender and eligibility.
      </p>
    </div>
  );
}
