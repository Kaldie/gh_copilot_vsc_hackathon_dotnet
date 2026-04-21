import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { api } from "@/services/api";
import type { StudentDetailDto, CreateStudentDto, ApiError } from "@/types";

export default function StudentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateStudentDto>({
    lastName: "",
    firstMidName: "",
    enrollmentDate: new Date().toISOString().split("T")[0]!,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await api.post<StudentDetailDto>("/students", {
        ...form,
        enrollmentDate: new Date(form.enrollmentDate).toISOString(),
      });
      navigate("/students");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Create Student</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 bg-white p-6">
        <FormField label="Last Name" htmlFor="lastName" error={errors["LastName"]?.[0]}>
          <input
            id="lastName"
            type="text"
            required
            maxLength={50}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
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
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
          />
        </FormField>
        <FormField label="Enrollment Date" htmlFor="enrollmentDate" error={errors["EnrollmentDate"]?.[0]}>
          <input
            id="enrollmentDate"
            type="date"
            required
            value={form.enrollmentDate}
            onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
          />
        </FormField>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
          <Link to="/students" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
