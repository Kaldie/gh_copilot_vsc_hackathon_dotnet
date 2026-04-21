import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { getResolvedColors } from "@/utils/departmentColors";
import type { DepartmentListDto } from "@/types";

export default function DepartmentLegend({ isDark = false }: { isDark?: boolean }) {
  const [departments, setDepartments] = useState<DepartmentListDto[]>([]);

  useEffect(() => {
    api.get<DepartmentListDto[]>("/departments").then(setDepartments).catch(console.error);
  }, []);

  if (departments.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Departments</h3>
      <div className="flex flex-col gap-1.5">
        {departments.map((dept) => {
          const colors = getResolvedColors(dept.departmentId, dept.color, isDark);
          return (
            <div key={dept.departmentId} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.text}40` }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{dept.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
