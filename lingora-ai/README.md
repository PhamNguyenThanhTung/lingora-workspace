# lingora-ai

Supporting AI capability service for Lingora (ADR-014).

- **Role:** Supporting AI service (stateless, decoupled from core web and database).
- **Directory:**
  - `api/`: FastAPI runtime providing health checks, model info, target GEC contract (`/v1/gec/correct`), and legacy compatibility endpoints (`/v1/srs/schedule`, `/v1/chat/roleplay`).

