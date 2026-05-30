# AI Task Processing Platform

A full-stack AI task processing platform built with MERN stack, Python worker, Docker, Kubernetes, and Argo CD.

## Tech Stack
- Frontend: Next.js 14
- Backend: Node.js + Express
- Worker: Python
- Database: MongoDB
- Queue: Redis + BullMQ
- Container: Docker
- Orchestration: Kubernetes (k3s)
- GitOps: Argo CD
- CI/CD: GitHub Actions

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB
- Redis
- Docker

### Setup

1. Clone the repo:
git clone https://github.com/Rupeshgupta1/ai-task-platform.git
cd ai-task-platform

2. Backend setup:
cd Backend
cp .env.example .env
npm install
npm run dev

3. Worker setup (new terminal):
cd Backend
npm run worker:dev

4. Frontend setup (new terminal):
cd frontend
cp .env.local.example .env.local
npm run dev

5. Open http://localhost:3000

## Docker

Build and run all services:
docker-compose up --build

## Kubernetes Deployment

Apply all manifests:
kubectl apply --validate=false -f infra/k8s/

Check status:
kubectl get pods -n ai-task-platform

## CI/CD
GitHub Actions automatically:
- Runs lint checks
- Builds Docker images
- Pushes to Docker Hub
- Updates image tags in infra repo

## Argo CD
Argo CD monitors infra repo and auto-deploys on changes.

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- POST /api/tasks/:id/run
- DELETE /api/tasks/:id

## Supported Operations
- uppercase
- lowercase
- reverse
- word_count
# trigger ci
# ci trigger Fri May  8 11:57:59 UTC 2026
# retry Fri May  8 12:10:39 UTC 2026
# retry Fri May  8 12:18:25 UTC 2026
