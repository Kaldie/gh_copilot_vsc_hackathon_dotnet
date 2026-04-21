import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ToastStack from "@/components/Toast";
import { connectSSE, disconnectSSE } from "@/services/sse";
import StudentList from "@/pages/students/StudentList";
import StudentCreate from "@/pages/students/StudentCreate";
import StudentDetails from "@/pages/students/StudentDetails";
import StudentEdit from "@/pages/students/StudentEdit";
import StudentDelete from "@/pages/students/StudentDelete";
import CourseList from "@/pages/courses/CourseList";
import CourseCreate from "@/pages/courses/CourseCreate";
import CourseDetails from "@/pages/courses/CourseDetails";
import CourseEdit from "@/pages/courses/CourseEdit";
import CourseDelete from "@/pages/courses/CourseDelete";
import InstructorList from "@/pages/instructors/InstructorList";
import InstructorCreate from "@/pages/instructors/InstructorCreate";
import InstructorDetails from "@/pages/instructors/InstructorDetails";
import InstructorEdit from "@/pages/instructors/InstructorEdit";
import InstructorDelete from "@/pages/instructors/InstructorDelete";
import DepartmentList from "@/pages/departments/DepartmentList";
import DepartmentCreate from "@/pages/departments/DepartmentCreate";
import DepartmentDetails from "@/pages/departments/DepartmentDetails";
import DepartmentEdit from "@/pages/departments/DepartmentEdit";
import DepartmentDelete from "@/pages/departments/DepartmentDelete";
import DepartmentConflict from "@/pages/departments/DepartmentConflict";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import NotificationList from "@/pages/notifications/NotificationList";
import { api } from "@/services/api";
import type { NotificationDto } from "@/types";

export default function App() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotification = useCallback((notification: NotificationDto) => {
    setNotifications((prev) => [...prev, notification]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const handleMarkRead = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    api.get<NotificationDto[]>("/notifications").then((all) => {
      setUnreadCount(all.filter((n) => !n.isRead).length);
    }).catch(console.error);
    connectSSE(handleNotification);
    return () => disconnectSSE();
  }, [handleNotification]);

  return (
    <BrowserRouter>
      <ToastStack notifications={notifications} />
      <Routes>
        <Route element={<Layout unreadCount={unreadCount} />}>
          <Route path="/" element={<Navigate to="/students" replace />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/create" element={<StudentCreate />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/students/:id/edit" element={<StudentEdit />} />
          <Route path="/students/:id/delete" element={<StudentDelete />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/create" element={<CourseCreate />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/courses/:id/edit" element={<CourseEdit />} />
          <Route path="/courses/:id/delete" element={<CourseDelete />} />
          <Route path="/instructors" element={<InstructorList />} />
          <Route path="/instructors/create" element={<InstructorCreate />} />
          <Route path="/instructors/:id" element={<InstructorDetails />} />
          <Route path="/instructors/:id/edit" element={<InstructorEdit />} />
          <Route path="/instructors/:id/delete" element={<InstructorDelete />} />
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/departments/create" element={<DepartmentCreate />} />
          <Route path="/departments/:id" element={<DepartmentDetails />} />
          <Route path="/departments/:id/edit" element={<DepartmentEdit />} />
          <Route path="/departments/:id/delete" element={<DepartmentDelete />} />
          <Route path="/departments/:id/conflict" element={<DepartmentConflict />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/notifications" element={<NotificationList onMarkRead={handleMarkRead} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
