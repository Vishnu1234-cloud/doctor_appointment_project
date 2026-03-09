# HealthLine - Telemedicine Consultation Platform

> **Version 2.0.0** | Full-Stack Node.js + React | Production-Ready

A complete telemedicine platform featuring video consultations, real-time chat, digital prescriptions, multi-channel OTP authentication, and automated WhatsApp reminders.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/healthline-telemedicine.git
cd healthline-telemedicine

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8001/api
# MongoDB: localhost:27017
# Redis: localhost:6379
```

### Option 2: Production Docker-Compose (Optimized)
When pushing to a droplet or production VPS, utilize the natively bundled optimized multi-stage build scripts natively mapping explicit healthchecks mapping:

```bash
# 1. Provide an explicit production URL to backend API locally
export REACT_APP_BACKEND_URL="https://api.yourclinic.com"

# 2. Build and boot daemon natively detached scaling seamlessly
docker-compose -f docker-compose.prod.yml up -d --build
```
This architecture natively bounds MongoDB & Redis inside isolated Docker networks securely mapping frontend NGINX routing explicitly scaling seamlessly onto port `:80`.

### Option 3: Manual Setup

#### Prerequisites
- Node.js 20+
- MongoDB 4.4+
- Redis 6+ (optional - for reminders)
- Yarn package manager

#### Backend Setup

```bash
cd backend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Start MongoDB (if not running)
mongod --dbpath /path/to/data

# Start Redis (optional)
redis-server

# Start backend (development mode)
yarn dev

# Backend runs on http://localhost:8001
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Update REACT_APP_BACKEND_URL if needed

# Start frontend
yarn start

# Frontend runs on http://localhost:3000
```

---

## 🔐 Test Setup

Please create a new account to test the system or use the seed script to generate users with secure credentials.

### Test Flow

1. **Register new patient**: Use registration form
2. **Book appointment**: Select date/time, pay with test Razorpay
3. **Doctor dashboard**: Login as doctor, view/manage appointments
4. **Video consultation**: Join consultation room (patient + doctor)
5. **Prescription**: Doctor creates prescription, patient downloads PDF
6. **Review**: Patient submits review after completed appointment

---

## ⚙️ Environment Variables

### Backend Configuration

#### Required (Minimum to run)

```bash
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=healthline_db

# Server
NODE_ENV=development
PORT=8001

# CORS
CORS_ORIGINS=*

# JWT (auto-generated in development)
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=72h
JWT_REFRESH_EXPIRATION=7d
```

#### Optional Services

**Redis (for scheduled reminders):**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**OTP Configuration:**
```bash
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_PER_HOUR=5
OTP_MAX_PER_DAY=10
```

**SMS OTP (MSG91 - India Only):**
```bash
SMS_ENABLED=true
MSG91_API_KEY=your_msg91_api_key
MSG91_SENDER_ID=your_sender_id
MSG91_TEMPLATE_ID=your_template_id
MSG91_ROUTE=otp
```

**Email Notifications (Resend):**
```bash
EMAIL_ENABLED=true
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

**WhatsApp Reminders (Business API - ONLY for appointments, NOT OTP):**
```bash
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

**Payment Gateway (Razorpay):**
```bash
PAYMENT_TEST_MODE=true
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**AI Chatbot (OpenAI - Optional):**
```bash
CHATBOT_ENABLED=false
OPENAI_API_KEY=your_openai_api_key
```

**WebRTC TURN/STUN Servers:**
```bash
TURN_URLS=stun:stun.l.google.com:19302,turn:your-turn-server.com:3478
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_credential
```

**Logging:**
```bash
LOG_LEVEL=info
```

### Frontend Configuration

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# Razorpay
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 🏥 Features

