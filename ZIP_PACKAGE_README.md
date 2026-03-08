# HealthLine Telemedicine Platform - v2.0.0

**Complete Full-Stack Application Package**

This ZIP contains the fully migrated HealthLine telemedicine platform with Node.js/Express backend and React frontend.

## 📦 Package Contents

```
healthline-fullstack-v2/
├── backend/                    # Node.js/Express Backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── routes/            # API routes (10 files)
│   │   ├── controllers/       # Request handlers (10 files)
│   │   ├── services/          # Business logic (7 files)
│   │   ├── models/            # Mongoose schemas (9 files)
│   │   ├── middlewares/       # Express middlewares (4 files)
│   │   ├── workers/           # BullMQ workers (1 file)
│   │   ├── utils/             # Utilities (2 files)
│   │   ├── app.js             # Express app
│   │   ├── server.js          # HTTP server + Socket.IO + WebSocket
│   │   ├── socket.js          # Socket.IO handlers
│   │   └── ws.video.js        # Video signaling WebSocket
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment variables
│   ├── .env.example           # Example configuration
│   └── README.md              # Backend documentation
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Utilities
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment variables
│   ├── craco.config.js        # CRA configuration
│   └── tailwind.config.js     # Tailwind CSS config
│
├── docker-compose.yml         # Docker setup (MongoDB, Redis, Backend, Frontend)
├── README.md                  # Project documentation
├── IMPLEMENTATION_REPORT.md   # Complete migration report
├── FRONTEND_BUILD_FIX.md      # Frontend build fix documentation
└── .gitignore                 # Git ignore rules
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Extract the ZIP
unzip healthline-fullstack-v2.zip
cd healthline-fullstack-v2

# Start all services with Docker
docker-compose up
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- MongoDB: localhost:27017
- Redis: localhost:6379

### Option 2: Manual Setup

#### Prerequisites
- Node.js 20+
- MongoDB
- Redis (optional - for reminders)
- Yarn package manager

#### Backend Setup

```bash
cd backend
yarn install
cp .env.example .env

# Edit .env with your configuration
# Start backend
yarn dev
```

Backend runs on: http://localhost:8001

#### Frontend Setup

```bash
cd frontend
yarn install

# Edit .env if needed
# Start frontend
yarn start
```

Frontend runs on: http://localhost:3000

## 🔧 Configuration

### Backend Environment Variables (.env)

**Required:**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=healthline_db
NODE_ENV=development
PORT=8001
```

**Optional (Auto-generated in dev):**
```bash
JWT_SECRET=your-secret-key
```

**External Services (Optional):**
```bash
# SMS OTP (MSG91 - India)
SMS_ENABLED=false
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=your_sender_id
MSG91_TEMPLATE_ID=your_template_id

# Email (Resend)
EMAIL_ENABLED=false
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@healthline.com

# WhatsApp Reminders (NOT for OTP)
WHATSAPP_ENABLED=false
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Redis (for reminders)
REDIS_HOST=localhost
REDIS_PORT=6379

# Payment (Razorpay)
PAYMENT_TEST_MODE=true
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Frontend Environment Variables (.env)

```bash
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## ✨ Key Features

### Implemented & Working

✅ **User Authentication**
- Email/password registration and login
- JWT-based authentication
- Role-based access control (patient, doctor, admin)
- Multi-channel OTP (SMS or Email)
- Google OAuth (structure ready)

✅ **Appointment Management**
- Book appointments with time slot selection
- View, reschedule, cancel appointments
- Automatic WhatsApp reminders (1 hour & 10 minutes before)
- Payment integration (Razorpay)

✅ **Real-time Communication**
- Socket.IO powered chat during consultations
- WebRTC video calling with native WebSocket signaling
- Typing indicators
- User presence tracking

✅ **Medical Features**
- Digital prescription generation (PDF)
- Medical history management
- Review & rating system (post-appointment)
- Doctor profile (Dr. Annu Sharma)

✅ **Production-Ready**
- Structured logging (Pino)
- Error handling middleware
- Rate limiting (API, auth, OTP, payment)
- Security headers (Helmet)
- Input validation (Zod)
- CORS configuration
- MongoDB sanitization
- XSS protection

## 👩‍⚕️ Doctor Profile

