# Action Plan - Implementation Checklist

This document outlines the remaining tasks and implementation priorities for the Fortnite API Stack.

## ✅ Completed

- [x] Docker Compose setup with all services
- [x] Fastify API with BullMQ integration
- [x] Next.js frontend with upload UI
- [x] C# parser service structure
- [x] BullMQ worker with job processing
- [x] Cron monitor with health checks and cleanup
- [x] Database schema and initialization
- [x] Basic file upload and job management
- [x] Health check endpoints

## 🚧 TODO - High Priority

### 1. Implement Actual Replay Parser

**File**: `services/parser-csharp/ReplayParser.cs`

**Tasks**:
- [ ] Research Fortnite replay parsing libraries for .NET
- [ ] Integrate parsing library (e.g., FortniteReplayReader, FortniteReplayParser)
- [ ] Implement player timeline extraction
- [ ] Implement events normalization
- [ ] Extract position data (x, y, z) with timestamps
- [ ] Return structured JSON matching expected format

**Resources**:
- [FortniteReplayReader](https://github.com/Topograph/fortnite-replay-reader)
- [FortniteReplayParser](https://github.com/EpicGames/UnrealEngine/tree/...)
- Check Unreal Engine replay format documentation

### 2. Implement Heuristics

**File**: `packages/worker/src/index.ts` - `runHeuristics()` function

**Tasks**:
- [ ] Fight detection: Identify when multiple players are in close proximity with weapon fire
- [ ] No-heal detection: Detect extended periods without healing items used
- [ ] Storm damage detection: Identify when player takes storm damage
- [ ] Additional heuristics as needed

**Implementation Notes**:
```typescript
function runHeuristics(parsedData: any): any {
  // Analyze timeline events
  // Detect patterns:
  // - Player positions within X meters
  // - Weapon fire events
  // - Healing item usage
  // - Storm damage events
  // - Time between events
}
```

### 3. Implement Heatmap Generation

**File**: `packages/worker/src/index.ts` - `generateHeatmap()` function

**Tasks**:
- [ ] Group position data by map regions
- [ ] Calculate density per region
- [ ] Generate heatmap data structure
- [ ] Consider time-based heatmaps (early/mid/late game)

**Data Structure**:
```typescript
{
  regions: [
    { region: "Tilted Towers", density: 0.8, x: 0, y: 0 },
    // ...
  ],
  density: [
    [x, y, density], // Grid cells
    // ...
  ]
}
```

### 4. Add Authentication

**Files**: 
- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/auth/page.tsx`
- `packages/papi/src/auth.ts`

**Tasks**:
- [ ] Install and configure BetterAuth
- [ ] Set up Discord OAuth provider
- [ ] Create authentication routes
- [ ] Add protected API endpoints
- [ ] Add user management to database
- [ ] Link jobs to users

**Database Schema**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE,
  username VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analysis_jobs ADD COLUMN user_id INTEGER REFERENCES users(id);
```

### 5. Add Rate Limiting

**File**: `packages/papi/src/index.ts`

**Tasks**:
- [ ] Install rate limiting library (e.g., `@fastify/rate-limit`)
- [ ] Configure per-user rate limits
- [ ] Different limits for free vs. pro users
- [ ] Store limits in Redis

### 6. Error Handling & Validation

**Files**: All service files

**Tasks**:
- [ ] Add input validation (file type, size, format)
- [ ] Add comprehensive error handling
- [ ] Add error logging to file/service
- [ ] User-friendly error messages
- [ ] Retry logic for failed jobs

## 🔄 TODO - Medium Priority

### 7. Real-time Updates

**Files**: 
- `packages/papi/src/index.ts` (add WebSocket/SSE)
- `apps/web/src/lib/api.ts` (add real-time client)

**Tasks**:
- [ ] Implement WebSocket or Server-Sent Events
- [ ] Push job status updates to frontend
- [ ] Remove polling, use real-time updates

### 8. File Storage Optimization

**Tasks**:
- [ ] Move to object storage (S3/Azure Blob) for production
- [ ] Implement file compression
- [ ] Clean up temporary files automatically
- [ ] Stream large files instead of loading into memory

### 9. Enhanced Monitoring

**Tasks**:
- [ ] Add Prometheus metrics
- [ ] Set up Grafana dashboards
- [ ] Add Sentry for error tracking
- [ ] Add structured logging (JSON)
- [ ] Add performance metrics

### 10. API Documentation

**Tasks**:
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add API endpoint documentation
- [ ] Add request/response examples
- [ ] Add authentication documentation

### 11. Testing

**Tasks**:
- [ ] Unit tests for heuristics
- [ ] Unit tests for parser
- [ ] Integration tests for API
- [ ] End-to-end tests
- [ ] Load testing

### 12. Frontend Enhancements

**Files**: `apps/web/src/app/page.tsx`

**Tasks**:
- [ ] Add job history view
- [ ] Add result visualization (heatmap, timeline)
- [ ] Add export functionality (JSON, CSV)
- [ ] Add user dashboard
- [ ] Improve error handling UI
- [ ] Add loading states and progress indicators

## 🎯 TODO - Low Priority (Future Enhancements)

### 13. Video Processing

**Tasks**:
- [ ] Generate highlight reels from replays
- [ ] Add video export functionality
- [ ] Integrate with FFmpeg

### 14. AI/ML Analysis

**Tasks**:
- [ ] Train ML models for gameplay insights
- [ ] Add predictive analytics
- [ ] Add recommendation engine

### 15. Batch Processing

**Tasks**:
- [ ] Support bulk replay uploads
- [ ] Batch analysis jobs
- [ ] Progress tracking for batches

### 16. Multi-tenant Support

**Tasks**:
- [ ] Organization/team management
- [ ] Shared dashboards
- [ ] Team analytics

### 17. Mobile App

**Tasks**:
- [ ] React Native app
- [ ] Mobile-optimized UI
- [ ] Push notifications

## 📋 Development Workflow

### For Each Feature:

1. **Plan**: Review this action plan and create detailed task breakdown
2. **Implement**: Write code following existing patterns
3. **Test**: Add tests (unit/integration as appropriate)
4. **Document**: Update README/API docs
5. **Review**: Code review (if working in team)
6. **Deploy**: Test in staging before production

### Priority Order:

1. Implement actual replay parser (blocking for real functionality)
2. Implement heuristics (core feature)
3. Add authentication (security)
4. Add rate limiting (performance/stability)
5. Enhance frontend (UX)
6. Add monitoring (observability)
7. Everything else (nice-to-have)

## 🚀 Getting Started with Development

### To work on parser:

```bash
cd services/parser-csharp
# Install .NET replay parsing library
dotnet add package [library-name]
# Implement parsing logic in ReplayParser.cs
```

### To work on heuristics:

```bash
cd packages/worker
npm install
npm run dev
# Implement heuristics in src/index.ts
```

### To work on frontend:

```bash
cd apps/web
npm install
npm run dev
# Make changes in src/app/
```

## 📝 Notes

- Keep code modular and testable
- Follow existing code style
- Update documentation as you go
- Consider performance implications
- Think about scalability
- Security first for user data

## 🎉 Success Criteria

The stack is production-ready when:

- [ ] Replay parser works with real Fortnite replay files
- [ ] Heuristics accurately detect fights, no-heal, storm damage
- [ ] Authentication is implemented and secure
- [ ] Rate limiting prevents abuse
- [ ] Monitoring provides visibility into system health
- [ ] Tests provide confidence in code quality
- [ ] Documentation is complete and accurate
- [ ] Performance meets requirements (jobs complete in < 5 minutes)
- [ ] Error handling is comprehensive
- [ ] Frontend provides good UX
