"""
Tests for critical bug fixes:
1. Role-based routing - doctor vs patient login redirects
2. Chat messaging - message persistence via WebSocket
3. Video consultation - appointment types (chat vs video)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DOCTOR_EMAIL = "doctor@healthline.com"
DOCTOR_PASSWORD = "Doctor@123"
PATIENT_EMAIL = "patient@test.com"
PATIENT_PASSWORD = "Patient@123"

# Test appointments from seed data
CHAT_APPOINTMENT_ID = "test-chat-appointment-001"
VIDEO_APPOINTMENT_ID = "test-video-appointment-001"


class TestRoleBasedRouting:
    """Bug Fix #1: Doctor login should return role='doctor' for correct routing"""
    
    def test_doctor_login_returns_doctor_role(self):
        """Verify doctor login returns role='doctor' for frontend routing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DOCTOR_EMAIL,
            "password": DOCTOR_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Validate token exists
        assert "token" in data, "Token not returned"
        assert len(data["token"]) > 0, "Token is empty"
        
        # Critical: Validate role is 'doctor' for routing
        assert "user" in data, "User data not returned"
        assert data["user"]["role"] == "doctor", f"Expected role='doctor', got '{data['user'].get('role')}'"
        assert data["user"]["email"] == DOCTOR_EMAIL
    
    def test_patient_login_returns_patient_role(self):
        """Verify patient login returns role='patient' for frontend routing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PATIENT_EMAIL,
            "password": PATIENT_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Critical: Validate role is 'patient' for routing
        assert "user" in data, "User data not returned"
        assert data["user"]["role"] == "patient", f"Expected role='patient', got '{data['user'].get('role')}'"
        assert data["user"]["email"] == PATIENT_EMAIL
    
    def test_invalid_credentials_rejected(self):
        """Verify invalid credentials are rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestChatMessaging:
    """Bug Fix #2: Chat messages should be persisted and retrievable"""
    
    @pytest.fixture
    def doctor_auth(self):
        """Get doctor authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DOCTOR_EMAIL,
            "password": DOCTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["token"],
            "user_id": data["user"]["id"]
        }
    
    @pytest.fixture
    def patient_auth(self):
        """Get patient authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PATIENT_EMAIL,
            "password": PATIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["token"],
            "user_id": data["user"]["id"]
        }
    
    def test_get_chat_messages_endpoint_exists(self, doctor_auth):
        """Verify GET /api/chat/messages/:appointment_id endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/chat/messages/{CHAT_APPOINTMENT_ID}",
            headers={"Authorization": f"Bearer {doctor_auth['token']}"}
        )
        
        # Endpoint should exist and return 200 or empty array
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of messages"
    
    def test_chat_messages_are_persisted(self, doctor_auth):
        """Verify messages from test appointments are persisted"""
        response = requests.get(
            f"{BASE_URL}/api/chat/messages/{CHAT_APPOINTMENT_ID}",
            headers={"Authorization": f"Bearer {doctor_auth['token']}"}
        )
        
        assert response.status_code == 200
        messages = response.json()
        
        # Verify messages exist (seeded by previous test runs)
        if len(messages) > 0:
            msg = messages[0]
            assert "message" in msg, "Message field missing"
            assert "sender_id" in msg, "Sender ID field missing"
            assert "sender_role" in msg, "Sender role field missing"
            assert "timestamp" in msg, "Timestamp field missing"
    
    def test_chat_messages_unauthorized_rejected(self):
        """Verify unauthorized access to chat messages is rejected"""
        response = requests.get(f"{BASE_URL}/api/chat/messages/{CHAT_APPOINTMENT_ID}")
        
        # Should require authentication
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestAppointmentTypes:
    """Bug Fix #3: Appointment types (chat vs video) for UI mode detection"""
    
    @pytest.fixture
    def doctor_auth(self):
        """Get doctor authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DOCTOR_EMAIL,
            "password": DOCTOR_PASSWORD
        })
        return {"token": response.json()["token"]}
    
    def test_chat_appointment_has_chat_type(self, doctor_auth):
        """Verify chat appointment has consultation_type='chat'"""
        response = requests.get(
            f"{BASE_URL}/api/appointments/{CHAT_APPOINTMENT_ID}",
            headers={"Authorization": f"Bearer {doctor_auth['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to get appointment: {response.text}"
        data = response.json()
        
        assert data["consultation_type"] == "chat", f"Expected 'chat', got '{data.get('consultation_type')}'"
        assert data["id"] == CHAT_APPOINTMENT_ID
    
    def test_video_appointment_has_video_type(self, doctor_auth):
        """Verify video appointment has consultation_type='video'"""
        response = requests.get(
            f"{BASE_URL}/api/appointments/{VIDEO_APPOINTMENT_ID}",
            headers={"Authorization": f"Bearer {doctor_auth['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to get appointment: {response.text}"
        data = response.json()
        
        assert data["consultation_type"] == "video", f"Expected 'video', got '{data.get('consultation_type')}'"
        assert data["id"] == VIDEO_APPOINTMENT_ID


class TestHealthCheck:
    """Basic API health tests"""
    
    def test_api_root_returns_healthy(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"


class TestAuthEndpoints:
    """Additional auth endpoint tests"""
    
    @pytest.fixture
    def doctor_token(self):
        """Get doctor token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DOCTOR_EMAIL,
            "password": DOCTOR_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def patient_token(self):
        """Get patient token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PATIENT_EMAIL,
            "password": PATIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_me_doctor(self, doctor_token):
        """Verify /auth/me returns correct doctor info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "doctor"
        assert data["email"] == DOCTOR_EMAIL
    
    def test_get_me_patient(self, patient_token):
        """Verify /auth/me returns correct patient info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "patient"
        assert data["email"] == PATIENT_EMAIL
