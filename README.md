# SDA (Synthetic Data Generator & Anonymizer)

Инструмент для:

- генерации синтетических CSV по шаблонам,
- анонимизации произвольных CSV,
- создания похожих synthetic datasets через SDV.

Теперь проект разделён на 2 сервиса:

- `backend` на `FastAPI` с API `generate / anonymize / similar`
- `frontend` на `Next.js + TypeScript` с отдельным UI

## Что сейчас реализовано

- `Generate`: генерация `users`, `orders`, `payments`, `products`, `support_tickets`
- `Anonymize`: upload CSV, detected types, suggested rules, ручная корректировка правил, download результата
- `Similar`: analyze -> fit -> sample через SDV, preview, summary, warnings, download результата
- semantic postprocess для `generate` и `similar`
- detector и suggester для анонимизации

## Структура

```text
src/                 FastAPI backend
frontend/            Next.js frontend
dockerfiles/         container build files
compose.yaml         запуск двух сервисов
dockerfiles/backend.Dockerfile
dockerfiles/frontend.Dockerfile
```

## Запуск через Docker Compose

Собрать и поднять оба сервиса:

```bash
docker compose up --build
```

Backend image заранее ставит CPU-only `torch` из официального индекса PyTorch, поэтому при сборке не должны подтягиваться тяжёлые `nvidia_*` / CUDA-пакеты.

После старта:

- `http://127.0.0.1:3000/` - новый frontend
- `http://127.0.0.1:3000/generate`
- `http://127.0.0.1:3000/anonymize`
- `http://127.0.0.1:3000/similar`
- `http://127.0.0.1:8000/docs` - Swagger UI backend
- `http://127.0.0.1:8000/api/v1/health` - healthcheck

Остановить:

```bash
docker compose down
```

Если прерванная сборка оставила лишний build cache, его можно почистить так:

```bash
docker builder prune -f
```

## Локальный запуск без Docker

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn --app-dir src sda.web.app:app --reload
```

По умолчанию backend будет доступен на `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 npm run dev
```

Frontend будет доступен на `http://127.0.0.1:3000`.

## Тесты и сборка

### Backend tests

```bash
./.venv/bin/python -m pytest -q
```

### Frontend production build

```bash
cd frontend
npm run build
```

## Основные backend endpoint'ы

- `GET /api/v1/health`
- `GET /api/v1/generate/templates`
- `GET /api/v1/generate/templates/{template_id}`
- `POST /api/v1/generate/run`
- `POST /api/v1/anonymize/upload`
- `POST /api/v1/anonymize/run`
- `POST /api/v1/similar/analyze`
- `POST /api/v1/similar/run`
