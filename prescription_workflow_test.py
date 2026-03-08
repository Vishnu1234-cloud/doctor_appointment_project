import requests
import sys
import json
from datetime import datetime, timedelta

class PrescriptionWorkflowTester:
    def __init__(self, base_url="https://consultation-fixes.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.patient_token = None
        self.doctor_token = None
        self.patient_id = None
        self.doctor_id = None
        self.appointment_id = None
        self.prescription_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

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

    def login_patient(self):
        """Login as patient"""
        login_data = {
            "email": "patient@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Login Patient",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.patient_token = response['token']
            self.patient_id = response['user']['id']
            print(f"   Patient ID: {self.patient_id}")
            return True
        return False

    def login_doctor(self):
        """Login as doctor"""
        login_data = {
            "email": "doctor@test.com",
            "password": "doctor123"
        }
        
        success, response = self.run_test(
            "Login Doctor",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.doctor_token = response['token']
            self.doctor_id = response['user']['id']
            print(f"   Doctor ID: {self.doctor_id}")
            return True
        return False

    def create_test_appointment(self):
        """Create a test appointment for prescription workflow"""
        if not self.patient_token or not self.patient_id:
            print("❌ No patient authentication")
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "patient_id": self.patient_id,
            "date": tomorrow,
            "time": "14:00",
            "consultation_type": "video",
            "reason": "Common cold with mild fever - prescription test"
        }
        
        success, response = self.run_test(
            "Create Test Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data,
            token=self.patient_token
        )
        
        if success and 'id' in response:
            self.appointment_id = response['id']
            print(f"   Appointment ID: {self.appointment_id}")
            return True
        return False

    def confirm_appointment(self):
        """Confirm appointment by completing payment"""
        if not self.appointment_id:
            print("❌ No appointment ID")
            return False
            
        # Create payment order
        order_data = {
            "amount": 50000,
            "currency": "INR",
            "appointment_id": self.appointment_id
        }
        
        success, response = self.run_test(
            "Create Payment Order for Appointment",
            "POST",
            "payments/create-order",
            200,
            data=order_data,
            token=self.patient_token
        )
        
        if not success:
            return False
            
        # Verify payment
        payment_data = {
            "appointment_id": self.appointment_id,
            "payment_id": "pay_test_prescription",
            "test_mode": True
        }
        
        success, response = self.run_test(
            "Verify Payment for Appointment",
            "POST",
            "payments/verify",
            200,
            data=payment_data,
            token=self.patient_token
        )
        
        return success

    def doctor_create_prescription(self):
        """Doctor creates prescription for the appointment"""
        if not self.doctor_token or not self.appointment_id:
            print("❌ No doctor authentication or appointment ID")
            return False
            
        prescription_data = {
            "appointment_id": self.appointment_id,
            "patient_id": self.patient_id,
            "diagnosis": "Common cold with mild fever",
            "medicines": [
                {
                    "name": "Paracetamol",
                    "dosage": "500mg",
                    "duration": "3 days",
                    "instructions": "After meals, twice daily"
                },
                {
                    "name": "Cetirizine",
                    "dosage": "10mg",
                    "duration": "5 days",
                    "instructions": "Before bedtime"
                }
            ],
            "notes": "Rest recommended. Drink plenty of fluids."
        }
        
        success, response = self.run_test(
            "Doctor Create Prescription",
            "POST",
            "prescriptions",
            200,
            data=prescription_data,
            token=self.doctor_token
        )
        
        if success and 'id' in response:
            self.prescription_id = response['id']
            print(f"   Prescription ID: {self.prescription_id}")
            print(f"   Diagnosis: {response.get('diagnosis')}")
            print(f"   Medicines: {len(response.get('medicines', []))}")
            print(f"   Notes: {response.get('notes')}")
            return True
        return False

    def patient_view_prescriptions(self):
        """Patient views their prescriptions"""
        if not self.patient_token:
            print("❌ No patient authentication")
            return False
            
        success, response = self.run_test(
            "Patient View Prescriptions",
            "GET",
            "prescriptions",
            200,
            token=self.patient_token
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} prescriptions")
            
            # Find our test prescription
            test_prescription = None
            for presc in response:
                if presc.get('id') == self.prescription_id:
                    test_prescription = presc
                    break
            
            if test_prescription:
                print(f"   ✅ Test prescription found:")
                print(f"      ID: {test_prescription.get('id')}")
                print(f"      Diagnosis: {test_prescription.get('diagnosis')}")
                print(f"      Medicines: {len(test_prescription.get('medicines', []))}")
                print(f"      Notes: {test_prescription.get('notes')}")
                
                # Verify prescription details
                medicines = test_prescription.get('medicines', [])
                if len(medicines) == 2:
                    med1 = medicines[0]
                    med2 = medicines[1]
                    print(f"      Medicine 1: {med1.get('name')} - {med1.get('dosage')} - {med1.get('instructions')}")
                    print(f"      Medicine 2: {med2.get('name')} - {med2.get('dosage')} - {med2.get('instructions')}")
                    return True
                else:
                    print(f"   ❌ Expected 2 medicines, found {len(medicines)}")
            else:
                print(f"   ❌ Test prescription not found in patient's prescriptions")
        
        return False

    def test_chat_messages(self):
        """Test chat functionality for the appointment"""
        if not self.appointment_id or not self.patient_token:
            print("❌ No appointment ID or patient token for chat test")
            return False
            
        # Patient sends a message
        success, response = self.run_test(
            "Patient Send Chat Message",
            "POST",
            f"chat/messages?appointment_id={self.appointment_id}&message=Hello doctor, I have received the prescription",
            200,
            token=self.patient_token
        )
        
        if not success:
            return False
            
        # Get chat messages
        success, response = self.run_test(
            "Get Chat Messages",
            "GET",
            f"chat/messages/{self.appointment_id}",
            200,
            token=self.patient_token
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} chat messages")
            if len(response) > 0:
                latest_msg = response[-1]
                print(f"   Latest message: {latest_msg.get('message')}")
                print(f"   Sender role: {latest_msg.get('sender_role')}")
                return True
        
        return False

def main():
    print("💊 Starting Prescription Workflow Tests")
    print("=" * 60)
    
    tester = PrescriptionWorkflowTester()
    
    # Phase 1: Authentication
    print("\n🔐 Phase 1: Authentication")
    if not tester.login_patient():
        print("❌ Patient login failed, stopping tests")
        return 1
        
    if not tester.login_doctor():
        print("❌ Doctor login failed, stopping tests")
        return 1
    
    # Phase 2: Setup appointment
    print("\n📅 Phase 2: Setup Test Appointment")
    if not tester.create_test_appointment():
        print("❌ Appointment creation failed, stopping tests")
        return 1
        
    if not tester.confirm_appointment():
        print("❌ Appointment confirmation failed, stopping tests")
        return 1
    
    # Phase 3: Doctor creates prescription
    print("\n👨‍⚕️ Phase 3: Doctor Creates Prescription")
    if not tester.doctor_create_prescription():
        print("❌ Prescription creation failed, stopping tests")
        return 1
    
    # Phase 4: Patient views prescription
    print("\n👤 Phase 4: Patient Views Prescription")
    if not tester.patient_view_prescriptions():
        print("❌ Patient prescription viewing failed")
        return 1
    
    # Phase 5: Test chat functionality
    print("\n💬 Phase 5: Test Chat Messages")
    tester.test_chat_messages()
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All prescription workflow tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())