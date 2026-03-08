# 🧪 Test Credentials for localhost

## Patient Account

**Email**: `patient@test.com`  
**Password**: `test123`  
**Role**: Patient  
**Name**: Test Patient

### What you can test:
- ✅ Register/Login
- ✅ Book appointments
- ✅ View appointments
- ✅ Join video consultation
- ✅ Chat with doctor
- ✅ View prescriptions
- ✅ Download prescription PDF
- ✅ Submit reviews (after appointment completed)
- ✅ View medical history

---

## Doctor Account

**Email**: `doctor@healthline.com`  
**Password**: `doctor123`  
**Role**: Doctor  
**Name**: Dr. Annu Sharma

### What you can test:
- ✅ Login as doctor
- ✅ View all appointments
- ✅ Update appointment status
- ✅ Join video consultation
- ✅ Chat with patient
- ✅ Create prescriptions
- ✅ View patient history
- ✅ Doctor dashboard

---

## Admin Account

**Email**: `admin@healthline.com`  
**Password**: `admin123`  
**Role**: Admin  
**Name**: Admin User

### What you can test:
- ✅ View all users
- ✅ View all appointments
- ✅ System statistics
- ✅ Admin dashboard

---

## How to Use

### 1. Start the application:
```bash
# Backend
cd /app/backend
yarn dev

# Frontend (new terminal)
cd /app/frontend
yarn start
```

### 2. Open browser:
```
http://localhost:3000
```

### 3. Test Login:

**For Patient:**
1. Click "Login"
2. Enter email: `patient@test.com`
3. Enter password: `test123`
4. Click "Login"

**For Doctor:**
1. Click "Login"
2. Enter email: `doctor@healthline.com`
3. Enter password: `doctor123`
4. Click "Login"

---

## Create New Test Users

You can also register new users directly from the UI:

**Patient Registration:**
```
http://localhost:3000/register
```

Fill in:
- Full Name: Your Name
- Email: youremail@example.com
- Password: yourpassword
- Role: Patient

**Doctor Registration (via API):**
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdoctor@healthline.com",
    "full_name": "Dr. New Doctor",
    "password": "password123",
    "role": "doctor"
  }'
```

---

## Complete Test Flow

### Scenario 1: Patient Books Appointment

1. **Login as Patient** (`patient@test.com` / `test123`)
2. **Book Appointment**:
   - Go to "Book Appointment"
   - Select date (future date)
   - Select time slot
   - Select consultation type (Video/Chat)
   - Enter reason
   - Click "Book Now"
3. **View Appointment**:
   - Go to "My Appointments"
   - See the booked appointment

### Scenario 2: Doctor Manages Appointment

1. **Login as Doctor** (`doctor@healthline.com` / `doctor123`)
2. **View Appointments**:
   - Go to "Doctor Dashboard"
   - See all appointments
3. **Update Status**:
   - Click on appointment
   - Change status to "Confirmed"
4. **Join Consultation**:
   - When appointment time, click "Join"
   - Start video/chat consultation

### Scenario 3: Video Consultation

1. **Patient joins** (logged in as patient)
   - Go to appointment
   - Click "Join Consultation"
   - Allow camera/microphone

2. **Doctor joins** (logged in as doctor)
   - Open in another browser/incognito
   - Login as doctor
   - Join same consultation

3. **Both can**:
   - See each other's video
   - Chat in real-time
   - Share screen (if enabled)

### Scenario 4: Create Prescription

1. **Login as Doctor** (`doctor@healthline.com` / `doctor123`)
2. **Go to completed appointment**
3. **Click "Create Prescription"**
4. **Fill in**:
   - Diagnosis
   - Medicines (name, dosage, duration)
   - Notes
5. **Submit**
6. **Patient can now**:
   - Login as patient
   - View prescription
   - Download PDF

### Scenario 5: Submit Review

1. **Login as Patient** (`patient@test.com` / `test123`)
2. **Go to completed appointment**
3. **Click "Submit Review"**
4. **Enter**:
   - Rating (1-5 stars)
   - Comment
5. **Submit**
6. **Review appears** in testimonials page

---

## Test OTP Login

### With Email OTP:

1. Go to Login page
2. Click "Login with OTP"
3. Enter email: `patient@test.com`
4. Select: "Email"
5. Click "Send OTP"
6. **Check backend logs** for OTP:
   ```bash
   tail -f /var/log/supervisor/backend.out.log | grep OTP
   ```
7. You'll see: `[DEV] OTP for patient@test.com: 123456`
8. Enter the OTP and verify

### With SMS OTP (if MSG91 configured):

1. Go to Login page
2. Click "Login with OTP"
3. Enter phone: `+919876543210`
4. Select: "SMS"
5. Click "Send OTP"
6. Enter OTP received on phone

---

## Test Payment (Razorpay)

The app uses **test mode** by default.

**Test payment flow:**
1. Book appointment as patient
2. When payment page appears
3. Use Razorpay test cards:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
4. Payment will be marked as successful in test mode

---

## API Testing with curl

### Login and Get Token:
```bash
# Login as patient
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "test123"
  }'

# Save the token from response
TOKEN="<paste_token_here>"
```

### Get Current User:
```bash
curl http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Get Appointments:
```bash
curl http://localhost:8001/api/appointments \
  -H "Authorization: Bearer $TOKEN"
```

### Get Doctor Profile:
```bash
curl http://localhost:8001/api/doctor/profile
```

### Get Testimonials:
```bash
curl http://localhost:8001/api/testimonials
```

---

## Troubleshooting

### Can't login?
- Check backend is running on port 8001
- Check MongoDB is running
- Check logs: `tail -f /var/log/supervisor/backend.out.log`

### OTP not working?
- In development, OTP is logged to console
- Check backend logs for `[DEV] OTP for...`
- External services (MSG91, Resend) need API keys

### Payment not working?
- App uses test mode by default
- No real charges are made
- Check `PAYMENT_TEST_MODE=true` in backend/.env

### Video call not connecting?
- Allow camera/microphone permissions
- Check WebSocket connection
- Both users must be in same appointment
- Check browser console for errors

---

## Quick Reference

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Patient | patient@test.com | test123 | patient |
| Doctor | doctor@healthline.com | doctor123 | doctor |
| Admin | admin@healthline.com | admin123 | admin |

**Frontend**: http://localhost:3000  
**Backend**: http://localhost:8001/api  
**Health Check**: http://localhost:8001/health

---

## Notes

- ⚠️ These are **test credentials only** - never use in production
- 🔒 Passwords are hashed with bcrypt (12 rounds)
- 📝 OTP is logged to console in development mode
- 💳 Payments are in test mode (no real transactions)
- 📧 Emails/SMS are mocked unless API keys configured
