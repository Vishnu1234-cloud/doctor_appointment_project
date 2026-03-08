# HealthLine Telemedicine Platform - Testing Guide

## Preview URL
**https://consultation-fixes.preview.emergentagent.com**

## Test Credentials

### Patient Account
- **Email**: patient@test.com
- **Password**: test123

### Doctor Account
- **Email**: doctor@test.com
- **Password**: doctor123

## Complete Testing Workflow

### 1. Landing Page Testing
✅ **URL**: https://consultation-fixes.preview.emergentagent.com

**What to Check:**
- Hero section with "Your Health, Our Priority"
- Doctor profile section (Dr. Sarah Anderson)
- Services section (Video, Chat, Digital Prescriptions)
- Trust badges (Secure Consultation, Certified Doctor, etc.)
- Testimonials carousel with auto-sliding
- Pricing section (₹500 consultation fee)
- FAQ accordion
- Navigation menu (About, Services, Testimonials, Blog)

**Actions to Test:**
- Click "Book Consultation" → Should redirect to registration if not logged in
- Click "Login" → Should go to login page
- Click "Get Started" → Should go to registration page
- Scroll through testimonials carousel → Should auto-slide every 5 seconds

---

### 2. Patient Registration
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/register

**Steps:**
1. Fill in the form:
   - Full Name: [Your Name]
   - Email: [your-email@test.com]
   - Phone: [Optional]
   - Password: [Your Password]
2. Click "Create Account"
3. Should show success message
4. Should redirect to login page

---

### 3. Patient Login
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/login

**Steps:**
1. Enter credentials:
   - Email: patient@test.com
   - Password: test123
2. Click "Sign In"
3. Should show "Login successful!" toast
4. Should redirect to Patient Dashboard

---

### 4. Patient Dashboard
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/patient/dashboard

**What to Check:**
- Welcome message with patient name
- 4 Quick Action Cards:
  - Book Appointment
  - Prescriptions
  - Medical History
  - Health Blog
- Appointments list section
- Logout button in header

**Actions to Test:**
- Click "Book Appointment" → Should go to booking page
- Click "Prescriptions" → Should go to prescriptions page
- Click "Medical History" → Should go to medical history page
- Click "Logout" → Should logout and redirect to homepage

---

### 5. Book Appointment (CRITICAL FLOW)
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/patient/book-appointment

**Step-by-Step Test:**

**Step 1: Select Date**
- Calendar should display current month
- Select a future date (tomorrow or any date within next 30 days)
- Calendar should highlight selected date

**Step 2: View Time Slots**
- After selecting date, time slots should load automatically
- Available slots: 9:00 AM to 6:00 PM (30-minute intervals)
- Slots should be displayed as buttons
- Already booked slots will not appear

**Step 3: Select Time Slot**
- Click on any available time slot
- Button should change color to show selection
- Selected time should be stored

**Step 4: Choose Consultation Type**
- Two radio options:
  - Video Consultation (default)
  - Chat Consultation
- Select your preferred type

**Step 5: Enter Reason**
- In the "Reason for Consultation" textarea
- Enter: "Regular health checkup and consultation"
- Must be filled (required field)

**Step 6: Review & Pay**
- Consultation fee should display: ₹500
- Click "Proceed to Payment" button
- **Loading state should show**

**Step 7: Test Payment Mode**
- Should see toast: "Test Mode: Simulating payment..."
- Wait 1.5 seconds
- Should see toast: "Appointment booked successfully! (Test Mode)"
- Should redirect to Patient Dashboard

**Step 8: Verify Appointment**
- Back on dashboard, new appointment should appear in list
- Check appointment details:
  - Date: [Your selected date]
  - Time: [Your selected time]
  - Reason: [Your entered reason]
  - Status badge: "confirmed" (green)
  - Payment status: completed
- "Join" button should be visible

---

### 6. Consultation Room
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/consultation/[appointment-id]

**Steps:**
1. From dashboard, click "Join" button on confirmed appointment
2. Should navigate to consultation room

**What to Check:**
- Video area placeholder (black screen saying "Video consultation will start here")
- Chat section on the right
- Message input box
- Send button
- Video/Audio toggle buttons in header

**Actions to Test:**
- Type a test message in chat input
- Click Send button
- Message should appear in chat area
- Toggle video/audio buttons (should change icon)

