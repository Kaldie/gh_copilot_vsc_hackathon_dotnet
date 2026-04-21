import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import type { CourseListDto } from "@/types";

export default function CourseList() {
  const [courses, setCourses] = useState<CourseListDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CourseListDto[]>("/courses")
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<CourseListDto>[] = [
    {
      key: "courseId",
      header: "Course ID",
      render: (c) => (
        <Link to={`/courses/${c.courseId}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400">
          {c.courseId}
        </Link>
      ),
    },
    { key: "title", header: "Title", render: (c) => c.title },
    { key: "credits", header: "Credits", render: (c) => c.credits },
    { key: "department", header: "Department", render: (c) => c.departmentName },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <Link to={`/courses/${c.courseId}`} className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100">View →</Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Courses</h1>
        <Link
          to="/courses/create"
          className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Create New
        </Link>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={courses}
          keyExtractor={(c) => c.courseId}
          emptyMessage="No courses found."
        />
      )}
    </div>
  );
}
