# 🧪 localhost Testing ke liye Credentials

## Patient Account (Mareez)

**Email**: `patient@test.com`  
**Password**: `test123`  
**Role**: Patient

### Kya test kar sakte ho:
- ✅ Login karo
- ✅ Appointment book karo
- ✅ Doctor se video call karo
- ✅ Chat karo
- ✅ Prescription download karo
- ✅ Review submit karo

---

## Doctor Account (Doctor)

**Email**: `doctor@healthline.com`  
**Password**: `doctor123`  
**Role**: Doctor

### Kya test kar sakte ho:
- ✅ Login karo
- ✅ Appointments dekho
- ✅ Patient se video call karo
- ✅ Prescription banao
- ✅ Dashboard dekho

---

## Kaise Use Karein

### 1. Application start karo:

**Terminal 1 - Backend:**
```bash
cd /app/backend
yarn dev
```

**Terminal 2 - Frontend:**
```bash
cd /app/frontend
yarn start
```

### 2. Browser me kholo:
```
http://localhost:3000
```

### 3. Login karo:

**Patient ke liye:**
- Login button pe click karo
- Email: `patient@test.com`
- Password: `test123`

**Doctor ke liye:**
- Login button pe click karo
- Email: `doctor@healthline.com`
- Password: `doctor123`

---

## Complete Testing Flow

### Test 1: Patient Appointment Book Kare

1. **Patient login** (`patient@test.com` / `test123`)
2. **"Book Appointment" pe jao**
3. **Date aur time select karo**
4. **Reason likho** (jaise: "General checkup")
5. **"Book Now" pe click karo**
6. ✅ Appointment book ho gayi!

### Test 2: Doctor Appointment Dekhe

1. **Doctor login** (`doctor@healthline.com` / `doctor123`)
2. **"Doctor Dashboard" pe jao**
3. ✅ Sari appointments dikhengi
4. **Status change kar sakte ho** (Pending → Confirmed)

### Test 3: Video Consultation

1. **Patient**: Appointment me "Join" pe click karo
2. **Doctor**: Dusre browser me login karke "Join" pe click karo
3. ✅ Dono video call pe mil jayenge!
4. ✅ Chat bhi kar sakte ho real-time me

### Test 4: Prescription Banao (Doctor)

1. **Doctor login** (`doctor@healthline.com` / `doctor123`)
2. **Completed appointment pe jao**
3. **"Create Prescription" pe click karo**
4. **Details bharo**:
   - Diagnosis (bimari ka naam)
   - Medicines (dawa ka naam, kitni baar, kitne din)
   - Notes
5. **Submit karo**
6. ✅ Patient ko prescription mil jayegi!

### Test 5: Review Submit Karo (Patient)

1. **Patient login** (`patient@test.com` / `test123`)
2. **Completed appointment pe jao**
3. **"Submit Review" pe click karo**
4. **Rating do** (1-5 stars)
5. **Comment likho**
6. ✅ Review submit ho gayi!

---

## Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api
- **Health Check**: http://localhost:8001/health

---

## Agar Problem Aaye

### Login nahi ho raha?
```bash
# Backend logs dekho
tail -f /var/log/supervisor/backend.out.log

# MongoDB check karo
ps aux | grep mongo
```

### Video call nahi chal raha?
- Camera aur microphone allow karo browser me
- Dono users (patient + doctor) ko same appointment me join karna padega

### OTP nahi aa raha?
- Development mode me OTP logs me dikhai dega
- Backend logs dekho: `tail -f /var/log/supervisor/backend.out.log | grep OTP`

---

## Quick Reference

| Account | Email | Password |
|---------|-------|----------|
| Patient | patient@test.com | test123 |
| Doctor | doctor@healthline.com | doctor123 |
| Admin | admin@healthline.com | admin123 |

---

**Note**: Ye test credentials hain, production me use mat karna! 🔒