### Patient Features
- ✅ Register/Login with email/password or OTP (SMS/Email choice)
- ✅ Book appointments with available time slots
- ✅ Video consultations with WebRTC
- ✅ Real-time chat during consultations
- ✅ View and download digital prescriptions (PDF)
- ✅ Medical history management
- ✅ Submit reviews after appointments
- ✅ Receive WhatsApp reminders (1 hour & 10 minutes before)
- ✅ Online payment (Razorpay)

### Doctor Features
- ✅ View and manage appointments
- ✅ Video/chat consultations
- ✅ Create digital prescriptions
- ✅ View patient history
- ✅ Dashboard analytics

### Admin Features
- ✅ User management
- ✅ Appointment tracking
- ✅ System statistics

---

## 📚 API Documentation

### Base URL
```
http://localhost:8001/api
```

### Authentication Endpoints

```bash
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login with email/password
POST   /api/auth/request-otp       # Request OTP (SMS or Email)
POST   /api/auth/verify-otp        # Verify OTP
POST   /api/auth/resend-otp        # Resend OTP
GET    /api/auth/me                # Get current user (requires JWT)
```

### Appointment Endpoints

```bash
POST   /api/appointments           # Create appointment
GET    /api/appointments           # List appointments
GET    /api/appointments/:id       # Get appointment details
PUT    /api/appointments/:id/status # Update status (doctor/admin)
PUT    /api/appointments/:id/reschedule # Reschedule appointment
DELETE /api/appointments/:id       # Cancel appointment
POST   /api/appointments/:id/join  # Join consultation
```

### Prescription Endpoints

```bash
POST   /api/prescriptions          # Create prescription (doctor only)
GET    /api/prescriptions          # List prescriptions
GET    /api/prescriptions/:id/pdf  # Download PDF
```

### Review Endpoints

```bash
GET    /api/testimonials           # List all reviews
POST   /api/testimonials           # Submit review (after completed appointment)
```

### Real-time Communication

**Socket.IO (Chat):**
```javascript
const socket = io('http://localhost:8001', {
  auth: { token: 'JWT_TOKEN' }
});

socket.emit('join_appointment', appointmentId);
socket.emit('send_message', { appointmentId, message });
socket.on('new_message', (data) => console.log(data));
```

**WebSocket (Video Signaling):**
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/consultation/:appointmentId');
ws.send(JSON.stringify({ type: 'auth', token: 'JWT_TOKEN' }));
ws.send(JSON.stringify({ type: 'offer', offer: sdp, target_user_id: userId }));
```

### Health Check

```bash
GET    /health                     # Server health check
```

---

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Helmet security headers
- ✅ Rate limiting (API, auth, OTP, payment endpoints)
- ✅ CORS validation (strict in production)
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ Input validation (Zod schemas)
- ✅ OTP anti-abuse rules (max attempts, cooldown, daily limits)
- ✅ User enumeration prevention
- ✅ Secrets never logged in production

---

## 🚀 Production Deployment

### Pre-deployment Checklist

#### 1. Environment Configuration

**Backend (.env):**
```bash
# Set to production
NODE_ENV=production

# Generate strong JWT secret (min 32 chars)
JWT_SECRET=<generate-strong-secret-key>

# Set strict CORS (NO "*" in production)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Use production database
MONGO_URL=mongodb://your-production-mongo-url

# Configure Redis for reminders
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### 2. External Services Setup

**A. MSG91 (SMS OTP) - India Only**
1. Sign up at https://msg91.com
2. Get API Key from dashboard
3. Create OTP template
4. Configure in .env:
```bash
SMS_ENABLED=true
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=your_sender_id
MSG91_TEMPLATE_ID=your_template_id
```

**B. Resend (Email Notifications)**
1. Sign up at https://resend.com
2. Get API Key
3. Verify domain for production emails
4. Configure in .env:
```bash
EMAIL_ENABLED=true
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**C. WhatsApp Business API (Reminders)**
1. Set up Meta Business Account
2. Create WhatsApp Business App
3. Get Phone Number ID and Access Token
4. Create message templates for:
   - Appointment booking confirmation
   - 1-hour reminder
   - 10-minute reminder
5. Configure in .env:
```bash
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

