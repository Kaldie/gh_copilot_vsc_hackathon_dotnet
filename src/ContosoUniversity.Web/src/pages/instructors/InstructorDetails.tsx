import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type { InstructorDetailDto, CourseListDto } from "@/types";

export default function InstructorDetails() {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<InstructorDetailDto | null>(null);
  const [courses, setCourses] = useState<CourseListDto[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const fetchInstructor = async () => {
    try {
      const data = await api.get<InstructorDetailDto>(`/instructors/${id}`);
      setInstructor(data);
    } catch {
      /* handled by null state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructor();
    api.get<CourseListDto[]>("/courses").then(setCourses).catch(console.error);
  }, [id]);

  const handleAssign = async () => {
    if (!selectedCourseId || !id) return;
    try {
      await api.post<InstructorDetailDto>(`/instructors/${id}/courses`, {
        courseId: selectedCourseId,
      });
      setSelectedCourseId("");
      await fetchInstructor();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (courseId: number) => {
    if (!id) return;
    try {
      await api.delete(`/instructors/${id}/courses/${courseId}`);
      await fetchInstructor();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingDetail />;
  if (!instructor) return <p className="text-sm text-red-500">Instructor not found.</p>;

  const assignedCourseIds = new Set(instructor.courses.map((c) => c.courseId));
  const availableCourses = courses.filter((c) => !assignedCourseIds.has(c.courseId));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Instructor Details</h1>
        <div className="flex items-center gap-2">
          <Link to={`/instructors/${instructor.id}/edit`} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Edit</Link>
          <Link to={`/instructors/${instructor.id}/delete`} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">Delete</Link>
        </div>
      </div>
      <div className="mb-8 rounded-lg border border-gray-100 bg-white p-6">
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-xs font-medium text-gray-400">Last Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{instructor.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">First Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{instructor.firstMidName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Hire Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(instructor.hireDate).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400">Office</dt>
            <dd className="mt-1 text-sm text-gray-900">{instructor.officeLocation ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400">Assigned Courses</h2>
        <Link to="/instructors" className="text-sm text-gray-400 transition-colors hover:text-gray-700">← Back to List</Link>
      </div>

      {instructor.courses.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">No courses assigned yet.</p>
      ) : (
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-100 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Course</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Credits</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">Department</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {instructor.courses.map((c, idx) => (
                <tr key={c.courseId} className={idx < instructor.courses.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    <Link to={`/courses/${c.courseId}`} className="text-blue-600 hover:underline">
                      {c.courseId} — {c.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700">{c.credits}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700">{c.departmentName}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    <button
                      onClick={() => handleUnassign(c.courseId)}
                      className="text-sm text-red-500 transition-colors hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-4">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
        >
          <option value="">Select a course...</option>
          {availableCourses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseId} - {c.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={!selectedCourseId}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
