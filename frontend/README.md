# URL Shortener Frontend

React + TypeScript frontend for the FastAPI URL shortener backend.

## Setup

```bash
cd frontend
cp .env.example .env
npm install
```

## Development

Start the backend from the project root:

```bash
cd src
uvicorn app:app --reload
```

Start the frontend:

```bash
cd frontend
npm run dev
```

The frontend dev server runs on:

```text
http://localhost:5173
```

## Configuration

`VITE_API_BASE_URL` points to the backend origin:

```text
VITE_API_BASE_URL=http://localhost:8000
```

API requests use:

```text
${VITE_API_BASE_URL}/api/v1
```

Public short links use:

```text
${VITE_API_BASE_URL}/{short_url}
```

## Build

```bash
npm run build
```
