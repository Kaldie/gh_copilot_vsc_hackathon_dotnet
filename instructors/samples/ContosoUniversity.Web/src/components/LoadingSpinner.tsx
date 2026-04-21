export default function LoadingSpinner() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-600" />
            <div className="h-4 w-1/5 rounded bg-gray-200 dark:bg-gray-600" />
            <div className="ml-auto h-4 w-16 rounded bg-gray-200 dark:bg-gray-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="mx-auto max-w-lg animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4">
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
}

export function LoadingDetail() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-56 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="mb-1 h-3 w-20 rounded bg-gray-200 dark:bg-gray-600" />
              <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
