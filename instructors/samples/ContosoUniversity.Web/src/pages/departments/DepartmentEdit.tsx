import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { api } from "@/services/api";
import { LoadingCard } from "@/components/LoadingSpinner";
import type { DepartmentDetailDto, InstructorListDto, ApiError } from "@/types";

export default function DepartmentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<InstructorListDto[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [rowVersion, setRowVersion] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DepartmentDetailDto>(`/departments/${id}`),
      api.get<InstructorListDto[]>("/instructors"),
    ]).then(([dept, instr]) => {
      setName(dept.name);
      setBudget(dept.budget.toString());
      setStartDate(dept.startDate.split("T")[0] ?? "");
      setInstructorId(dept.instructorId?.toString() ?? "");
      setRowVersion(dept.rowVersion);
      setColor(dept.color ?? null);
      setInstructors(instr);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      await api.put<DepartmentDetailDto>(`/departments/${id}`, {
        name,
        budget: parseFloat(budget),
        startDate: new Date(startDate).toISOString(),
        instructorId: instructorId ? parseInt(instructorId, 10) : null,
        rowVersion,
        color,
      });
      navigate(`/departments/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        // Navigate to conflict page with conflict data
        navigate(`/departments/${id}/conflict`, {
          state: {
            currentValues: apiErr.currentValues,
            submittedValues: apiErr.submittedValues,
          },
        });
      } else if (apiErr.errors) {
        setErrors(apiErr.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Department</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <FormField label="Name" htmlFor="name" error={errors["Name"]?.[0]}>
          <input id="name" type="text" required minLength={3} maxLength={50} value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" />
        </FormField>
        <FormField label="Budget" htmlFor="budget" error={errors["Budget"]?.[0]}>
          <input id="budget" type="number" required step="0.01" min="0" value={budget} onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" />
        </FormField>
        <FormField label="Start Date" htmlFor="startDate" error={errors["StartDate"]?.[0]}>
          <input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" />
        </FormField>
        <FormField label="Administrator (optional)" htmlFor="instructorId">
          <select id="instructorId" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none">
            <option value="">None</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.lastName}, {i.firstMidName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Color (optional)" htmlFor="color">
          <div className="flex items-center gap-2">
            <input id="color" type="color" value={color ?? "#3b82f6"} onChange={(e) => setColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-gray-200 dark:border-gray-600" />
            {color && (
              <button type="button" onClick={() => setColor(null)}
                className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-300">Reset to auto</button>
            )}
          </div>
        </FormField>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={submitting}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40">
            {submitting ? "Saving..." : "Save"}
          </button>
          <Link to="/departments" className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
