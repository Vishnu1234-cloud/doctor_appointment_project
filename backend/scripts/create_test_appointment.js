// Script to create a test appointment for chat testing
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'healthline_db';

async function createTestAppointment() {
  try {
    await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');
    const usersCollection = db.collection('users');

    // Get patient user
    const patient = await usersCollection.findOne({ email: 'patient@test.com' });
    if (!patient) {
      console.error('Patient not found. Run seed_test_users.js first.');
      process.exit(1);
    }

    const appointmentId = 'test-chat-appointment-001';

    // Check if appointment already exists
    const existing = await appointmentsCollection.findOne({ id: appointmentId });
    if (existing) {
      console.log('Test appointment already exists:', appointmentId);
    } else {
      // Create a test appointment for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await appointmentsCollection.insertOne({
        id: appointmentId,
        patient_id: patient.id,
        date: today,
        time: '10:00',
        consultation_type: 'chat', // Chat-only mode for testing
        reason: 'Test consultation for chat functionality',
        status: 'confirmed',
        payment_status: 'completed',
        test_mode: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('Created test appointment:', appointmentId);
    }

    // Also create a video appointment for video testing
    const videoAppointmentId = 'test-video-appointment-001';
    const existingVideo = await appointmentsCollection.findOne({ id: videoAppointmentId });
    if (!existingVideo) {
      const today = new Date().toISOString().split('T')[0];
      await appointmentsCollection.insertOne({
        id: videoAppointmentId,
        patient_id: patient.id,
        date: today,
        time: '11:00',
        consultation_type: 'video',
        reason: 'Test consultation for video functionality',
        status: 'confirmed',
        payment_status: 'completed',
        test_mode: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('Created test video appointment:', videoAppointmentId);
    }

    console.log('\n=== TEST APPOINTMENTS ===');
    console.log('Chat Appointment ID:', appointmentId);
    console.log('Video Appointment ID:', videoAppointmentId);
    console.log('Patient ID:', patient.id);
    console.log('========================\n');

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAppointment();
