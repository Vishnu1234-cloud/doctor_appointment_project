# HealthLine Backend - Node.js/Express

Production-ready Node.js backend for HealthLine telemedicine platform.

## Features

- **Modular Architecture**: Organized by routes/controllers/services/models
- **Real-time Communication**: Socket.IO for chat, WebSocket for video signaling
- **Scheduled Reminders**: BullMQ + Redis for WhatsApp reminders
- **OTP with Delivery Choice**: SMS (MSG91) or Email (Resend)
- **Reviews & Ratings**: Post-appointment review system
- **Production-ready**: Logging, error handling, rate limiting, security

## Tech Stack

- Node.js 20+
- Express.js
- MongoDB (Mongoose)
- Redis (BullMQ)
- Socket.IO
- Native WebSocket
- JWT Authentication
- Zod Validation
- Pino Logging

## Installation

```bash
cd /app/backend
yarn install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update environment variables (see `.env.example` for all options)
3. **Important**: Set `JWT_SECRET` in production

## Running

### Development
```bash
yarn dev
```

### Production
```bash
yarn start
```

### With Docker
```bash
docker-compose up backend
```

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/request-otp` - Request OTP (SMS or Email)
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/me` - Get current user

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id/status` - Update status
- `PUT /api/appointments/:id/reschedule` - Reschedule
- `DELETE /api/appointments/:id` - Cancel

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - List prescriptions
- `GET /api/prescriptions/:id/pdf` - Download PDF

### Testimonials (Reviews)
- `GET /api/testimonials` - List reviews
- `POST /api/testimonials` - Submit review (after completed appointment)

### Real-time Features

#### Socket.IO (Chat)
```javascript
const socket = io('http://localhost:8001', {
  auth: { token: 'JWT_TOKEN' }
});

socket.emit('join_appointment', appointmentId);
socket.emit('send_message', { appointmentId, message });
```

#### WebSocket (Video Signaling)
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/consultation/:appointmentId');
ws.send(JSON.stringify({ type: 'auth', token: 'JWT_TOKEN' }));
```

## Environment Variables

See `.env.example` for complete list.

### Critical Variables

- `JWT_SECRET`: **REQUIRED** in production
- `MONGO_URL`: MongoDB connection string
- `CORS_ORIGINS`: Cannot be "*" in production

### Optional Services

- MSG91 (SMS OTP): Set `SMS_ENABLED=true` + API credentials
- Resend (Email): Set `EMAIL_ENABLED=true` + API key
- WhatsApp (Reminders): Set `WHATSAPP_ENABLED=true` + credentials

## Development Mode Features

- OTP logged to console
- Auto-generated JWT secret
- Detailed error messages
- Pretty logs (pino-pretty)

## Production Considerations

- Set strong `JWT_SECRET`
- Configure strict CORS origins
- Enable rate limiting
- Setup Redis for reminders
- Configure external services (SMS, Email, WhatsApp)
- Use process manager (PM2, systemd)

## Testing

```bash
yarn test
```

## License

Proprietary - HealthLine 2026
