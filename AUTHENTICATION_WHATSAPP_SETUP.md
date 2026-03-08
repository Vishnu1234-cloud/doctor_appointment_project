# Multi-Method Authentication & WhatsApp Setup Guide

## Overview

This guide covers the implementation of:
1. **Email + Password + OTP** authentication
2. **Google OAuth** login
3. **WhatsApp Business API** notifications
4. Security features and best practices

---

## 1. OTP Verification System

### Backend Implementation ✅ COMPLETE

**Features Implemented:**
- Cryptographically secure 6-digit OTP generation
- OTP hashing (SHA-256) for database storage
- 10-minute expiry time (configurable)
- Maximum 5 attempts per OTP
- Automatic cleanup of expired OTPs
- Resend with 2-minute cooldown
- Email delivery (structure ready)

**API Endpoints:**
- `POST /api/auth/register` - Register with OTP sent
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP (with rate limiting)

**Database Schema:**
```javascript
otp_verifications: {
  id: string,
  user_id: string,
  otp_hash: string (SHA-256),
  expiry_time: datetime,
  attempts: number,
  verified: boolean,
  created_at: datetime
}

users: {
  // ... existing fields
  otp_verified: boolean,
  phone_verified: boolean
}
```

**Environment Variables:**
```env
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### Email Integration (Requires Setup)

**Option 1: Resend (Recommended)**

1. **Create Resend Account**
   - Visit: https://resend.com
   - Sign up and verify domain
   - Get API key from dashboard

2. **Install Resend SDK**
   ```bash
   pip install resend
   ```

3. **Add to `.env`**
   ```env
   RESEND_API_KEY=re_your_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Update Backend Code**
   
   In `server.py`, replace the `send_otp_email` function:
   ```python
   import resend
   
   async def send_otp_email(email: str, otp: str, user_name: str) -> bool:
       resend.api_key = os.environ.get('RESEND_API_KEY')
       
       try:
           resend.Emails.send({
               "from": os.environ.get('FROM_EMAIL'),
               "to": email,
               "subject": "Your HealthLine Verification Code",
               "html": f"""
               <h2>Hi {user_name},</h2>
               <p>Your verification code is:</p>
               <h1 style="color: #0F766E; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
               <p>This code will expire in 10 minutes.</p>
               <p>If you didn't request this code, please ignore this email.</p>
               """
           })
           return True
       except Exception as e:
           logger.error(f"Email send failed: {str(e)}")
           return False
   ```

**Option 2: SMTP (Gmail, SendGrid, etc.)**

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def send_otp_email(email: str, otp: str, user_name: str) -> bool:
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email
    msg['Subject'] = 'Your HealthLine Verification Code'
    
    body = f"""
    <h2>Hi {user_name},</h2>
    <p>Your verification code is: <strong>{otp}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    """
    
    msg.attach(MIMEText(body, 'html'))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"SMTP send failed: {str(e)}")
        return False
```

---

## 2. Google OAuth Authentication

### Backend Setup

**Install Google Auth Library:**
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

**Add Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**Update Backend Code:**

```python
from google.auth.transport import requests
from google.oauth2 import id_token

@api_router.post("/auth/google")
async def google_auth(google_data: dict):
    token = google_data.get('token')
    
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
    
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            os.environ.get('GOOGLE_CLIENT_ID')
        )
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        google_id = idinfo.get('sub')
        
        # Check if user exists
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            user = {
                'id': user_id,
                'email': email,
                'full_name': name,
                'role': 'patient',
                'auth_provider': 'google',
                'google_id': google_id,
                'profile_image': picture,
                'otp_verified': True,  # Google emails are verified
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
        else:
            # Update existing user with Google data
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "auth_provider": "google",
                    "google_id": google_id,
                    "profile_image": picture,
                    "otp_verified": True
                }}
            )
            user_id = user['id']
        
        # Generate JWT token
        token = create_access_token({"sub": email, "role": user.get('role', 'patient')})
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "full_name": name,
                "role": user.get('role', 'patient'),
                "profile_image": picture
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Frontend Setup

**Install Google OAuth Package:**
```bash
cd frontend
yarn add @react-oauth/google
```

