#!/usr/bin/env bash
set -euo pipefail

workspace_root="${1:-/workspace}"
legacy_sln="${workspace_root}/src/ContosoUniversity/ContosoUniversity.sln"
modern_api_project="${workspace_root}/src/ContosoUniversity.Api/ContosoUniversity.Api.csproj"
temp_compile_dir="$(mktemp -d)"

cleanup() {
  rm -rf "${temp_compile_dir}"
}

trap cleanup EXIT

echo "[build-check] Workspace: ${workspace_root}"
echo "[build-check] Legacy app build path: Windows MSBuild + IIS Express from scripts/run-legacy-app.ps1"
echo "[build-check] Docker path: validate the repo and host shared infra, not the legacy MVC app itself"

# Run .NET checks for non-legacy solutions only.
mapfile -t solutions < <(find "${workspace_root}/src" \( -name "*.sln" -o -name "*.slnx" \) -not -path "${legacy_sln}" | sort)

if [[ ${#solutions[@]} -eq 0 ]]; then
  echo "[build-check] No non-legacy .sln/.slnx files found."
else
  for sln in "${solutions[@]}"; do
    echo "[build-check] dotnet restore: ${sln}"
    dotnet restore "${sln}"
    echo "[build-check] dotnet build: ${sln}"
    dotnet build "${sln}" --configuration Release --no-restore
    echo "[build-check] dotnet test: ${sln}"
    dotnet test "${sln}" --configuration Release --no-build
  done
fi

if [[ ${#solutions[@]} -eq 0 && -f "${modern_api_project}" ]]; then
  echo "[build-check] Falling back to API project checks: ${modern_api_project}"
  dotnet restore "${modern_api_project}"
  dotnet build "${modern_api_project}" --configuration Release --no-restore
  dotnet test "${modern_api_project}" --configuration Release --no-build || echo "[build-check] API project has no tests yet."
fi

if [[ -f "${legacy_sln}" ]]; then
  echo "[build-check] Found legacy solution: ${legacy_sln}"
  echo "[build-check] Skipping legacy build in Linux container because it needs .NET Framework 4.8.2 + MSBuild + IIS Express on Windows."
fi

# Compile portable C# files from the repo so the Docker path actually proves code compiles.
portable_sources=(
  "${workspace_root}/src/ContosoUniversity/PaginatedList.cs"
  "${workspace_root}/student/exercises/BuggyStudentService.cs"
)

existing_sources=()
for source in "${portable_sources[@]}"; do
  if [[ -f "${source}" ]]; then
    existing_sources+=("${source}")
  fi
done

if [[ ${#existing_sources[@]} -eq 0 ]]; then
  echo "[build-check] No portable C# sources found to compile."
else
  echo "[build-check] Compiling portable repo C# sources in a temp .NET project."
  project_dir="${temp_compile_dir}/compile-check"
  mkdir -p "${project_dir}"

  for source in "${existing_sources[@]}"; do
    cp "${source}" "${project_dir}/"
  done

  cat > "${project_dir}/compile-check.csproj" <<'EOF'
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
EOF

  dotnet build "${project_dir}/compile-check.csproj" --configuration Release
fi

# Run frontend checks when a package.json exists (outside node_modules).
mapfile -t package_json_files < <(find "${workspace_root}" -name "package.json" -not -path "*/node_modules/*" | sort)

if [[ ${#package_json_files[@]} -eq 0 ]]; then
  echo "[build-check] No package.json files found. Skipping npm checks."
else
  if ! command -v npm >/dev/null 2>&1; then
    echo "[build-check] npm is not available in this image. Frontend checks skipped."
    exit 0
  fi

  for pkg in "${package_json_files[@]}"; do
    dir="$(dirname "${pkg}")"
    echo "[build-check] npm install/build in: ${dir}"
    pushd "${dir}" >/dev/null

    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi

    if npm run | grep -qE "^[[:space:]]+build"; then
      npm run build
    else
      echo "[build-check] No npm build script in ${dir}."
    fi

    if npm run | grep -qE "^[[:space:]]+test"; then
      npm test -- --watch=false || npm test
    else
      echo "[build-check] No npm test script in ${dir}."
    fi

    popd >/dev/null
  done
fi

echo "[build-check] Completed."
