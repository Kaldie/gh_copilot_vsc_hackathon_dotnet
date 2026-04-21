export type Grade = "A" | "B" | "C" | "D" | "F";

export interface PaginatedResult<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface StudentListDto {
  id: number;
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
}

export interface StudentDetailDto {
  id: number;
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
  enrollments: EnrollmentDto[];
}

export interface CreateStudentDto {
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
}

export interface UpdateStudentDto {
  lastName: string;
  firstMidName: string;
  enrollmentDate: string;
}

export interface EnrollmentDto {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  studentId: number;
  studentName: string | null;
  grade: Grade | null;
}

export interface CreateEnrollmentDto {
  courseId: number;
}

export interface UpdateEnrollmentGradeDto {
  grade: Grade;
}

export interface CourseListDto {
  courseId: number;
  title: string;
  credits: number;
  departmentName: string;
}

export interface CourseDetailDto {
  courseId: number;
  title: string;
  credits: number;
  departmentId: number;
  departmentName: string;
  imagePath: string | null;
}

export interface InstructorListDto {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
}

export interface InstructorDetailDto {
  id: number;
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
  courses: CourseListDto[];
}

export interface CreateInstructorDto {
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
  courseIds: number[] | null;
}

export interface UpdateInstructorDto {
  lastName: string;
  firstMidName: string;
  hireDate: string;
  officeLocation: string | null;
  courseIds: number[] | null;
}

export interface DepartmentListDto {
  departmentId: number;
  name: string;
  budget: number;
  startDate: string;
  administratorName: string | null;
  color: string | null;
}

export interface DepartmentDetailDto {
  departmentId: number;
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  administratorName: string | null;
  rowVersion: string;
  color: string | null;
  courses: CourseListDto[];
}

export interface CreateDepartmentDto {
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  color: string | null;
}

export interface UpdateDepartmentDto {
  name: string;
  budget: number;
  startDate: string;
  instructorId: number | null;
  rowVersion: string;
  color: string | null;
}

export interface NotificationDto {
  notificationId: number;
  entityType: string;
  entityId: number;
  operation: string;
  message: string;
  createdAt: string;
  createdBy: string;
  isRead: boolean;
  readAt: string | null;
}

export interface EnrollmentStatDto {
  enrollmentDate: string;
  studentCount: number;
}

export interface ApiError {
  title: string;
  status: number;
  errors?: Record<string, string[]>;
  currentValues?: Record<string, unknown>;
  submittedValues?: Record<string, unknown>;
}

export interface ScheduledInstanceDto {
  scheduledInstanceId: number;
  courseId: number;
  courseTitle: string;
  departmentId: number;
  departmentName: string;
  departmentColor: string | null;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

export interface CreateScheduledInstanceDto {
  courseId: number;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

export interface UpdateScheduledInstanceDto {
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

export interface ConflictDto {
  instanceA: ScheduledInstanceDto;
  instanceB: ScheduledInstanceDto;
}

export type ThemePreference = "light" | "dark" | "system";
