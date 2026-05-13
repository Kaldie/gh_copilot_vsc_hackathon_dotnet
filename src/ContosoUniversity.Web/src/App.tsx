import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Tab =
  | 'dashboard'
  | 'students'
  | 'courses'
  | 'instructors'
  | 'departments'
  | 'enrollments'
  | 'notifications'

type Student = {
  id: number
  firstMidName: string
  lastName: string
  enrollmentDate: string
}

type StudentListResponse = {
  items: Student[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type Department = {
  departmentID: number
  name: string
  budget: number
  startDate: string
  instructorID?: number | null
  rowVersion?: string
}

type Course = {
  courseID: number
  title: string
  credits: number
  departmentID: number
  teachingMaterialImagePath?: string | null
}

type Instructor = {
  id: number
  firstMidName: string
  lastName: string
  hireDate: string
  officeAssignment?: { location: string } | null
  courseAssignments: Array<{ courseID: number }>
}

type InstructorsResponse = {
  instructors: Instructor[]
  selectedInstructorId?: number
  courses: Course[]
  selectedCourseId?: number
  enrollments: Array<{ enrollmentID: number; student?: { firstMidName: string; lastName: string } | null }>
}

type Notification = {
  id: number
  entityType: string
  entityId: string
  operation: string
  message: string
  createdAt: string
  createdBy?: string | null
  isRead: boolean
}

type EnrollmentStat = {
  enrollmentDate: string
  studentCount: number
}

type Enrollment = {
  enrollmentID: number
  studentID: number
  studentName: string
  courseID: number
  courseTitle: string
  grade?: string | null
}

type Toast = {
  id: number
  message: string
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [students, setStudents] = useState<Student[]>([])
  const [studentOptions, setStudentOptions] = useState<Student[]>([])
  const [studentPage, setStudentPage] = useState(1)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentSortOrder, setStudentSortOrder] = useState('')
  const [studentForm, setStudentForm] = useState({ id: 0, firstMidName: '', lastName: '', enrollmentDate: '' })

  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentForm, setDepartmentForm] = useState({
    departmentID: 0,
    name: '',
    budget: 100000,
    startDate: new Date().toISOString().slice(0, 10),
    instructorID: '',
    rowVersion: '',
  })

  const [courses, setCourses] = useState<Course[]>([])
  const [courseDepartmentFilter, setCourseDepartmentFilter] = useState('')
  const [courseForm, setCourseForm] = useState({
    courseID: 0,
    title: '',
    credits: 3,
    departmentID: 0,
  })
  const [courseUploadId, setCourseUploadId] = useState(0)
  const [courseUploadFile, setCourseUploadFile] = useState<File | null>(null)

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [instructorForm, setInstructorForm] = useState({
    id: 0,
    firstMidName: '',
    lastName: '',
    hireDate: new Date().toISOString().slice(0, 10),
    officeLocation: '',
    courseIds: [] as number[],
  })

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [stats, setStats] = useState<EnrollmentStat[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentForm, setEnrollmentForm] = useState({
    enrollmentID: 0,
    studentID: 0,
    courseID: 0,
    grade: '',
  })

  const tabList: Array<{ key: Tab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'students', label: 'Students' },
    { key: 'courses', label: 'Courses' },
    { key: 'instructors', label: 'Instructors' },
    { key: 'departments', label: 'Departments' },
    { key: 'enrollments', label: 'Enrollments' },
    { key: 'notifications', label: 'Notifications' },
  ]

  const instructorNames = useMemo(() => {
    const map = new Map<number, string>()
    instructors.forEach((i) => map.set(i.id, `${i.firstMidName} ${i.lastName}`))
    return map
  }, [instructors])

  useEffect(() => {
    void refreshLookups()
    void refreshStudents(1)
    void refreshStudentOptions()
    void refreshCourses()
    void refreshInstructors()
    void refreshEnrollments()
    void refreshNotifications()
    void refreshStats()

    const stream = new EventSource('/api/notifications/stream')
    stream.addEventListener('notification', (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as Notification
      setNotifications((current) => [payload, ...current].slice(0, 20))
      const toast: Toast = { id: Date.now() + Math.floor(Math.random() * 1000), message: payload.message }
      setToasts((current) => [toast, ...current].slice(0, 4))
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id))
      }, 4000)
    })

    return () => {
      stream.close()
    }
  }, [])

  async function withBusy(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  async function refreshLookups() {
    await withBusy(async () => {
      const [departmentData, instructorData] = await Promise.all([
        api<Department[]>('/api/departments'),
        api<InstructorsResponse>('/api/instructors'),
      ])
      setDepartments(departmentData)
      setInstructors(instructorData.instructors)
      if (departmentData.length > 0 && courseForm.departmentID === 0) {
        setCourseForm((current) => ({ ...current, departmentID: departmentData[0].departmentID }))
      }
    })
  }

  async function refreshStudents(page = studentPage) {
    await withBusy(async () => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        sortOrder: studentSortOrder,
        searchString: studentSearch,
      })
      const data = await api<StudentListResponse>(`/api/students?${query.toString()}`)
      setStudents(data.items)
      setStudentPage(data.page)
      setStudentTotalPages(data.totalPages)
    })
  }

  async function refreshStudentOptions() {
    await withBusy(async () => {
      const query = new URLSearchParams({
        page: '1',
        pageSize: '100',
        sortOrder: '',
        searchString: '',
      })
      const data = await api<StudentListResponse>(`/api/students?${query.toString()}`)
      setStudentOptions(data.items)
    })
  }

  async function saveStudent() {
    const body = {
      firstMidName: studentForm.firstMidName,
      lastName: studentForm.lastName,
      enrollmentDate: studentForm.enrollmentDate,
    }

    await withBusy(async () => {
      if (studentForm.id > 0) {
        await api(`/api/students/${studentForm.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await api('/api/students', { method: 'POST', body: JSON.stringify(body) })
      }
      setStudentForm({ id: 0, firstMidName: '', lastName: '', enrollmentDate: '' })
      await refreshStudents(1)
      await refreshStudentOptions()
      await refreshNotifications()
    })
  }

  async function deleteStudent(id: number) {
    await withBusy(async () => {
      await api(`/api/students/${id}`, { method: 'DELETE' })
      await refreshStudents(1)
      await refreshStudentOptions()
      await refreshNotifications()
    })
  }

  async function refreshDepartments() {
    await withBusy(async () => {
      const data = await api<Department[]>('/api/departments')
      setDepartments(data)
    })
  }

  async function saveDepartment() {
    await withBusy(async () => {
      const payload = {
        name: departmentForm.name,
        budget: Number(departmentForm.budget),
        startDate: departmentForm.startDate,
        instructorID: departmentForm.instructorID ? Number(departmentForm.instructorID) : null,
        rowVersion: departmentForm.rowVersion || undefined,
      }

      if (departmentForm.departmentID > 0) {
        await api(`/api/departments/${departmentForm.departmentID}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/api/departments', { method: 'POST', body: JSON.stringify(payload) })
      }

      setDepartmentForm({
        departmentID: 0,
        name: '',
        budget: 100000,
        startDate: new Date().toISOString().slice(0, 10),
        instructorID: '',
        rowVersion: '',
      })
      await refreshDepartments()
      await refreshNotifications()
    })
  }

  async function deleteDepartment(id: number) {
    await withBusy(async () => {
      await api(`/api/departments/${id}`, { method: 'DELETE' })
      await refreshDepartments()
      await refreshNotifications()
    })
  }

  async function refreshCourses() {
    await withBusy(async () => {
      const query = courseDepartmentFilter ? `?departmentId=${courseDepartmentFilter}` : ''
      const data = await api<Course[]>(`/api/courses${query}`)
      setCourses(data)
    })
  }

  async function saveCourse() {
    await withBusy(async () => {
      const payload = {
        courseID: Number(courseForm.courseID),
        title: courseForm.title,
        credits: Number(courseForm.credits),
        departmentID: Number(courseForm.departmentID),
      }

      if (courseForm.courseID > 0 && courses.some((c) => c.courseID === courseForm.courseID)) {
        await api(`/api/courses/${courseForm.courseID}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api('/api/courses', { method: 'POST', body: JSON.stringify(payload) })
      }

      setCourseForm({ courseID: 0, title: '', credits: 3, departmentID: departments[0]?.departmentID ?? 0 })
      await refreshCourses()
      await refreshNotifications()
    })
  }

  async function deleteCourse(id: number) {
    await withBusy(async () => {
      await api(`/api/courses/${id}`, { method: 'DELETE' })
      await refreshCourses()
      await refreshNotifications()
    })
  }

  async function uploadTeachingMaterial() {
    if (!courseUploadFile || !courseUploadId) {
      setError('Pick a course and image file before uploading.')
      return
    }

    await withBusy(async () => {
      const formData = new FormData()
      formData.append('file', courseUploadFile)

      const response = await fetch(`/api/courses/${courseUploadId}/teaching-material`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setCourseUploadFile(null)
      await refreshCourses()
      await refreshNotifications()
    })
  }

  async function refreshInstructors() {
    await withBusy(async () => {
      const data = await api<InstructorsResponse>('/api/instructors')
      setInstructors(data.instructors)
    })
  }

  async function saveInstructor() {
    await withBusy(async () => {
      if (!instructorForm.firstMidName.trim() || !instructorForm.lastName.trim()) {
        throw new Error('First name and last name are required.')
      }

      const payload = {
        firstMidName: instructorForm.firstMidName,
        lastName: instructorForm.lastName,
        hireDate: instructorForm.hireDate,
        officeLocation: instructorForm.officeLocation,
        courseIds: instructorForm.courseIds,
      }

      if (instructorForm.id > 0) {
        await api(`/api/instructors/${instructorForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await api('/api/instructors', { method: 'POST', body: JSON.stringify(payload) })
      }

      setInstructorForm({
        id: 0,
        firstMidName: '',
        lastName: '',
        hireDate: new Date().toISOString().slice(0, 10),
        officeLocation: '',
        courseIds: [],
      })
      await refreshInstructors()
      await refreshLookups()
      await refreshNotifications()
    })
  }

  async function deleteInstructor(id: number) {
    await withBusy(async () => {
      await api(`/api/instructors/${id}`, { method: 'DELETE' })
      await refreshInstructors()
      await refreshLookups()
      await refreshNotifications()
    })
  }

  async function refreshNotifications() {
    await withBusy(async () => {
      const data = await api<{ notifications: Notification[] }>('/api/notifications?limit=20')
      setNotifications(data.notifications)
    })
  }

  async function refreshEnrollments() {
    await withBusy(async () => {
      const data = await api<Enrollment[]>('/api/enrollments')
      setEnrollments(data)
    })
  }

  async function saveEnrollment() {
    await withBusy(async () => {
      const payload = {
        studentID: Number(enrollmentForm.studentID),
        courseID: Number(enrollmentForm.courseID),
        grade: enrollmentForm.grade || null,
      }

      if (payload.studentID <= 0 || payload.courseID <= 0) {
        throw new Error('Select both a student and a course.')
      }

      if (enrollmentForm.enrollmentID > 0) {
        await api(`/api/enrollments/${enrollmentForm.enrollmentID}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/api/enrollments', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setEnrollmentForm({ enrollmentID: 0, studentID: 0, courseID: 0, grade: '' })
      await refreshEnrollments()
      await refreshNotifications()
    })
  }

  async function deleteEnrollment(id: number) {
    await withBusy(async () => {
      await api(`/api/enrollments/${id}`, { method: 'DELETE' })
      await refreshEnrollments()
      await refreshNotifications()
    })
  }

  async function markNotificationRead(id: number) {
    await withBusy(async () => {
      await api(`/api/notifications/mark-read/${id}`, { method: 'POST' })
      await refreshNotifications()
    })
  }

  async function refreshStats() {
    await withBusy(async () => {
      const data = await api<EnrollmentStat[]>('/api/home/enrollment-stats')
      setStats(data)
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            ContosoUniversity Web
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">API Workbench</h1>
          <p className="mt-2 text-sm text-slate-300">
            Frontend covering most API endpoints: CRUD + filters + file upload + SSE notifications.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabList.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md border px-3 py-2 text-sm ${
                activeTab === tab.key
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && <div className="rounded-md border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}

        {activeTab === 'dashboard' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Students" value={students.length} subtitle="Current page count" />
            <Card title="Courses" value={courses.length} subtitle="Visible courses" />
            <Card title="Instructors" value={instructors.length} subtitle="Tracked instructors" />
            <Card title="Notifications" value={notifications.length} subtitle="Unread loaded" />
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2 lg:col-span-4">
              <h2 className="mb-3 text-lg font-semibold">Enrollment Stats</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((row) => (
                      <tr key={row.enrollmentDate} className="border-t border-slate-800">
                        <td className="px-2 py-1">{row.enrollmentDate.slice(0, 10)}</td>
                        <td className="px-2 py-1">{row.studentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <select
                  value={studentSortOrder}
                  onChange={(e) => setStudentSortOrder(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="">Last Name (A-Z)</option>
                  <option value="name_desc">Last Name (Z-A)</option>
                  <option value="Date">Enrollment Date (oldest)</option>
                  <option value="date_desc">Enrollment Date (newest)</option>
                </select>
                <button type="button" onClick={() => void refreshStudents(1)} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                  Apply
                </button>
              </div>
              <Table
                headers={['ID', 'Name', 'Enrollment', 'Actions']}
                rows={students.map((s) => [
                  String(s.id),
                  `${s.firstMidName} ${s.lastName}`,
                  s.enrollmentDate.slice(0, 10),
                  <div key={s.id} className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-200"
                      onClick={() =>
                        setStudentForm({
                          id: s.id,
                          firstMidName: s.firstMidName,
                          lastName: s.lastName,
                          enrollmentDate: s.enrollmentDate.slice(0, 10),
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-200"
                      onClick={() => void deleteStudent(s.id)}
                    >
                      Delete
                    </button>
                  </div>,
                ])}
              />
              <div className="mt-3 flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => void refreshStudents(Math.max(1, studentPage - 1))}
                  className="rounded border border-slate-700 px-2 py-1"
                >
                  Prev
                </button>
                <span>
                  Page {studentPage} / {studentTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => void refreshStudents(Math.min(studentTotalPages, studentPage + 1))}
                  className="rounded border border-slate-700 px-2 py-1"
                >
                  Next
                </button>
              </div>
            </div>

            <FormPanel title={studentForm.id ? 'Edit Student' : 'Create Student'}>
              <Input label="First Name" value={studentForm.firstMidName} onChange={(v) => setStudentForm((c) => ({ ...c, firstMidName: v }))} />
              <Input label="Last Name" value={studentForm.lastName} onChange={(v) => setStudentForm((c) => ({ ...c, lastName: v }))} />
              <Input label="Enrollment Date" type="date" value={studentForm.enrollmentDate} onChange={(v) => setStudentForm((c) => ({ ...c, enrollmentDate: v }))} />
              <button type="button" onClick={() => void saveStudent()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Save Student
              </button>
            </FormPanel>
          </section>
        )}

        {activeTab === 'courses' && (
          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <select
                  value={courseDepartmentFilter}
                  onChange={(e) => setCourseDepartmentFilter(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.departmentID} value={d.departmentID}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => void refreshCourses()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                  Apply
                </button>
              </div>
              <Table
                headers={['ID', 'Title', 'Credits', 'Department', 'Material', 'Actions']}
                rows={courses.map((c) => [
                  String(c.courseID),
                  c.title,
                  String(c.credits),
                  departments.find((d) => d.departmentID === c.departmentID)?.name ?? String(c.departmentID),
                  c.teachingMaterialImagePath ? (
                    <a className="text-cyan-300 underline" href={`/api/courses/${c.courseID}/teaching-material`} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  ) : (
                    'None'
                  ),
                  <div key={c.courseID} className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-200"
                      onClick={() =>
                        setCourseForm({
                          courseID: c.courseID,
                          title: c.title,
                          credits: c.credits,
                          departmentID: c.departmentID,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-200"
                      onClick={() => void deleteCourse(c.courseID)}
                    >
                      Delete
                    </button>
                  </div>,
                ])}
              />
            </div>

            <FormPanel title={courseForm.courseID > 0 ? 'Create/Update Course' : 'Create Course'}>
              <Input label="Course ID" type="number" value={String(courseForm.courseID || '')} onChange={(v) => setCourseForm((c) => ({ ...c, courseID: Number(v) }))} />
              <Input label="Title" value={courseForm.title} onChange={(v) => setCourseForm((c) => ({ ...c, title: v }))} />
              <Input label="Credits" type="number" value={String(courseForm.credits)} onChange={(v) => setCourseForm((c) => ({ ...c, credits: Number(v) }))} />
              <label className="text-sm text-slate-300">Department</label>
              <select
                value={courseForm.departmentID}
                onChange={(e) => setCourseForm((c) => ({ ...c, departmentID: Number(e.target.value) }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                {departments.map((d) => (
                  <option key={d.departmentID} value={d.departmentID}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => void saveCourse()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Save Course
              </button>

              <div className="mt-4 border-t border-slate-700 pt-4">
                <p className="mb-2 text-sm font-medium text-slate-200">Upload Teaching Material</p>
                <select
                  value={courseUploadId}
                  onChange={(e) => setCourseUploadId(Number(e.target.value))}
                  className="mb-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value={0}>Select Course</option>
                  {courses.map((c) => (
                    <option key={c.courseID} value={c.courseID}>
                      {c.courseID} - {c.title}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCourseUploadFile(e.target.files?.[0] ?? null)}
                  className="mb-2 w-full text-sm text-slate-300"
                />
                <button type="button" onClick={() => void uploadTeachingMaterial()} className="rounded bg-indigo-500 px-3 py-2 text-sm font-medium text-white">
                  Upload File
                </button>
              </div>
            </FormPanel>
          </section>
        )}

        {activeTab === 'instructors' && (
          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <Table
                headers={['ID', 'Name', 'Hire Date', 'Office', 'Courses', 'Actions']}
                rows={instructors.map((i) => [
                  String(i.id),
                  `${i.firstMidName} ${i.lastName}`,
                  i.hireDate.slice(0, 10),
                  i.officeAssignment?.location ?? 'None',
                  String(i.courseAssignments.length),
                  <div key={i.id} className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-200"
                      onClick={() =>
                        setInstructorForm({
                          id: i.id,
                          firstMidName: i.firstMidName,
                          lastName: i.lastName,
                          hireDate: i.hireDate.slice(0, 10),
                          officeLocation: i.officeAssignment?.location ?? '',
                          courseIds: i.courseAssignments.map((ca) => ca.courseID),
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-200"
                      onClick={() => void deleteInstructor(i.id)}
                    >
                      Delete
                    </button>
                  </div>,
                ])}
              />
            </div>

            <FormPanel title={instructorForm.id ? 'Edit Instructor' : 'Create Instructor'}>
              <Input label="First Name" value={instructorForm.firstMidName} onChange={(v) => setInstructorForm((c) => ({ ...c, firstMidName: v }))} />
              <Input label="Last Name" value={instructorForm.lastName} onChange={(v) => setInstructorForm((c) => ({ ...c, lastName: v }))} />
              <Input label="Hire Date" type="date" value={instructorForm.hireDate} onChange={(v) => setInstructorForm((c) => ({ ...c, hireDate: v }))} />
              <Input label="Office Location" value={instructorForm.officeLocation} onChange={(v) => setInstructorForm((c) => ({ ...c, officeLocation: v }))} />
              <div className="rounded border border-slate-700 p-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Courses</p>
                <div className="max-h-36 space-y-1 overflow-auto text-sm">
                  {courses.map((c) => (
                    <label key={c.courseID} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={instructorForm.courseIds.includes(c.courseID)}
                        onChange={(e) =>
                          setInstructorForm((current) => ({
                            ...current,
                            courseIds: e.target.checked
                              ? [...current.courseIds, c.courseID]
                              : current.courseIds.filter((id) => id !== c.courseID),
                          }))
                        }
                      />
                      <span>
                        {c.courseID} - {c.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => void saveInstructor()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Save Instructor
              </button>
            </FormPanel>
          </section>
        )}

        {activeTab === 'departments' && (
          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <Table
                headers={['ID', 'Name', 'Budget', 'Start Date', 'Admin', 'Actions']}
                rows={departments.map((d) => [
                  String(d.departmentID),
                  d.name,
                  d.budget.toLocaleString(),
                  d.startDate.slice(0, 10),
                  d.instructorID ? instructorNames.get(d.instructorID) ?? String(d.instructorID) : 'None',
                  <div key={d.departmentID} className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-200"
                      onClick={() =>
                        setDepartmentForm({
                          departmentID: d.departmentID,
                          name: d.name,
                          budget: d.budget,
                          startDate: d.startDate.slice(0, 10),
                          instructorID: d.instructorID ? String(d.instructorID) : '',
                          rowVersion: d.rowVersion ?? '',
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-200"
                      onClick={() => void deleteDepartment(d.departmentID)}
                    >
                      Delete
                    </button>
                  </div>,
                ])}
              />
            </div>

            <FormPanel title={departmentForm.departmentID ? 'Edit Department' : 'Create Department'}>
              <Input label="Name" value={departmentForm.name} onChange={(v) => setDepartmentForm((c) => ({ ...c, name: v }))} />
              <Input
                label="Budget"
                type="number"
                value={String(departmentForm.budget)}
                onChange={(v) => setDepartmentForm((c) => ({ ...c, budget: Number(v) }))}
              />
              <Input label="Start Date" type="date" value={departmentForm.startDate} onChange={(v) => setDepartmentForm((c) => ({ ...c, startDate: v }))} />
              <label className="text-sm text-slate-300">Administrator</label>
              <select
                value={departmentForm.instructorID}
                onChange={(e) => setDepartmentForm((c) => ({ ...c, instructorID: e.target.value }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.firstMidName} {i.lastName}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => void saveDepartment()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Save Department
              </button>
            </FormPanel>
          </section>
        )}

        {activeTab === 'enrollments' && (
          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <Table
                headers={['ID', 'Student', 'Course', 'Grade', 'Actions']}
                rows={enrollments.map((e) => [
                  String(e.enrollmentID),
                  e.studentName,
                  `${e.courseID} - ${e.courseTitle}`,
                  e.grade ?? 'No grade',
                  <div key={e.enrollmentID} className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-amber-500/50 px-2 py-1 text-xs text-amber-200"
                      onClick={() =>
                        setEnrollmentForm({
                          enrollmentID: e.enrollmentID,
                          studentID: e.studentID,
                          courseID: e.courseID,
                          grade: e.grade ?? '',
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-200"
                      onClick={() => void deleteEnrollment(e.enrollmentID)}
                    >
                      Delete
                    </button>
                  </div>,
                ])}
              />
            </div>

            <FormPanel title={enrollmentForm.enrollmentID ? 'Edit Enrollment' : 'Create Enrollment'}>
              <label className="text-sm text-slate-300">Student</label>
              <select
                value={enrollmentForm.studentID}
                onChange={(e) => setEnrollmentForm((c) => ({ ...c, studentID: Number(e.target.value) }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value={0}>Select Student</option>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstMidName} {s.lastName}
                  </option>
                ))}
              </select>

              <label className="text-sm text-slate-300">Course</label>
              <select
                value={enrollmentForm.courseID}
                onChange={(e) => setEnrollmentForm((c) => ({ ...c, courseID: Number(e.target.value) }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value={0}>Select Course</option>
                {courses.map((c) => (
                  <option key={c.courseID} value={c.courseID}>
                    {c.courseID} - {c.title}
                  </option>
                ))}
              </select>

              <label className="text-sm text-slate-300">Grade</label>
              <select
                value={enrollmentForm.grade}
                onChange={(e) => setEnrollmentForm((c) => ({ ...c, grade: e.target.value }))}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">No grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </select>

              <button type="button" onClick={() => void saveEnrollment()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Save Enrollment
              </button>
            </FormPanel>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => void refreshNotifications()} className="rounded bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">
                Refresh
              </button>
            </div>
            <Table
              headers={['ID', 'When', 'Message', 'Action']}
              rows={notifications.map((n) => [
                String(n.id),
                new Date(n.createdAt).toLocaleString(),
                `${n.operation}: ${n.message}`,
                <button
                  key={n.id}
                  type="button"
                  className="rounded border border-emerald-500/50 px-2 py-1 text-xs text-emerald-200"
                  onClick={() => void markNotificationRead(n.id)}
                >
                  Mark Read
                </button>,
              ])}
            />
          </section>
        )}

        {busy && <div className="text-xs uppercase tracking-wider text-slate-400">Working...</div>}
      </section>

      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
            {t.message}
          </div>
        ))}
      </div>
    </main>
  )
}

function Card({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-cyan-200">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  )
}

function FormPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />
    </label>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-2 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-slate-800 align-top">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-2 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
