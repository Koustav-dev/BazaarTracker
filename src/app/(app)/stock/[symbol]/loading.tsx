export default function StockLoading() {
  return (
    <div className="space-y-4 page">
      <div className="skeleton h-6 w-32" />
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-64" />
            <div className="skeleton h-12 w-40 mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-10 w-36" />
            <div className="skeleton h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-bg-border">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10" />)}
        </div>
      </div>
      <div className="skeleton h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 skeleton h-64 rounded-2xl" />
        <div className="lg:col-span-2 skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}