**Setup Google OAuth Provider:**

1. **Get Google Client ID:**
   - Go to: https://console.cloud.google.com
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - http://localhost:3000
     - https://yourdomain.com
   - Copy Client ID

2. **Update `frontend/src/index.js`:**
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
```

3. **Create Google Login Component:**

```javascript
// frontend/src/components/GoogleLoginButton.js
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export default function GoogleLoginButton({ onSuccess }) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`,
          { token: tokenResponse.access_token }
        );
        
        localStorage.setItem('token', data.token);
        onSuccess(data.user);
      } catch (error) {
        console.error('Google login failed:', error);
      }
    },
  });

  return (
    <Button
      onClick={() => login()}
      variant="outline"
      className="w-full rounded-full h-12"
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
      Continue with Google
    </Button>
  );
}
```

4. **Use in Login Page:**
```javascript
import GoogleLoginButton from '@/components/GoogleLoginButton';

// In Login component:
<GoogleLoginButton onSuccess={(user) => navigate('/patient/dashboard')} />
```

---

## 3. WhatsApp Business Cloud API

### Prerequisites

1. **Facebook Business Account**
2. **WhatsApp Business Platform Access**
3. **Verified Phone Number**

### Setup Steps

**Step 1: Create WhatsApp Business Account**

1. Go to: https://developers.facebook.com
2. Create new app → Business
3. Add WhatsApp product to app
4. Complete business verification

**Step 2: Get Credentials**

From WhatsApp dashboard, get:
- **Access Token** (temporary, get permanent one)
- **Phone Number ID**
- **WhatsApp Business Account ID**

**Step 3: Create Message Templates**

WhatsApp requires pre-approved templates. Create templates for:

1. **appointment_booking**
   ```
   Hello {{1}}, your appointment with Dr. {{2}} is confirmed for {{3}} at {{4}}. 
   Consultation type: {{5}}
   ```

2. **appointment_reminder**
   ```
   Reminder: Your consultation with Dr. {{1}} starts in 1 hour at {{2}}. 
   Meeting link: {{3}}
   ```

3. **consultation_link**
   ```
   Your consultation is ready to start! 
   Click here to join: {{1}}
   ```

4. **consultation_completed**
   ```
   Thank you for your consultation with Dr. {{1}}. 
   Your prescription is being prepared.
   ```

5. **prescription_ready**
   ```
   Your prescription is ready! 
   Download here: {{1}}
   ```

**Step 4: Configure Backend**

Add to `.env`:
```env
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_secret_token
```

**Step 5: Webhook Setup**

Create webhook endpoint for delivery status:

```python
@api_router.get("/webhooks/whatsapp")
async def verify_webhook(request: Request):
    """Webhook verification"""
    mode = request.query_params.get('hub.mode')
    token = request.query_params.get('hub.verify_token')
    challenge = request.query_params.get('hub.challenge')
    
    verify_token = os.environ.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
    
    if mode == 'subscribe' and token == verify_token:
        return int(challenge)
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

@api_router.post("/webhooks/whatsapp")
async def webhook(request: Request):
    """Handle incoming webhook events"""
    body = await request.json()
    
    # Log delivery status
    logger.info(f"WhatsApp webhook: {body}")
    
    # Process status updates
    if body.get('entry'):
        for entry in body['entry']:
            for change in entry.get('changes', []):
                # Handle message status updates
                pass
    
    return {"status": "ok"}
```

**Step 6: Register Webhook**

In Facebook Developer Console:
- Go to WhatsApp → Configuration
- Add webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
- Subscribe to: `messages`, `message_status`

### Testing WhatsApp

```python
# Test endpoint
@api_router.post("/test/whatsapp")
async def test_whatsapp(test_data: dict):
    phone = test_data.get('phone')  # Format: +919876543210
    
    success = await send_whatsapp_message(
        phone=phone,
        template_name="appointment_booking",
        variables={
            "patient_name": "Test User",
            "doctor_name": "Dr. Sarah Anderson",
            "date": "2026-02-20",
            "time": "10:00 AM",
            "type": "Video"
        }
    )
    
    return {"success": success}
```

