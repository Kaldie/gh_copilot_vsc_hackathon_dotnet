import type { ApiError, ScheduledInstanceDto, CreateScheduledInstanceDto, UpdateScheduledInstanceDto, ConflictDto } from "@/types";

class ApiClient {
  private baseUrl = "/api";

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw await this.parseError(response);
    }
  }

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  async putForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.parseError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      return (await response.json()) as ApiError;
    } catch {
      return {
        title: response.statusText || "An error occurred",
        status: response.status,
      };
    }
  }
}

export const api = new ApiClient();

// Schedule API — C# DayOfWeek enum serializes as string names;
// the frontend works with numeric JS day indices (0=Sun … 6=Sat).
const DAY_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};
const NUM_TO_DAY_NAME: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

function normalizeDayOfWeek(raw: string | number): number {
  if (typeof raw === "number") return raw;
  return DAY_NAME_TO_NUM[raw] ?? 0;
}

function normalizeInstance(raw: ScheduledInstanceDto): ScheduledInstanceDto {
  return { ...raw, dayOfWeek: normalizeDayOfWeek(raw.dayOfWeek as unknown as string | number) };
}

export async function getScheduledInstances(studentId?: number, instructorId?: number): Promise<ScheduledInstanceDto[]> {
  const params = new URLSearchParams();
  if (studentId != null) params.set("studentId", String(studentId));
  if (instructorId != null) params.set("instructorId", String(instructorId));
  const qs = params.toString();
  const items = await api.get<ScheduledInstanceDto[]>(`/scheduledinstances${qs ? `?${qs}` : ""}`);
  return items.map(normalizeInstance);
}

export async function getScheduledInstance(id: number): Promise<ScheduledInstanceDto> {
  const item = await api.get<ScheduledInstanceDto>(`/scheduledinstances/${id}`);
  return normalizeInstance(item);
}

export async function createScheduledInstance(dto: CreateScheduledInstanceDto): Promise<ScheduledInstanceDto> {
  const payload = { ...dto, dayOfWeek: NUM_TO_DAY_NAME[dto.dayOfWeek] ?? "Monday" };
  const item = await api.post<ScheduledInstanceDto>("/scheduledinstances", payload);
  return normalizeInstance(item);
}

export async function updateScheduledInstance(id: number, dto: UpdateScheduledInstanceDto): Promise<ScheduledInstanceDto> {
  const payload = { ...dto, dayOfWeek: NUM_TO_DAY_NAME[dto.dayOfWeek] ?? "Monday" };
  const item = await api.put<ScheduledInstanceDto>(`/scheduledinstances/${id}`, payload);
  return normalizeInstance(item);
}

export function deleteScheduledInstance(id: number): Promise<void> {
  return api.delete(`/scheduledinstances/${id}`);
}

export async function getConflicts(instructorId: number): Promise<ConflictDto[]> {
  const items = await api.get<ConflictDto[]>(`/scheduledinstances/conflicts?instructorId=${instructorId}`);
  return items.map((c) => ({
    instanceA: normalizeInstance(c.instanceA),
    instanceB: normalizeInstance(c.instanceB),
  }));
}
