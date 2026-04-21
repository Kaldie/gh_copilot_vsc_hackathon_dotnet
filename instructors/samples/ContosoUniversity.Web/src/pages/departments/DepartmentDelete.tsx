import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { DepartmentDetailDto } from "@/types";

interface DeleteError {
  message?: string;
  courses?: { courseId: number; title: string }[];
}

export default function DepartmentDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dept, setDept] = useState<DepartmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<DeleteError | null>(null);

  useEffect(() => {
    api
      .get<DepartmentDetailDto>(`/departments/${id}`)
      .then(setDept)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/departments/${id}`);
      navigate("/departments");
    } catch (err) {
      const apiErr = err as DeleteError & { status?: number };
      if (apiErr.courses) {
        setError({ message: apiErr.message, courses: apiErr.courses });
      } else {
        setError({ message: "Failed to delete department." });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingDetail />;
  if (!dept) return <p className="text-sm text-red-500">Department not found.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Department</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 dark:border-red-800 bg-red-50 p-4 text-red-800">
          <p className="font-medium">{error.message}</p>
          {error.courses && error.courses.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {error.courses.map((c) => (
                <li key={c.courseId}>{c.courseId} — {c.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <span className="font-semibold">{dept.name}</span>?
        </p>
        <dl className="space-y-2">
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
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={handleDelete} disabled={deleting}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40">
          {deleting ? "Deleting..." : "Delete"}
        </button>
        <Link to="/departments" className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </Link>
      </div>
    </div>
  );
}
