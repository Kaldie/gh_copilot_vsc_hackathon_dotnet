import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { LoadingCard } from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import type { StudentDetailDto, UpdateStudentDto, ApiError } from "@/types";

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<UpdateStudentDto>({
    lastName: "",
    firstMidName: "",
    enrollmentDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<StudentDetailDto>(`/students/${id}`)
      .then((s) => {
        setForm({
          lastName: s.lastName,
          firstMidName: s.firstMidName,
          enrollmentDate: s.enrollmentDate.split("T")[0]!,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await api.put<StudentDetailDto>(`/students/${id}`, {
        ...form,
        enrollmentDate: new Date(form.enrollmentDate).toISOString(),
      });
      navigate(`/students/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Student</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <FormField label="Last Name" htmlFor="lastName" error={errors["LastName"]?.[0]}>
          <input
            id="lastName"
            type="text"
            required
            maxLength={50}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none"
          />
        </FormField>
        <FormField label="First Name" htmlFor="firstMidName" error={errors["FirstMidName"]?.[0]}>
          <input
            id="firstMidName"
            type="text"
            required
            maxLength={50}
            value={form.firstMidName}
            onChange={(e) => setForm({ ...form, firstMidName: e.target.value })}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none"
          />
        </FormField>
        <FormField label="Enrollment Date" htmlFor="enrollmentDate" error={errors["EnrollmentDate"]?.[0]}>
          <input
            id="enrollmentDate"
            type="date"
            required
            value={form.enrollmentDate}
            onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none"
          />
        </FormField>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <Link to={`/students/${id}`} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
