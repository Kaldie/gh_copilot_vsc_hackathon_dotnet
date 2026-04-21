import { useEffect, useState, useRef } from "react";
import { api } from "@/services/api";
import { getResolvedColors } from "@/utils/departmentColors";
import type { CourseListDto, DepartmentListDto } from "@/types";
import { Draggable } from "@fullcalendar/interaction";

interface CourseSidebarProps {
  isDark?: boolean;
}

interface CourseWithDept extends CourseListDto {
  departmentId: number;
  departmentColor: string | null;
}

export default function CourseSidebar({ isDark = false }: CourseSidebarProps) {
  const [departments, setDepartments] = useState<DepartmentListDto[]>([]);
  const [coursesByDept, setCoursesByDept] = useState<Map<number, CourseWithDept[]>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<DepartmentListDto[]>("/departments"),
      api.get<CourseListDto[]>("/courses"),
    ]).then(([depts, courses]) => {
      setDepartments(depts);
      const map = new Map<number, CourseWithDept[]>();
      for (const dept of depts) {
        const deptCourses = courses
          .filter((c) => c.departmentName === dept.name)
          .map((c) => ({ ...c, departmentId: dept.departmentId, departmentColor: dept.color }));
        if (deptCourses.length > 0) {
          map.set(dept.departmentId, deptCourses);
        }
      }
      setCoursesByDept(map);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const draggable = new Draggable(containerRef.current, {
      itemSelector: "[data-event]",
      eventData(eventEl) {
        const raw = eventEl.getAttribute("data-event");
        return raw ? JSON.parse(raw) : {};
      },
    });
    return () => draggable.destroy();
  }, [coursesByDept]);

  return (
    <div ref={containerRef} className="h-full w-[250px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Courses</h2>
      {departments.map((dept) => {
        const courses = coursesByDept.get(dept.departmentId);
        if (!courses?.length) return null;
        const colors = getResolvedColors(dept.departmentId, dept.color, isDark);
        return (
          <div key={dept.departmentId} className="mb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dept.name}</span>
            </div>
            {courses.map((course) => (
              <div
                key={course.courseId}
                data-event={JSON.stringify({
                  title: course.title,
                  duration: "01:00",
                  extendedProps: {
                    courseId: course.courseId,
                    courseTitle: course.title,
                    departmentId: dept.departmentId,
                    departmentName: dept.name,
                    departmentColor: dept.color,
                  },
                })}
                className="mb-1 cursor-grab rounded-md border border-gray-100 px-2.5 py-1.5 text-xs font-medium transition-shadow hover:shadow-sm dark:border-gray-600"
                style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.text + "20" }}
              >
                {course.title}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
