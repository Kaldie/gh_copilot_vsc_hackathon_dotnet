import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { DepartmentDetailDto } from "@/types";

export default function DepartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [dept, setDept] = useState<DepartmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DepartmentDetailDto>(`/departments/${id}`)
      .then(setDept)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingDetail />;
  if (!dept) return <p className="text-sm text-red-500">Department not found.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h1>
        <div className="flex items-center gap-2">
          <Link to={`/departments/${id}/edit`} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">Edit</Link>
          <Link to={`/departments/${id}/delete`} className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30">Delete</Link>
        </div>
      </div>
      <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Budget</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dept.budget)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Start Date</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{new Date(dept.startDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Administrator</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{dept.administratorName ?? "None"}</dd>
          </div>
        </dl>

        {dept.courses.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Courses</h2>
            <ul className="list-disc space-y-1 pl-5">
              {dept.courses.map((c) => (
                <li key={c.courseId}>
                  <Link to={`/courses/${c.courseId}`} className="text-blue-600 hover:underline">
                    {c.courseId} — {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Link to="/departments" className="text-sm text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300">← Back to List</Link>
      </div>
    </div>
  );
}
