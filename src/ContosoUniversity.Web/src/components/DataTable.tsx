import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
  currentSortKey?: string;
  currentSortDirection?: "asc" | "desc";
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onSort,
  emptyMessage = "No data available.",
  currentSortKey,
  currentSortDirection,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(currentSortKey ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(currentSortDirection ?? "asc");

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-6 py-12 text-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 text-left text-xs font-medium text-gray-400 ${
                  col.sortable ? "cursor-pointer select-none hover:text-gray-600" : ""
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-gray-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              className={`transition-colors hover:bg-gray-50/50 ${idx < data.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700">
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
