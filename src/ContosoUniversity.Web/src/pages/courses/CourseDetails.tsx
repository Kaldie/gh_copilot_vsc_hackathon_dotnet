import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { CourseDetailDto } from "@/types";

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CourseDetailDto>(`/courses/${id}`)
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingDetail />;
  if (!course) return <p className="text-sm text-red-500">Course not found.</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Course Details</h1>
        <div className="flex items-center gap-2">
          <Link to={`/courses/${course.courseId}/edit`} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Edit</Link>
          <Link to={`/courses/${course.courseId}/delete`} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">Delete</Link>
        </div>
      </div>
      <div className="mb-6 rounded-lg border border-gray-100 bg-white p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-400">Course ID</dt>
            <dd className="mt-1 text-gray-900">{course.courseId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Title</dt>
            <dd className="mt-1 text-gray-900">{course.title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Credits</dt>
            <dd className="mt-1 text-gray-900">{course.credits}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Department</dt>
            <dd className="mt-1 text-gray-900">{course.departmentName}</dd>
          </div>
        </dl>
        {course.imagePath && (
          <div className="mt-4">
            <dt className="mb-2 text-xs font-medium text-gray-400">Teaching Material</dt>
            <img
              src={course.imagePath}
              alt={`${course.title} teaching material`}
              className="max-h-64 rounded-lg border border-gray-100"
            />
          </div>
        )}
      </div>
      <Link to="/courses" className="text-sm text-gray-400 transition-colors hover:text-gray-700">← Back to List</Link>
    </div>
  );
}
