interface DashboardHeaderProps {
  title?: string;
  businessName?: string;
}

export default function DashboardHeader({
  title = 'Dashboard',
  businessName,
}: DashboardHeaderProps) {
  return (
    <header className="rounded border border-gray-200 bg-white px-6 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-500">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="rounded border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
          <p className="uppercase tracking-[0.28em] text-gray-500">Current Business</p>
          <p className="mt-1 font-medium text-gray-900">{businessName ?? 'No business selected'}</p>
        </div>
      </div>
    </header>
  );
}
