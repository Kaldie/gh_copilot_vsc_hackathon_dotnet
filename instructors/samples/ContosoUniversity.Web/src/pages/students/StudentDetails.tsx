import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { LoadingDetail } from "@/components/LoadingSpinner";
import type {
  StudentDetailDto,
  EnrollmentDto,
  CourseListDto,
  CreateEnrollmentDto,
  UpdateEnrollmentGradeDto,
  Grade,
} from "@/types";

const GRADES: Grade[] = ["A", "B", "C", "D", "F"];

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetailDto | null>(null);
  const [courses, setCourses] = useState<CourseListDto[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    try {
      const data = await api.get<StudentDetailDto>(`/students/${id}`);
      setStudent(data);
    } catch {
      /* handled by null state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    api.get<CourseListDto[]>("/courses").then(setCourses).catch(console.error);
  }, [id]);

  const handleEnroll = async () => {
    if (!selectedCourseId || !id) return;
    try {
      await api.post<EnrollmentDto>(`/students/${id}/enrollments`, {
        courseId: selectedCourseId,
      } satisfies CreateEnrollmentDto);
      setSelectedCourseId("");
      await fetchStudent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeChange = async (enrollmentId: number, grade: Grade) => {
    if (!id) return;
    try {
      await api.put<EnrollmentDto>(`/students/${id}/enrollments/${enrollmentId}`, {
        grade,
      } satisfies UpdateEnrollmentGradeDto);
      await fetchStudent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (enrollmentId: number) => {
    if (!id) return;
    try {
      await api.delete(`/students/${id}/enrollments/${enrollmentId}`);
      await fetchStudent();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingDetail />;
  if (!student) return <p className="text-sm text-red-500">Student not found.</p>;

  const enrolledCourseIds = new Set(student.enrollments.map((e) => e.courseId));
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.courseId));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Student Details</h1>
        <div className="flex items-center gap-2">
          <Link to={`/students/${student.id}/edit`} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">Edit</Link>
          <Link to={`/students/${student.id}/delete`} className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30">Delete</Link>
        </div>
      </div>
      <div className="mb-8 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Last Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">First Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.firstMidName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">Enrollment Date</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{new Date(student.enrollmentDate).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400 dark:text-gray-500">Enrollments</h2>
        <Link to="/students" className="text-sm text-gray-400 dark:text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300">← Back to List</Link>
      </div>

      {student.enrollments.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">No enrollments yet.</p>
      ) : (
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500">Course</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500">Grade</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {student.enrollments.map((e, idx) => (
                <tr key={e.enrollmentId} className={idx < student.enrollments.length - 1 ? "border-b border-gray-50 dark:border-gray-700" : ""}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{e.courseTitle}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    <select
                      value={e.grade ?? ""}
                      onChange={(ev) => {
                        if (ev.target.value) handleGradeChange(e.enrollmentId, ev.target.value as Grade);
                      }}
                      className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none"
                    >
                      <option value="">No grade</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    <button
                      onClick={() => handleDrop(e.enrollmentId)}
                      className="text-sm text-red-500 transition-colors hover:text-red-700"
                    >
                      Drop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none"
        >
          <option value="">Select a course...</option>
          {availableCourses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseId} - {c.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleEnroll}
          disabled={!selectedCourseId}
          className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40"
        >
          Enroll
        </button>
      </div>
    </div>
  );
}
