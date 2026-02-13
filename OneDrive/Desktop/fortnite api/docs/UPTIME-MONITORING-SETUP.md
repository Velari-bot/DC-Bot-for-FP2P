# 📊 Uptime Monitoring Setup Guide

This guide explains how to set up external uptime monitoring for PathGen to ensure the system is always available.

## Options

### 1. UptimeRobot (Recommended - Free Tier Available)

**Website**: https://uptimerobot.com/

#### Setup Steps:

1. **Create Account**
   - Go to https://uptimerobot.com/
   - Sign up for a free account (50 monitors free)

2. **Add Monitor**
   - Click "Add New Monitor"
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `PathGen API Health`
   - URL: `https://your-domain.com/api/health` or `https://your-domain.com/health`
   - Monitoring Interval: 5 minutes (free tier)
   - Alert Contacts: Add your email

3. **Add Additional Monitors**
   - Frontend: `https://your-domain.com/`
   - API: `https://your-api-domain.com/health`
   - Webhook endpoint (if applicable)

4. **Configure Alerts**
   - Email notifications (default)
   - SMS (paid tier)
   - Webhooks to Discord/Slack
   - Push notifications via mobile app

#### Expected Response:

The `/health` endpoint should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T10:00:00.000Z",
  "services": {
    "redis": "connected",
    "postgres": "connected"
  }
}
```

---

### 2. Pingdom (Alternative)

**Website**: https://www.pingdom.com/

#### Setup Steps:

1. **Create Account**
   - Go to https://www.pingdom.com/
   - Sign up (free trial available)

2. **Add Check**
   - Click "Add Check"
   - Check Type: **HTTP(S)**
   - Name: `PathGen API`
   - URL: `https://your-domain.com/api/health`
   - Check Interval: 1 minute (paid) or 5 minutes (free)
   - Alert Contacts: Configure email/SMS

3. **Advanced Settings**
   - Expected Status Code: `200`
   - Response Time Threshold: `2000ms` (2 seconds)
   - Content Match: `"status":"ok"` (optional)

---

### 3. Vercel Analytics (Built-in)

If you're using Vercel, you can enable built-in monitoring:

1. **Enable Analytics**
   - Go to your Vercel project dashboard
   - Navigate to Analytics tab
   - Enable Web Analytics (free tier available)

2. **Monitor**
   - View uptime metrics in dashboard
   - Set up alerts in Vercel settings
   - Configure webhook notifications

---

### 4. BetterStack (Modern Alternative)

**Website**: https://betterstack.com/

#### Setup Steps:

1. **Create Account**
   - Go to https://betterstack.com/
   - Sign up (free tier available)

2. **Add Monitor**
   - Create new HTTP monitor
   - URL: `https://your-domain.com/api/health`
   - Check interval: 1 minute
   - Alert channels: Email, Slack, Discord, PagerDuty

3. **Status Page** (Optional)
   - Create public status page
   - Share with users: `status.pathgen.dev`

---

## Recommended Monitoring Setup

### Minimum Setup (Free):

1. **UptimeRobot** - 3 monitors:
   - Frontend homepage
   - API health endpoint
   - Critical webhook endpoint

2. **Alert Configuration**:
   - Email alerts for downtime
   - Alert after 2 consecutive failures
   - Recovery notification when back online

### Advanced Setup (Paid):

1. **BetterStack or Pingdom**:
   - 1-minute check intervals
   - Multiple locations (US, EU, Asia)
   - Response time monitoring
   - Public status page

2. **Discord/Slack Integration**:
   - Real-time alerts in team channels
   - Detailed error information
   - Recovery notifications

---

## Health Check Endpoints

### API Health
- **URL**: `/api/health` or `/health`
- **Method**: GET
- **Expected Response**: `200 OK` with JSON body
- **Timeout**: 5 seconds

### Frontend Health
- **URL**: `/`
- **Method**: GET
- **Expected Response**: `200 OK` with HTML
- **Timeout**: 10 seconds

### Database Health
- **URL**: `/api/health/db` (if implemented)
- **Method**: GET
- **Expected Response**: `200 OK` if database is accessible

---

## Alert Configuration

### Recommended Alert Settings:

1. **Alert Threshold**: 2 consecutive failures
2. **Recovery Alert**: Yes (notify when back online)
3. **Alert Frequency**: Once per incident (avoid spam)
4. **Escalation**: After 15 minutes of downtime, notify additional contacts

### Alert Channels:

- **Email**: Primary notification method
- **SMS**: Critical outages only (paid tier)
- **Discord Webhook**: Team notifications
- **Slack**: If using Slack for team communication

---

## Monitoring Best Practices

1. **Multiple Locations**: Monitor from different geographic locations
2. **Multiple Endpoints**: Monitor both frontend and API
3. **Response Time**: Set thresholds (e.g., alert if response > 2 seconds)
4. **Content Validation**: Verify response contains expected content
5. **SSL Certificate Monitoring**: Alert before certificate expiration
6. **Regular Review**: Check monitoring logs weekly

---

## Integration with Existing Systems

### Discord Webhook Setup:

1. Create Discord webhook in your server
2. Add webhook URL to monitoring service
3. Configure message format:

```json
{
  "content": "🚨 PathGen API is DOWN",
  "embeds": [{
    "title": "Service Alert",
    "description": "API health check failed",
    "color": 15158332,
    "timestamp": "2025-12-12T10:00:00Z"
  }]
}
```

### Email Template:

Subject: `[PathGen] Service Alert: API Health Check Failed`

Body:
```
PathGen API health check failed at 2025-12-12 10:00:00 UTC

Endpoint: https://api.pathgen.dev/health
Status: DOWN
Response Time: N/A

Please investigate immediately.
```

---

## Testing Your Setup

1. **Test Alert**: Temporarily break the health endpoint to verify alerts work
2. **Test Recovery**: Fix the endpoint and verify recovery notification
3. **Test Multiple Channels**: Ensure all alert channels (email, Discord, etc.) work
4. **Review Logs**: Check monitoring service logs for any issues

---

## Maintenance

- **Weekly**: Review uptime metrics and response times
- **Monthly**: Update alert contacts if team changes
- **Quarterly**: Review and optimize monitoring configuration

---

## Cost Comparison

| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| UptimeRobot | 50 monitors, 5min interval | $7/mo for 10 monitors, 1min | Small teams, budget-conscious |
| Pingdom | Trial only | $10/mo+ | Enterprise, detailed analytics |
| BetterStack | Limited free | $8/mo+ | Modern teams, status pages |
| Vercel Analytics | Included with hosting | N/A | Vercel users |

---

## Next Steps

1. Choose a monitoring service
2. Set up monitors for critical endpoints
3. Configure alert channels
4. Test the setup
5. Document monitoring URLs and credentials securely

---

**Last Updated**: December 12, 2025

