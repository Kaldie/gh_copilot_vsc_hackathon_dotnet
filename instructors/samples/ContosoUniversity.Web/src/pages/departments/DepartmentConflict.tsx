import { useLocation, useNavigate, useParams, Link } from "react-router-dom";

interface ConflictValues {
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  administratorName?: string | null;
  rowVersion: string;
}

interface ConflictState {
  currentValues: ConflictValues;
  submittedValues: ConflictValues;
}

export default function DepartmentConflict() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ConflictState | null;

  if (!state) {
    return (
      <div className="text-center">
        <p className="mb-4 text-gray-500 dark:text-gray-400">No conflict data available.</p>
        <Link to="/departments" className="text-blue-600 hover:underline">Back to List</Link>
      </div>
    );
  }

  const { currentValues, submittedValues } = state;

  const fields: { label: string; current: string; submitted: string }[] = [
    { label: "Name", current: currentValues.name, submitted: submittedValues.name },
    {
      label: "Budget",
      current: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(currentValues.budget),
      submitted: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(submittedValues.budget),
    },
    {
      label: "Start Date",
      current: new Date(currentValues.startDate).toLocaleDateString(),
      submitted: new Date(submittedValues.startDate).toLocaleDateString(),
    },
    {
      label: "Administrator",
      current: currentValues.administratorName ?? "None",
      submitted: submittedValues.instructorId?.toString() ?? "None",
    },
  ];

  const handleRetry = () => {
    // Go back to edit page — user will re-submit with fresh rowVersion
    navigate(`/departments/${id}/edit`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Concurrency Conflict</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        The department was modified by another user. Compare the values below and decide how to proceed.
      </p>

      <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Database Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Your Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.map((f) => (
              <tr key={f.label} className={f.current !== f.submitted ? "bg-yellow-50" : ""}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{f.label}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.current}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleRetry}
          className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Edit Again (with latest data)
        </button>
        <Link
          to="/departments"
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
