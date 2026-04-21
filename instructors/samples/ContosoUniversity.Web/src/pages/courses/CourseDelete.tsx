import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { CourseDetailDto } from "@/types";

export default function CourseDelete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<CourseDetailDto>(`/courses/${id}`)
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      navigate("/courses");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingDetail />;
  if (!course) return <p className="text-sm text-red-500">Course not found.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Course</h1>
      <div className="rounded-lg border border-red-100 bg-white dark:bg-gray-800 p-6">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete course <strong>{course.courseId} — {course.title}</strong>?
        </p>
        <dl className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Course ID</dt>
            <dd className="mt-1 text-gray-900 dark:text-gray-100">{course.courseId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Title</dt>
            <dd className="mt-1 text-gray-900 dark:text-gray-100">{course.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Credits</dt>
            <dd className="mt-1 text-gray-900 dark:text-gray-100">{course.credits}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Department</dt>
            <dd className="mt-1 text-gray-900 dark:text-gray-100">{course.departmentName}</dd>
          </div>
        </dl>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40">
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>
          <Link to="/courses" className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            Back to List
          </Link>
        </div>
      </div>
    </div>
  );
}
