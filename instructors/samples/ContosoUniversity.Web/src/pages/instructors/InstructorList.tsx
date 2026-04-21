import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import type { InstructorListDto, CourseListDto, EnrollmentDto } from "@/types";

export default function InstructorList() {
  const [instructors, setInstructors] = useState<InstructorListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [courses, setCourses] = useState<CourseListDto[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);

  useEffect(() => {
    api.get<InstructorListDto[]>("/instructors")
      .then(setInstructors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectInstructor = async (id: number) => {
    if (selectedInstructor === id) {
      setSelectedInstructor(null);
      setCourses([]);
      setSelectedCourse(null);
      setEnrollments([]);
      return;
    }
    setSelectedInstructor(id);
    setSelectedCourse(null);
    setEnrollments([]);
    try {
      const detail = await api.get<{ courses: CourseListDto[] }>(`/instructors/${id}`);
      setCourses(detail.courses);
    } catch {
      setCourses([]);
    }
  };

  const handleSelectCourse = async (courseId: number) => {
    if (selectedCourse === courseId) {
      setSelectedCourse(null);
      setEnrollments([]);
      return;
    }
    setSelectedCourse(courseId);
    try {
      const data = await api.get<EnrollmentDto[]>(
        `/instructors/${selectedInstructor}/courses/${courseId}/enrollments`
      );
      setEnrollments(data);
    } catch {
      setEnrollments([]);
    }
  };

  const instructorColumns: Column<InstructorListDto>[] = [
    {
      key: "lastName",
      header: "Last Name",
      render: (i) => (
        <button
          onClick={() => handleSelectInstructor(i.id)}
          className={`text-left font-medium transition-colors ${selectedInstructor === i.id ? "text-gray-900 dark:text-gray-100 underline" : "text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400"}`}
        >
          {i.lastName}
        </button>
      ),
    },
    { key: "firstMidName", header: "First Name", render: (i) => i.firstMidName },
    { key: "hireDate", header: "Hire Date", render: (i) => new Date(i.hireDate).toLocaleDateString() },
    { key: "office", header: "Office", render: (i) => i.officeLocation ?? "" },
    {
      key: "actions",
      header: "",
      render: (i) => (
        <Link to={`/instructors/${i.id}`} className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100">View →</Link>
      ),
    },
  ];

  const courseColumns: Column<CourseListDto>[] = [
    {
      key: "courseId",
      header: "Course ID",
      render: (c) => (
        <button
          onClick={() => handleSelectCourse(c.courseId)}
          className={`text-left font-medium transition-colors ${selectedCourse === c.courseId ? "text-gray-900 dark:text-gray-100 underline" : "text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400"}`}
        >
          {c.courseId}
        </button>
      ),
    },
    { key: "title", header: "Title", render: (c) => c.title },
    { key: "department", header: "Department", render: (c) => c.departmentName },
  ];

  const enrollmentColumns: Column<EnrollmentDto>[] = [
    { key: "studentName", header: "Student", render: (e) => e.studentName ?? "" },
    { key: "grade", header: "Grade", render: (e) => e.grade ?? "No Grade" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Instructors</h1>
        <Link
          to="/instructors/create"
          className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Create New
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={instructorColumns}
          data={instructors}
          keyExtractor={(i) => i.id}
          emptyMessage="No instructors found."
        />
      )}

      {selectedInstructor !== null && courses.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-gray-400 dark:text-gray-500">Courses Taught</h2>
          <DataTable
            columns={courseColumns}
            data={courses}
            keyExtractor={(c) => c.courseId}
            emptyMessage="No courses assigned."
          />
        </div>
      )}

      {selectedCourse !== null && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-gray-400 dark:text-gray-500">Enrolled Students</h2>
          <DataTable
            columns={enrollmentColumns}
            data={enrollments}
            keyExtractor={(e) => e.enrollmentId}
            emptyMessage="No students enrolled."
          />
        </div>
      )}
    </div>
  );
}
