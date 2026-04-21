import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { InstructorDetailDto } from "@/types";

export default function InstructorDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<InstructorDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<InstructorDetailDto>(`/instructors/${id}`)
      .then(setInstructor)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/instructors/${id}`);
      navigate("/instructors");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingDetail />;
  if (!instructor) return <p className="text-sm text-red-500">Instructor not found.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Instructor</h1>
      <div className="rounded-lg border border-red-100 bg-white dark:bg-gray-800 p-6">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{instructor.firstMidName} {instructor.lastName}</strong>?
        </p>
        <dl className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Last Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{instructor.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">First Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{instructor.firstMidName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Hire Date</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{new Date(instructor.hireDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Office</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{instructor.officeLocation ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40">
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>
          <Link to="/instructors" className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
