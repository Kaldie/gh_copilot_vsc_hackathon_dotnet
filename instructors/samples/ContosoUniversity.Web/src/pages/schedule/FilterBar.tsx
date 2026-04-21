import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { StudentListDto, InstructorListDto, PaginatedResult } from "@/types";

export type FilterMode = "all" | "student" | "instructor";

export interface FilterState {
  mode: FilterMode;
  studentId?: number;
  instructorId?: number;
}

interface FilterBarProps {
  value: FilterState;
  onChange: (filter: FilterState) => void;
}

export default function FilterBar({ value, onChange }: FilterBarProps) {
  const [students, setStudents] = useState<StudentListDto[]>([]);
  const [instructors, setInstructors] = useState<InstructorListDto[]>([]);

  useEffect(() => {
    api.get<PaginatedResult<StudentListDto>>("/students?pageSize=100").then((r) => setStudents(r.items)).catch(console.error);
    api.get<InstructorListDto[]>("/instructors").then(setInstructors).catch(console.error);
  }, []);

  const handleModeChange = (mode: FilterMode) => {
    onChange({ mode, studentId: undefined, instructorId: undefined });
  };

  const handlePersonChange = (personId: string) => {
    const id = personId ? parseInt(personId, 10) : undefined;
    if (value.mode === "student") {
      onChange({ ...value, studentId: id });
    } else if (value.mode === "instructor") {
      onChange({ ...value, instructorId: id });
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">View:</span>
      {(["all", "student", "instructor"] as FilterMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => handleModeChange(mode)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value.mode === mode
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
          }`}
        >
          {mode === "all" ? "All" : mode === "student" ? "Student" : "Instructor"}
        </button>
      ))}
      {value.mode === "student" && (
        <select
          value={value.studentId ?? ""}
          onChange={(e) => handlePersonChange(e.target.value)}
          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          <option value="">Select student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.lastName}, {s.firstMidName}
            </option>
          ))}
        </select>
      )}
      {value.mode === "instructor" && (
        <select
          value={value.instructorId ?? ""}
          onChange={(e) => handlePersonChange(e.target.value)}
          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          <option value="">Select instructor...</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.lastName}, {i.firstMidName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
