import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { api } from "@/services/api";
import type { DepartmentDetailDto, InstructorListDto, ApiError } from "@/types";

export default function DepartmentCreate() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorListDto[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<InstructorListDto[]>("/instructors").then(setInstructors).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const result = await api.post<DepartmentDetailDto>("/departments", {
        name,
        budget: parseFloat(budget),
        startDate: new Date(startDate).toISOString(),
        instructorId: instructorId ? parseInt(instructorId, 10) : null,
      });
      navigate(`/departments/${result.departmentId}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Create Department</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 bg-white p-6">
        <FormField label="Name" htmlFor="name" error={errors["Name"]?.[0]}>
          <input id="name" type="text" required minLength={3} maxLength={50} value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="Budget" htmlFor="budget" error={errors["Budget"]?.[0]}>
          <input id="budget" type="number" required step="0.01" min="0" value={budget} onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="Start Date" htmlFor="startDate" error={errors["StartDate"]?.[0]}>
          <input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none" />
        </FormField>
        <FormField label="Administrator (optional)" htmlFor="instructorId">
          <select id="instructorId" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none">
            <option value="">None</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.lastName}, {i.firstMidName}</option>
            ))}
          </select>
        </FormField>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={submitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40">
            {submitting ? "Creating..." : "Create"}
          </button>
          <Link to="/departments" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