Test with:
```bash
curl -X POST https://yourapi.com/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

## 4. Admin Configuration Panel

**Create Admin Settings Page:**

```javascript
// frontend/src/pages/AdminSettings.js
export default function AdminSettings() {
  const [settings, setSettings] = useState({
    otp_login_enabled: false,
    google_login_enabled: true,
    whatsapp_notifications_enabled: false,
    whatsapp_access_token: '',
    whatsapp_phone_id: ''
  });

  const handleSave = async () => {
    await axios.post('/api/admin/settings', settings);
  };

  return (
    <div className="p-8">
      <h1>Admin Settings</h1>
      
      <div className="space-y-4">
        <label>
          <input
            type="checkbox"
            checked={settings.otp_login_enabled}
            onChange={(e) => setSettings({...settings, otp_login_enabled: e.target.checked})}
          />
          Enable OTP Login
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.google_login_enabled}
            onChange={(e) => setSettings({...settings, google_login_enabled: e.target.checked})}
          />
          Enable Google Login
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.whatsapp_notifications_enabled}
            onChange={(e) => setSettings({...settings, whatsapp_notifications_enabled: e.target.checked})}
          />
          Enable WhatsApp Notifications
        </label>

        <button onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
}
```

---

## 5. Security Best Practices

### Rate Limiting

Add to backend:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin):
    # ... existing code
```

### OTP Security Checklist

- ✅ OTP hashed in database (SHA-256)
- ✅ Expiry time enforced (10 minutes)
- ✅ Maximum attempts limit (5)
- ✅ Rate limiting on resend (2 minutes)
- ✅ Auto-cleanup of expired OTPs
- ✅ One-time use enforcement
- ✅ Cryptographically secure generation

### Google OAuth Security

- ✅ Token verification with Google servers
- ✅ HTTPS only in production
- ✅ Restrict redirect URIs
- ✅ Regular token rotation
- ✅ Secure storage of credentials

### WhatsApp Security

- ✅ Access token in environment variables
- ✅ Webhook verification token
- ✅ HTTPS webhooks only
- ✅ Message delivery logging
- ✅ Fallback to email if fails

---

## 6. Testing Workflow

### Test OTP Flow

```bash
# 1. Register
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User",
    "role": "patient"
  }'

# Response includes otp_id
# Check logs for OTP code

# 2. Verify OTP
curl -X POST http://localhost:8001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_id_from_register",
    "otp_id": "otp_id_from_register",
    "otp": "123456"
  }'

# 3. Resend OTP
curl -X POST http://localhost:8001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_id_from_register"
  }'
```

### Test Google OAuth

1. Visit login page
2. Click "Continue with Google"
3. Select Google account
4. Should redirect with token
5. Verify user created in database

### Test WhatsApp

```bash
curl -X POST http://localhost:8001/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }'
```

---

## 7. Production Checklist

### Before Launch

- [ ] Email service configured (Resend/SMTP)
- [ ] Google OAuth client ID added
- [ ] WhatsApp Business verified
- [ ] All message templates approved
- [ ] Webhook endpoints tested
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database indexes created
- [ ] Monitoring enabled
- [ ] Error logging active

### Environment Variables Production

```env
# Never commit these to git!
JWT_SECRET=<strong-random-32-char-string>
RESEND_API_KEY=<your-resend-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-secret>
WHATSAPP_ACCESS_TOKEN=<permanent-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
```

---

## Summary

**Implemented ✅:**
- OTP generation, verification, resend
- Multi-auth database schema
- WhatsApp messaging structure
- Notification fallback system
- Security features (hashing, rate limiting)

**Requires Setup 🔧:**
- Email service API keys
- Google OAuth credentials
- WhatsApp Business account
- Message template approvals

**Estimated Setup Time:**
- Email (Resend): 30 minutes
- Google OAuth: 1 hour
- WhatsApp Business: 2-4 hours (includes approval wait time)

---

For questions or issues, refer to:
- Resend docs: https://resend.com/docs
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- WhatsApp API: https://developers.facebook.com/docs/whatsapp
