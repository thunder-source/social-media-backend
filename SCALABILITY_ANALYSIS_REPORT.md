# Full Stack Scalability Analysis Report

## 📊 Executive Summary

This report combines the existing database analysis with a new application-layer analysis. 

**Overall Scalability Rating: 5/10**

While the database schema is decent for an MVP (6.5/10), the **application layer has critical bottlenecks** (3.5/10) that prevent it from scaling beyond a single server instance. You are currently limited to a **vertical scaling** strategy (getting a bigger server) rather than **horizontal scaling** (adding more servers).

---

## 🚨 Critical Application Layer Bottlenecks (New Findings)

These issues prevent you from running multiple instances of your backend (e.g., on Kubernetes or multiple Render instances).

### 1. In-Memory Session Management 🔴 **CRITICAL**
**Location:** `src/server.ts`
```typescript
app.use(session({ secret: SESSION_SECRET, ... })); // Default MemoryStore
```
*   **Problem:** Sessions are stored in the RAM of the specific server process.
*   **Impact:** If you add a second server, a user logged in on Server A will be "logged out" if their next request hits Server B.
*   **Solution:** Use **Redis** to store sessions.
    *   Install `connect-redis` and `redis`.
    *   Configure `express-session` to use the Redis store.

### 2. In-Memory WebSocket State 🔴 **CRITICAL**
**Location:** `src/services/socket.service.ts`
```typescript
private userConnections: Map<string, string> = new Map(); // userId -> socketId
```
*   **Problem:** The list of online users and their socket IDs is stored in a local JavaScript Map.
*   **Impact:** 
    *   **Split Brain:** Server A doesn't know about users connected to Server B.
    *   **Message Failure:** If User A (on Server A) sends a message to User B (on Server B), Server A will look in its local map, find nothing, and fail to deliver the message.
*   **Solution:** 
    *   Use **Socket.IO Redis Adapter** to broadcast events between servers.
    *   Store online status/presence in Redis instead of a local Map.

### 3. Synchronous Video Processing 🔴 **HIGH SEVERITY**
**Location:** `src/services/video.service.ts`
```typescript
await new Promise<void>((resolve, reject) => { ffmpeg(inputPath)... })
```
*   **Problem:** Video compression runs on the main application server.
*   **Impact:** 
    *   **CPU Starvation:** FFmpeg is extremely CPU intensive. One user uploading a video can spike CPU usage to 100%, causing the API to time out for *everyone else*.
    *   **Node.js Event Loop Blocking:** While the promise awaits, the underlying OS threads are busy.
*   **Solution:** Offload processing to a **Job Queue** (e.g., BullMQ with Redis).
    *   API accepts upload -> Adds job to queue -> Returns "Processing" status immediately.
    *   Separate "Worker" process picks up job -> Compresses video -> Updates DB -> Notifies user via Socket.

---

## 🗄️ Database Scalability (Summary from existing analysis)

**Detailed analysis found in:** `DATABASE_SCALABILITY_ANALYSIS.md`

### Top 3 Database Issues:
1.  **Friends Array:** Storing friends in `User` document limits you to ~100K friends and causes write amplification. -> *Move to `Friends` collection.*
2.  **Likes/Comments Arrays:** Embedding these in `Post` document limits viral posts and causes document locking. -> *Move to `Likes` and `Comments` collections.*
3.  **No Sharding:** Single DB instance limits total storage and write throughput. -> *Plan for sharding or read replicas.*

---

## 📈 Scalability Roadmap

### Phase 1: Enable Horizontal Scaling (Immediate)
*   [x] **Redis:** Set up a Redis instance (e.g., Upstash or local).
*   [x] **Sessions:** Switch `express-session` to use Redis Store.
*   [x] **Sockets:** Implement `@socket.io/redis-adapter`.
*   [x] **State:** Move `userConnections` Map to Redis.

### Phase 2: Performance Stability (Next 10K Users)
*   [x] **Queues:** Implement BullMQ for video processing.
*   [ ] **Database:** Extract `Friends` and `Likes` to separate collections.
*   [ ] **CDN:** Serve static assets (images/videos) via CloudFront/S3, not the backend.

### Phase 3: High Scale (100K+ Users)
*   [ ] **Database:** Implement Read Replicas.
*   [ ] **Microservices:** Split "Chat" and "Feed" into separate services.
*   [ ] **Search:** Move search queries to Elasticsearch/Meilisearch.

---

## 💰 Revised Cost Estimates (with App Layer)

| Scale | Architecture | Est. Cost |
|-------|--------------|-----------|
| **Current** | Single Server (API + Jobs), Single DB | ~$15/mo |
| **Optimized (10K Users)** | 2x API Servers, 1x Worker Server, Redis, MongoDB Replica | ~$150/mo |
| **High Scale (100K Users)** | Kubernetes Cluster, Managed DB, CDN, Redis Cluster | ~$800+/mo |
