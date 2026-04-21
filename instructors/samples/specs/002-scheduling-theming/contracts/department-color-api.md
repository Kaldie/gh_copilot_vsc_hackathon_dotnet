# API Contracts: Department Color Extension

**Feature**: 002-scheduling-theming  
**Affected Endpoints**: Existing department CRUD at `/api/departments`

## Changes to Existing Endpoints

### GET /api/departments and GET /api/departments/{id}

**Added field** in response:

```json
{
  "departmentId": 1,
  "name": "English",
  "budget": 350000,
  "startDate": "2024-09-01T00:00:00",
  "instructorId": 1,
  "administratorName": "Kim Abercrombie",
  "color": "#1e40af",
  "courses": [...]
}
```

`color` is nullable. When `null`, the frontend auto-assigns from the palette.

---

### POST /api/departments

**Added optional field** in request body:

```json
{
  "name": "Physics",
  "budget": 200000,
  "startDate": "2025-01-15",
  "instructorId": 3,
  "color": "#5b21b6"
}
```

`color` is optional. If omitted or null, no explicit color is stored.

---

### PUT /api/departments/{id}

**Added optional field** in request body:

```json
{
  "name": "English",
  "budget": 350000,
  "startDate": "2024-09-01",
  "instructorId": 1,
  "rowVersion": "...",
  "color": "#1e40af"
}
```

Setting `color` to `null` clears the explicit color (reverts to auto-assignment).

---

## Validation

- `color` must be a valid hex color string matching pattern `^#[0-9a-fA-F]{6}$` or null
- Max length: 7 characters (including `#`)
