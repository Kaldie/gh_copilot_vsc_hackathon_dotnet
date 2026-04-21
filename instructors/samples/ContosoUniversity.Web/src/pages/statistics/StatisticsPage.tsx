import { useEffect, useState } from "react";
import { api } from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { EnrollmentStatDto } from "@/types";

export default function StatisticsPage() {
  const [stats, setStats] = useState<EnrollmentStatDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EnrollmentStatDto[]>("/statistics/enrollments")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Enrollment Statistics</h1>
      {loading ? (
        <LoadingSpinner />
      ) : stats.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No enrollment data available.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500">
                  Enrollment Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-500">
                  Student Count
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, idx) => (
                <tr key={s.enrollmentDate} className={idx < stats.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(s.enrollmentDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                    {s.studentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
