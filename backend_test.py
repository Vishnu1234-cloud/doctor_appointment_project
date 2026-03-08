import requests
import sys
import json
from datetime import datetime, timedelta

class TelemedicineAPITester:
    def __init__(self, base_url="https://consultation-fixes.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.appointment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_api(self):
        """Test basic API endpoint"""
        return self.run_test("Basic API Health Check", "GET", "", 200)

    def test_doctor_profile(self):
        """Test doctor profile endpoint"""
        return self.run_test("Doctor Profile", "GET", "doctor/profile", 200)

    def test_testimonials(self):
        """Test testimonials endpoint"""
        return self.run_test("Testimonials", "GET", "testimonials", 200)

    def test_blog_posts(self):
        """Test blog posts endpoint"""
        return self.run_test("Blog Posts", "GET", "blog", 200)

    def test_register_new_user(self):
        """Test user registration with new user"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"testuser_{timestamp}@test.com",
            "password": "testpass123",
            "full_name": f"Test User {timestamp}",
            "role": "patient",
            "phone": "9876543210"
        }
        
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'id' in response:
            self.new_user_email = test_user_data['email']
            self.new_user_password = test_user_data['password']
            print(f"   Created user: {self.new_user_email}")
            return True
        return False

    def test_login_existing_user(self):
        """Test login with existing test user"""
        login_data = {
            "email": "patient@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Login Existing User",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_auth_me(self):
        """Test authenticated user info"""
        if not self.token:
            print("❌ No token available for auth test")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_get_availability(self):
        """Test doctor availability"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        return self.run_test(
            "Doctor Availability",
            "GET",
            f"doctor/availability?date={tomorrow}",
            200
        )

    def test_create_appointment(self):
        """Test appointment creation"""
        if not self.token or not self.user_id:
            print("❌ No authentication for appointment test")
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "patient_id": self.user_id,
            "date": tomorrow,
            "time": "10:00",
            "consultation_type": "video",
            "reason": "Test consultation for API testing"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if success and 'id' in response:
            self.appointment_id = response['id']
            print(f"   Appointment ID: {self.appointment_id}")
            return True
        return False

    def test_get_appointments(self):
        """Test getting user appointments"""
        if not self.token:
            print("❌ No token for appointments test")
            return False
            
        return self.run_test("Get Appointments", "GET", "appointments", 200)

    def test_get_prescriptions(self):
        """Test getting user prescriptions"""
        if not self.token:
            print("❌ No token for prescriptions test")
            return False
            
        return self.run_test("Get Prescriptions", "GET", "prescriptions", 200)

    def test_chatbot(self):
        """Test chatbot endpoint"""
        chatbot_data = {
            "message": "What are the symptoms of fever?",
            "session_id": "test_session_123"
        }
        
        return self.run_test(
            "Chatbot Query",
            "POST",
            "chatbot",
            200,
            data=chatbot_data
        )

    def test_payment_flow(self):
        """Test complete payment flow in test mode"""
        if not self.appointment_id:
            print("❌ No appointment ID for payment test")
            return False
            
        # Test payment order creation
        order_data = {
            "amount": 50000,  # ₹500 in paise
            "currency": "INR",
            "appointment_id": self.appointment_id
        }
        
        success, response = self.run_test(
            "Create Payment Order",
            "POST",
            "payments/create-order",
            200,
            data=order_data
        )
        
        if not success:
            return False
            
        # Test payment verification
        payment_data = {
            "appointment_id": self.appointment_id,
            "payment_id": "pay_test_12345",
            "test_mode": True
        }
        
        success, response = self.run_test(
            "Verify Payment",
            "POST",
            "payments/verify",
            200,
            data=payment_data
        )
        
        if success:
            print("   ✅ Payment flow completed in test mode")
            return True
        return False

    def test_appointment_after_payment(self):
        """Test appointment status after payment"""
        if not self.appointment_id:
            print("❌ No appointment ID for status check")
            return False
            
        success, response = self.run_test(
            "Get Appointment After Payment",
            "GET",
            f"appointments/{self.appointment_id}",
            200
        )
        
        if success and response:
            status = response.get('status')
            payment_status = response.get('payment_status')
            test_mode = response.get('test_mode')
            
            print(f"   Status: {status}")
            print(f"   Payment Status: {payment_status}")
            print(f"   Test Mode: {test_mode}")
            
            if status == 'confirmed' and payment_status == 'completed':
                print("   ✅ Appointment confirmed with completed payment")
                return True
            else:
                print("   ❌ Appointment status not updated correctly")
        
        return False

def main():
    print("🏥 Starting Telemedicine API Tests")
    print("=" * 50)
    
    tester = TelemedicineAPITester()
    
    # Test public endpoints first
    print("\n📋 Testing Public Endpoints...")
    tester.test_basic_api()
    tester.test_doctor_profile()
    tester.test_testimonials()
    tester.test_blog_posts()
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    tester.test_register_new_user()
    
    if not tester.test_login_existing_user():
        print("❌ Login failed, stopping authenticated tests")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    tester.test_auth_me()
    
    # Test authenticated endpoints
    print("\n📅 Testing Appointment System...")
    tester.test_get_availability()
    tester.test_create_appointment()
    tester.test_get_appointments()
    
    print("\n💊 Testing Prescriptions...")
    tester.test_get_prescriptions()
    
    print("\n🤖 Testing Chatbot...")
    tester.test_chatbot()
    
    # Test payment flow
    print("\n💳 Testing Payment Flow...")
    if tester.appointment_id:
        tester.test_payment_flow()
        tester.test_appointment_after_payment()
    else:
        print("❌ Skipping payment tests - no appointment created")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())