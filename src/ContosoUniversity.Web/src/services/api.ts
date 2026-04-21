import type { ApiError } from "@/types";

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
