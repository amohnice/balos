import React from 'react';

interface MetricsCardsProps {
  totalBales: number;
  totalValue: number;
  loadingBales: boolean;
}

export default function MetricsCards({ totalBales, totalValue, loadingBales }: MetricsCardsProps) {
  return (
    <section className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
      {/* Card 1: Count */}
      <div className="border border-zinc-850 bg-zinc-900/20 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/5 blur-3xl rounded-full" />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Bales Checked In</span>
        <div className="text-4xl font-extrabold tracking-tight mt-2.5 text-zinc-50 flex items-baseline gap-2">
          {loadingBales ? '...' : totalBales}
          <span className="text-xs text-zinc-500 font-normal">units</span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Bale stock registers isolated to active tenant</p>
      </div>

      {/* Card 2: Investment */}
      <div className="border border-zinc-850 bg-zinc-900/20 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
        <div className="absolute top-0 right-0 h-28 w-28 bg-teal-500/5 blur-3xl rounded-full" />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Valuation (KES)</span>
        <div className="text-4xl font-extrabold tracking-tight mt-2.5 text-emerald-400 flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-zinc-400">KES</span>
          {loadingBales ? '...' : totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-zinc-500 mt-2">Sum of purchase prices for active open stock</p>
      </div>
    </section>
  );
}
