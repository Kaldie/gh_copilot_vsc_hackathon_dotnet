import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import FormField from "@/components/FormField";
import { LoadingCard } from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import type { CourseDetailDto, DepartmentListDto, ApiError } from "@/types";

export default function CourseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentListDto[]>([]);
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("3");
  const [departmentId, setDepartmentId] = useState("");
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<CourseDetailDto>(`/courses/${id}`),
      api.get<DepartmentListDto[]>("/departments"),
    ]).then(([course, depts]) => {
      setTitle(course.title);
      setCredits(String(course.credits));
      setDepartmentId(String(course.departmentId));
      setCurrentImagePath(course.imagePath);
      setDepartments(depts);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("credits", credits);
      formData.append("departmentId", departmentId);
      if (image) formData.append("image", image);

      await api.putForm<CourseDetailDto>(`/courses/${id}`, formData);
      navigate(`/courses/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, Image: ["File size must not exceed 5 MB."] });
        return;
      }
      if (!["image/jpeg", "image/png", "image/gif", "image/bmp"].includes(file.type)) {
        setErrors({ ...errors, Image: ["Only image files (jpg, png, gif, bmp) are allowed."] });
        return;
      }
    }
    setImage(file);
    setErrors((prev) => { const { Image: _, ...rest } = prev; return rest; });
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Course</h1>
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <FormField label="Title" htmlFor="title" error={errors["Title"]?.[0]}>
          <input id="title" type="text" required minLength={3} maxLength={50} value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" />
        </FormField>
        <FormField label="Credits" htmlFor="credits" error={errors["Credits"]?.[0]}>
          <input id="credits" type="number" required min={0} max={5} value={credits} onChange={(e) => setCredits(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none" />
        </FormField>
        <FormField label="Department" htmlFor="departmentId" error={errors["DepartmentId"]?.[0]}>
          <select id="departmentId" required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none">
            <option value="">Select department...</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
            ))}
          </select>
        </FormField>
        {currentImagePath && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">Current Image</p>
            <img src={currentImagePath} alt="Current course image" className="max-h-40 rounded-lg border border-gray-100 dark:border-gray-700" />
          </div>
        )}
        <FormField label="New Image (optional)" htmlFor="image" error={errors["Image"]?.[0]}>
          <input id="image" type="file" accept="image/*" onChange={handleFileChange}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200" />
        </FormField>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={submitting}
            className="rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40">
            {submitting ? "Saving..." : "Save"}
          </button>
          <Link to={`/courses/${id}`} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