**D. TURN/STUN Servers (Video Calls)**

For production video calls, use TURN servers to handle NAT/Firewall:

**Option 1: Self-hosted (coturn)**
```bash
# Install coturn
apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com

# Start server
systemctl start coturn
```

**Option 2: Cloud providers**
- Twilio TURN (https://www.twilio.com/stun-turn)
- Xirsys (https://xirsys.com)
- Metered.ca (https://www.metered.ca/tools/openrelay/)

Configure in .env:
```bash
TURN_URLS=stun:stun.l.google.com:19302,turn:yourturn.com:3478
TURN_USERNAME=your_username
TURN_CREDENTIAL=your_password
```

**E. Razorpay (Payments)**
1. Sign up at https://razorpay.com
2. Get production API keys
3. Configure webhooks for payment verification
4. Set in .env:
```bash
PAYMENT_TEST_MODE=false
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your_secret
```

#### 3. WebSocket/Socket.IO Configuration

For production with WSS (Secure WebSocket):

**Nginx Configuration:**
```nginx
# WebSocket upgrade for video signaling
location /ws/ {
    proxy_pass http://localhost:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400;
}

# Socket.IO
location /socket.io/ {
    proxy_pass http://localhost:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**Frontend Configuration:**
Update to use WSS:
```javascript
// In production
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL.replace('https', 'wss');
const socket = io(SOCKET_URL, { transports: ['websocket'] });
```

#### 4. Database & Redis

**MongoDB Production:**
- Use MongoDB Atlas or self-hosted cluster
- Enable authentication
- Set up backups (daily recommended)
- Configure replica set for high availability

**Redis Production:**
- Use Redis Cloud or self-hosted
- Enable persistence (RDB + AOF)
- Set up password authentication
- Configure maxmemory policy

#### 5. SSL/TLS Setup

**Using Let's Encrypt:**
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

#### 6. Process Management

**Using PM2:**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name healthline-backend

# Start frontend (after build)
cd frontend
yarn build
pm2 serve build 3000 --name healthline-frontend --spa

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 7. Monitoring & Logging

**Set up monitoring for:**
- Server uptime
- API response times
- Error rates
- Database performance
- Redis queue status

**Recommended tools:**
- PM2 monitoring: `pm2 monitor`
- Log aggregation: ELK Stack or Datadog
- Error tracking: Sentry
- Uptime monitoring: UptimeRobot or Pingdom

#### 8. Backup Strategy

**Automated backups:**
```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=/backups/$(date +%Y%m%d)

# Redis backup
redis-cli --rdb /backups/dump_$(date +%Y%m%d).rdb
```

**Backup schedule:**
- Database: Daily
- Code: On every deployment (git)
- Logs: Weekly archival

### Deployment Commands

```bash
# Build frontend
cd frontend
yarn build

# Test production build locally
cd backend
NODE_ENV=production node src/server.js

# Deploy with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

### Performance Optimization

1. **Enable gzip compression** (Nginx)
2. **Use CDN** for static assets
3. **Redis caching** for frequently accessed data
4. **Database indexing** (already configured)
5. **Load balancing** for multiple instances

### Security Hardening

1. **Firewall**: Allow only ports 80, 443, 22
2. **SSH**: Disable password auth, use key-based
3. **Database**: Whitelist IPs, enable auth
4. **Rate limiting**: Already configured in app
5. **DDoS protection**: Use Cloudflare or AWS Shield

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
yarn test
```

### Frontend Testing
```bash
cd frontend
yarn test
```

### Manual Testing

**Health Check:**
```bash
curl http://localhost:8001/health
```

**Register User:**
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "password123",
    "role": "patient"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📊 Architecture

### Tech Stack

**Backend:**
- Node.js 20+
- Express
- MongoDB (Mongoose)
- Socket.IO (real-time chat)
- WebSocket (video signaling)
- BullMQ + Redis (job queue)
- JWT (authentication)
- Pino (logging)
- Helmet (security)
- Zod (validation)

**Frontend:**
- React 19
- Tailwind CSS
- Shadcn/UI
- Socket.IO Client
- Simple Peer (WebRTC)
- React Router
- Axios

**Infrastructure:**
- Docker & Docker Compose
- MongoDB
- Redis
- Nginx (reverse proxy)

### Project Structure

```
healthline-telemedicine/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middlewares/     # Express middlewares
│   │   ├── workers/         # BullMQ workers
│   │   ├── utils/           # Utilities
│   │   ├── app.js           # Express app
│   │   ├── server.js        # HTTP + Socket.IO + WebSocket
│   │   ├── socket.js        # Socket.IO handlers
│   │   └── ws.video.js      # Video signaling
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   └── lib/             # Utilities
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 👨‍⚕️ Doctor Profile

**Dr. Annu Sharma**
- **Qualification**: MD (Ayurveda) | Postgraduate Physician | IMS-BHU Graduate
- **Specialization**: General Physician, Gynecologist & Women's Health
- **Experience**: 8+ years
- **Consultation Fee**: ₹100
- **Available**: Monday to Friday (6:00pm to 8:00pm)
- **Languages**: Hindi, English
- **About**: MD (Ayurveda Samhita & Siddhant) physician with advanced knowledge of classical Ayurvedic texts and principles. Trained at IMS-BHU, dedicated to delivering authentic, evidence-based, and patient-centered Ayurvedic care with focus on root-cause treatment and holistic healing.

---

## 🐛 Troubleshooting

### Backend won't start

**Check MongoDB:**
```bash
mongod --version
# Ensure MongoDB is running on port 27017
```

**Check logs:**
```bash
# In development
yarn dev

# Check supervisor logs
tail -f /var/log/supervisor/backend.out.log
```

### Frontend build errors

**Clear cache and reinstall:**
```bash
rm -rf node_modules/.cache
rm -rf node_modules
yarn install
```

### Can't connect frontend to backend

**Verify CORS:**
- Check `CORS_ORIGINS` in backend/.env
- Ensure frontend URL is allowed

**Verify backend URL:**
- Check `REACT_APP_BACKEND_URL` in frontend/.env
- Should match backend port (8001)

### Redis connection errors

Redis is optional. App works without it, but reminders won't be scheduled.

**To enable Redis:**
```bash
# Install Redis
apt-get install redis-server

# Start Redis
redis-server

# Configure in backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Video calls not working

**Check TURN servers:**
- Configure TURN servers in backend/.env
- Test TURN connectivity: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

**Check WebSocket connection:**
- Ensure WSS is configured in production
- Verify Nginx WebSocket proxy settings

### OTP not received

**In development:**
- OTP is logged to console
- Check backend logs: `tail -f /var/log/supervisor/backend.out.log | grep OTP`

**In production:**
- Verify MSG91/Resend API keys
- Check API rate limits
- Verify phone numbers/emails are valid

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions:
- **Email**: support@healthline.com
- **Documentation**: Check `/backend/README.md` for API docs
- **Issues**: Create an issue in the GitHub repository

---

## 🆕 Version History

### v2.0.0 (March 2026)
- ✅ Complete backend migration from Python FastAPI to Node.js/Express
- ✅ Modular architecture (48+ files)
- ✅ Real-time chat with Socket.IO
- ✅ Enhanced video signaling with WebSocket
- ✅ Multi-channel OTP (SMS or Email)
- ✅ WhatsApp reminders with BullMQ
- ✅ Review & rating system
- ✅ Production-ready security & logging
- ✅ Doctor profile updated to Dr. Annu Sharma
- ✅ Comprehensive documentation

---

**Built with ❤️ for modern healthcare**

**Status**: Production-Ready ✅
