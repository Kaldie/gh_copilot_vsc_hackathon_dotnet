# Agent Execution Notes

## Default Build/Test Assumption

Use Docker for compile/test tasks in this repository.

- Do not assume `dotnet` is installed on the host machine.
- Prefer the containerized CI check command:
  - `docker compose -f docker-compose.yml --profile ci run --rm build-check`
- Prefer running the full app stack through Compose:
  - `docker compose -f docker-compose.yml up -d sql api web`

## Legacy App Caveat

The legacy app in `src/ContosoUniversity` is Windows-native for local execution.
Containerized checks are the expected path for modern API/web development in this repo.