**Dr. Annu Sharma**
- **Qualification**: MD (Ayurveda) | Postgraduate Physician | IMS-BHU Graduate
- **Specialization**: General Physician, Gynecologist & Women's Health
- **Experience**: 8+ years
- **Consultation Fee**: ₹100
- **Available**: Monday to Friday (6:00pm to 8:00pm)
- **Languages**: Hindi, English

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/request-otp` - Request OTP (SMS or Email)
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/me` - Get current user

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/status` - Update status
- `PUT /api/appointments/:id/reschedule` - Reschedule
- `DELETE /api/appointments/:id` - Cancel

### Prescriptions
- `POST /api/prescriptions` - Create prescription (doctor only)
- `GET /api/prescriptions` - List prescriptions
- `GET /api/prescriptions/:id/pdf` - Download PDF

### Testimonials (Reviews)
- `GET /api/testimonials` - List reviews
- `POST /api/testimonials` - Submit review (after completed appointment)

### Real-time Features
- **Socket.IO**: `http://localhost:8001` with JWT auth
- **WebSocket**: `ws://localhost:8001/ws/consultation/:appointmentId`

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt, 12 rounds)
- Helmet security headers
- Rate limiting on critical endpoints
- CORS validation (strict in production)
- MongoDB injection prevention
- XSS protection
- Input validation (Zod)
- OTP anti-abuse rules
- User enumeration prevention
- No sensitive data in production logs

## 🧪 Testing

The backend has been tested with:
- User registration and login ✅
- OTP generation and verification ✅
- Appointment creation ✅
- Review submission ✅
- Doctor profile API ✅
- Time slot availability ✅
- Health checks ✅

## 📊 Tech Stack

### Backend
- Node.js 20+
- Express
- MongoDB (Mongoose)
- Socket.IO
- WebSocket (native)
- BullMQ + Redis
- JWT + bcrypt
- Pino (logging)
- Zod (validation)
- Helmet (security)
- PDFKit (PDF generation)

### Frontend
- React 19
- Tailwind CSS
- Shadcn/UI
- React Router
- Socket.IO Client
- Simple Peer (WebRTC)
- Axios
- React Hook Form
- Zod

## 🚀 Deployment

### Production Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` in backend/.env
- [ ] Configure strict `CORS_ORIGINS` (no "*")
- [ ] Setup external services (MSG91, Resend, WhatsApp)
- [ ] Configure Redis for scheduled reminders
- [ ] Setup TURN servers for video calls
- [ ] Configure Razorpay production keys
- [ ] Enable HTTPS
- [ ] Setup monitoring and logging
- [ ] Configure database backups
- [ ] Set `NODE_ENV=production`

### Docker Deployment

```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

Use PM2 or systemd for process management:

```bash
# Backend
cd backend
pm2 start src/server.js --name healthline-backend

# Frontend (build for production)
cd frontend
yarn build
# Serve build folder with nginx or serve
```

## 📝 Important Notes

### Development Mode Features
- OTP logged to console (for testing)
- Auto-generated JWT secret
- Test mode payments enabled
- CORS allows all origins
- Detailed error messages

### Production Mode Features
- OTP NEVER logged
- JWT_SECRET required (app crashes if missing)
- Real payment processing
- Strict CORS origins
- Generic error messages

### Mocked Services
When API keys are not configured, services gracefully degrade:
- SMS OTP: Logs to console in dev
- Email OTP: Logs to console in dev
- WhatsApp: Logs to console when disabled
- Redis: App continues without reminders

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod --version`
- Verify MONGO_URL in .env
- Check logs: `yarn dev` (in backend folder)

### Frontend build errors
- Clear cache: `rm -rf node_modules/.cache`
- Reinstall: `yarn install`
- Check Node version: `node --version` (should be 20+)

### Can't connect to backend from frontend
- Verify REACT_APP_BACKEND_URL in frontend/.env
- Check backend is running on port 8001
- Check CORS configuration in backend

### Redis connection errors
- Redis is optional - app works without it
- Reminders won't be scheduled without Redis
- To enable: Install and start Redis server

## 📞 Support

For issues or questions:
- Check `/backend/README.md` for backend documentation
- Check `/IMPLEMENTATION_REPORT.md` for complete details
- Email: support@healthline.com

## 📄 License

Proprietary - All rights reserved

---

## 🆕 Version 2.0.0 Changes

### Backend Migration
- ✅ Migrated from Python FastAPI to Node.js/Express
- ✅ Fully modular architecture (48+ files)
- ✅ Production-ready with comprehensive logging
- ✅ All API endpoints maintained (frontend compatibility)

### New Features
- ✅ Real-time chat (Socket.IO)
- ✅ Multi-channel OTP (SMS or Email choice)
- ✅ WhatsApp reminders (BullMQ + Redis)
- ✅ Review & rating system
- ✅ Enhanced security (Helmet, rate limiting, validation)
- ✅ Doctor profile updated to Dr. Annu Sharma

### Technical Improvements
- ✅ Modular code structure
- ✅ Comprehensive error handling
- ✅ Structured logging (Pino)
- ✅ Input validation (Zod)
- ✅ Anti-abuse OTP rules
- ✅ User enumeration prevention
- ✅ Graceful service degradation

---

**Built with ❤️ for modern healthcare**

**Package Version**: 2.0.0  
**Release Date**: March 1, 2026  
**Status**: Production-Ready ✅