---

### 7. Prescriptions Page
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/patient/prescriptions

**What to Check:**
- If no prescriptions: Empty state with message
- If prescriptions exist:
  - Prescription cards with diagnosis
  - Medicines list
  - Doctor notes
  - Download PDF button
  - Date of prescription

---

### 8. Medical History
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/patient/medical-history

**Upload Test:**
1. Select record type from dropdown:
   - Lab Report
   - Scan/X-Ray
   - Previous Prescription
   - Other
2. Click "Select File" and choose any PDF/image
3. Enter description: "Blood test report from last month"
4. Click "Upload Record"
5. Should show success message
6. Record should appear in list below

---

### 9. Doctor Login & Dashboard
✅ **Login URL**: https://consultation-fixes.preview.emergentagent.com/login

**Steps:**
1. Logout from patient account (if logged in)
2. Login with doctor credentials:
   - Email: doctor@test.com
   - Password: doctor123
3. Should redirect to Doctor Dashboard

**Doctor Dashboard URL**: https://consultation-fixes.preview.emergentagent.com/doctor/dashboard

**What to Check:**
- Stats cards:
  - Today's Appointments
  - Pending
  - Completed
  - Total Appointments
- Full appointments list
- Each appointment shows:
  - Patient reason
  - Date and time
  - Status badge
  - Action buttons

**Actions to Test:**
- Click "Confirm" on pending appointment
- Should update status to confirmed
- Click "Join" on confirmed appointment
- Should go to consultation room

---

### 10. Blog Section
✅ **URL**: https://consultation-fixes.preview.emergentagent.com/blog

**What to Check:**
- Empty state if no posts (expected for new installation)
- Message: "No blog posts yet"

---

## Backend API Testing (Optional)

### Using Browser Console or Postman

**Test Authentication:**
```bash
curl -X POST https://consultation-fixes.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"test123"}'
```

**Test Appointments List:**
```bash
curl -X GET https://consultation-fixes.preview.emergentagent.com/api/appointments \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Test Doctor Profile:**
```bash
curl -X GET https://consultation-fixes.preview.emergentagent.com/api/doctor/profile
```

---

## Known Test Mode Behaviors

### Payment System
- **Test Mode is ENABLED** (PAYMENT_TEST_MODE=true)
- No real Razorpay gateway is called
- Payment simulation takes 1.5 seconds
- All test payments automatically succeed
- Appointments are marked as "confirmed" after test payment

### Video Consultation
- WebRTC video calls need additional STUN/TURN server setup for production
- Current implementation shows placeholder for video area
- Chat functionality works in real-time

### Notifications
- Email notifications are not active (requires SMTP configuration)
- Success/error messages shown via toast notifications

---

## Troubleshooting

### Preview Not Loading
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Try incognito/private window
4. Check browser console for errors (F12)

### Login Issues
- Use exact credentials provided
- Check for typos in email/password
- Ensure caps lock is off

### Booking Not Working
1. Ensure you're logged in
2. Select a future date (not past)
3. Select a time slot (button should be highlighted)
4. Fill in the reason field
5. Check browser console for errors

### Appointment Not Showing
- Refresh the dashboard page
- Check backend logs if issues persist
- Appointment should appear within a few seconds

---

## Success Criteria

✅ **Complete Patient Journey:**
1. Register → Login → Book Appointment → Pay (test mode) → Appointment Confirmed → Dashboard shows appointment → Join consultation

✅ **Complete Doctor Journey:**
1. Login → View appointments → Confirm appointment → Join consultation

✅ **Data Persistence:**
- All users saved to database
- All appointments saved with payment status
- Medical history uploads stored

---

## Next Steps After Testing

Once you've tested and confirmed everything works:

1. **For Production Deployment:**
   - Add real Razorpay API keys
   - Set PAYMENT_TEST_MODE=false
   - Configure SMTP for email notifications
   - Set up SSL certificate
   - Configure domain

2. **Report Any Issues:**
   - Take screenshots of any errors
   - Note the exact steps that caused the issue
   - Check browser console for error messages

---

## Support

If you encounter any issues during testing:
1. Check this guide first
2. Verify you're using correct test credentials
3. Try refreshing the page
4. Check if services are running

---

**Happy Testing! 🎉**

The platform is fully functional in test mode and ready for your review.
