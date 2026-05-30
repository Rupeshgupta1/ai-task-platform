# AI Task Processing Platform — Architecture Document

## System Overview
A cloud-native MERN stack platform that processes AI text operations
asynchronously using a Redis queue and Python worker service.

---

## 1. Worker Scaling Strategy

The Python worker is deployed as a Kubernetes Deployment with replicas: 2.
Each worker pod independently polls the Redis list task-queue-python using
RPOP operation.

Horizontal Scaling:
- Worker replicas can be increased manually: kubectl scale deployment/worker --replicas=5
- Kubernetes HorizontalPodAutoscaler (HPA) can auto-scale based on CPU usage
- Each worker is stateless — no shared memory, all state in MongoDB

Why this works:
- Redis RPOP is atomic — two workers never pick the same job
- Workers only need Redis + MongoDB connection — fully independent
- Crash of one worker doesnt affect others

---

## 2. Handling High Task Volume (100k tasks/day)

100k tasks/day = ~1.2 tasks/second average, with peak ~10 tasks/second.

Current architecture handles this because:
- Redis queue buffers all incoming tasks instantly
- 2 worker replicas process ~2 tasks/second easily
- MongoDB with compound indexes handles read/write at this scale

At higher scale:
- Scale workers to 5-10 replicas
- Add Redis Cluster for queue persistence
- Add MongoDB replica set for read scaling
- Use separate read/write MongoDB connections in backend

Queue Flow:
User clicks Run
     then
Backend creates Task with status pending
     then
Push to Redis list instantly under 1ms
     then
Worker picks up job using RPOP
     then
Update status running then success or failed
     then
Save result and logs to MongoDB

---

## 3. Database Indexing Strategy

User Collection:
- email — unique index for login queries
- username — unique index for registration check

Task Collection:
- userId — index for fetching user tasks
- status — index for filtering by status
- userId and status — compound index for dashboard queries
- userId and createdAt descending — compound index for sorted task list

Why these indexes:
- Dashboard query hits compound index directly
- Task list sorted query hits compound index
- Without indexes full collection scan on every request
- With indexes O(log n) lookup regardless of collection size

---

## 4. Handling Redis Failure

Problem: Redis goes down and new tasks cannot be queued.

Current protection:
- BullMQ has built-in retry with exponential backoff 2s 4s 8s
- Worker catches Redis connection errors and retries automatically
- Tasks saved to MongoDB first with status pending before Redis push
- If Redis push fails task stays in MongoDB as pending

Recovery strategy:
- When Redis recovers pending tasks in MongoDB can be re-queued
- Add a cron job that checks for stuck pending tasks older than 5 minutes
- Re-push them to Redis queue automatically

For production:
- Use Redis Sentinel or Redis Cluster for high availability
- Enable Redis AOF persistence so queue survives restarts
- Set up Redis replica for failover

---

## 5. Staging vs Production Environments

Approach: Separate Namespaces in Kubernetes Cluster

Staging namespace: ai-task-platform-staging
- backend 1 replica
- frontend 1 replica
- worker 1 replica
- redis and mongodb

Production namespace: ai-task-platform-production
- backend 2 replicas
- frontend 2 replicas
- worker 3 replicas
- redis and mongodb

Argo CD Setup:
- Two Argo CD Applications one per environment
- Staging auto-syncs on every git push to main branch
- Production syncs only on git push to release branch
- Different ConfigMaps per environment with different DB URIs and secrets

CI/CD Flow:
Code push to main
     then
GitHub Actions lint and build and push image
     then
Update image tag in infra repo
     then
Argo CD detects change
     then
Auto-deploy to staging
     then
Manual approval to deploy to production
