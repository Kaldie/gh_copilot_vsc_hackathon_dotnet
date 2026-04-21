import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DataTable, { type Column } from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { api } from "@/services/api";
import type { PaginatedResult, StudentListDto } from "@/types";

export default function StudentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedResult<StudentListDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const searchString = searchParams.get("search") ?? "";
  const sortOrder = searchParams.get("sort") ?? "LastName";
  const pageIndex = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchString) params.set("searchString", searchString);
    params.set("sortOrder", sortOrder);
    params.set("pageIndex", String(pageIndex));
    params.set("pageSize", "10");

    api
      .get<PaginatedResult<StudentListDto>>(`/students?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchString, sortOrder, pageIndex]);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSearchParams(next);
  };

  const handleSort = (key: string, direction: "asc" | "desc") => {
    const sort = direction === "desc" ? `${key}_desc` : key;
    updateParams({ sort, page: "1" });
  };

  const handleSearch = (query: string) => {
    updateParams({ search: query, page: "1" });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: String(page) });
  };

  const columns: Column<StudentListDto>[] = [
    {
      key: "LastName",
      header: "Last Name",
      sortable: true,
      render: (s) => <Link to={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-gray-600">{s.lastName}</Link>,
    },
    {
      key: "FirstName",
      header: "First Name",
      sortable: true,
      render: (s) => s.firstMidName,
    },
    {
      key: "EnrollmentDate",
      header: "Enrollment Date",
      sortable: true,
      render: (s) => new Date(s.enrollmentDate).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <Link to={`/students/${s.id}`} className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">View →</Link>
      ),
    },
  ];

  const currentSortKey = sortOrder.replace("_desc", "");
  const currentSortDirection: "asc" | "desc" = sortOrder.endsWith("_desc") ? "desc" : "asc";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Students</h1>
        <Link
          to="/students/create"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Create New
        </Link>
      </div>

      <div className="mb-4">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by name..."
          initialValue={searchString}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            data={data.items}
            keyExtractor={(s) => s.id}
            onSort={handleSort}
            currentSortKey={currentSortKey}
            currentSortDirection={currentSortDirection}
            emptyMessage="No students found."
          />
          <Pagination
            pageIndex={data.pageIndex}
            totalPages={data.totalPages}
            hasPreviousPage={data.hasPreviousPage}
            hasNextPage={data.hasNextPage}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </div>
  );
}
