import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import type { DepartmentListDto } from "@/types";

export default function DepartmentList() {
  const [departments, setDepartments] = useState<DepartmentListDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DepartmentListDto[]>("/departments")
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<DepartmentListDto>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <Link to={`/departments/${d.departmentId}`} className="font-medium text-gray-900 hover:text-gray-600">
          {d.name}
        </Link>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      render: (d) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(d.budget),
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (d) => new Date(d.startDate).toLocaleDateString(),
    },
    { key: "administrator", header: "Administrator", render: (d) => d.administratorName ?? "—" },
    {
      key: "actions",
      header: "",
      render: (d) => (
        <Link to={`/departments/${d.departmentId}`} className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">View →</Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Departments</h1>
        <Link
          to="/departments/create"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Create New
        </Link>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          keyExtractor={(d) => d.departmentId}
          emptyMessage="No departments found."
        />
      )}
    </div>
  );
}
