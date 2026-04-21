interface PaginationProps {
  pageIndex: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  pageIndex,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(pageIndex - 1)}
        disabled={!hasPreviousPage}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            page === pageIndex
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(pageIndex + 1)}
        disabled={!hasNextPage}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
