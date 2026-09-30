/** Page-shaped placeholder while the next screen's data loads. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-8 lg:py-12" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-md bg-surface-muted" />
      <div className="mt-3 h-4 w-32 rounded bg-surface-muted" />
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="h-64 rounded-lg border border-line bg-surface" />
        <div className="h-64 rounded-lg border border-line bg-surface" />
      </div>
      <div className="mt-6 h-72 rounded-lg border border-line bg-surface" />
    </div>
  );
}
