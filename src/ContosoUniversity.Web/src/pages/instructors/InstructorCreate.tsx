import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { api } from "@/services/api";
import type { InstructorDetailDto, CourseListDto, ApiError } from "@/types";

export default function InstructorCreate() {
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<CourseListDto[]>([]);
  const [lastName, setLastName] = useState("");
  const [firstMidName, setFirstMidName] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<CourseListDto[]>("/courses").then(setAllCourses).catch(console.error);
  }, []);

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const result = await api.post<InstructorDetailDto>("/instructors", {
        lastName,
        firstMidName,
        hireDate: new Date(hireDate).toISOString(),
        officeLocation: officeLocation || null,
        courseIds: selectedCourseIds,
      });
      navigate(`/instructors/${result.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Create Instructor</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 bg-white p-6">
        <FormField label="Last Name" htmlFor="lastName" error={errors["LastName"]?.[0]}>
          <input id="lastName" type="text" required maxLength={50} value={lastName} onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="First Name" htmlFor="firstMidName" error={errors["FirstMidName"]?.[0]}>
          <input id="firstMidName" type="text" required maxLength={50} value={firstMidName} onChange={(e) => setFirstMidName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="Hire Date" htmlFor="hireDate" error={errors["HireDate"]?.[0]}>
          <input id="hireDate" type="date" required value={hireDate} onChange={(e) => setHireDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="Office Location (optional)" htmlFor="officeLocation">
          <input id="officeLocation" type="text" value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Assigned Courses</p>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-2">
            {allCourses.length === 0 ? (
              <p className="text-sm text-gray-500">No courses available.</p>
            ) : (
              allCourses.map((c) => (
                <label key={c.courseId} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.courseId)}
                    onChange={() => toggleCourse(c.courseId)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {c.courseId} — {c.title}
                </label>
              ))
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={submitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40">
            {submitting ? "Creating..." : "Create"}
          </button>
          <Link to="/instructors" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
