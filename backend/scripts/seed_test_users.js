// Script to seed/update test users with known credentials
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'healthline_db';

async function seedTestUsers() {
  try {
    await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Test credentials
    const doctorPassword = await bcrypt.hash('Doctor@123', 12);
    const patientPassword = await bcrypt.hash('Patient@123', 12);

    // Update or create doctor user
    const doctorResult = await usersCollection.updateOne(
      { email: 'doctor@healthline.com' },
      {
        $set: {
          full_name: 'Dr. Annu Sharma',
          password: doctorPassword,
          role: 'doctor',
          phone: '+919876543210',
          is_active: true,
          otp_verified: true,
          phone_verified: true,
        },
      },
      { upsert: false }
    );

    // If doctor doesn't exist, create it
    if (doctorResult.matchedCount === 0) {
      await usersCollection.insertOne({
        id: 'doctor-001',
        email: 'doctor@healthline.com',
        full_name: 'Dr. Annu Sharma',
        password: doctorPassword,
        role: 'doctor',
        phone: '+919876543210',
        auth_provider: 'local',
        otp_verified: true,
        phone_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('Doctor user created');
    } else {
      console.log('Doctor user updated');
    }

    // Update or create patient user
    const patientResult = await usersCollection.updateOne(
      { email: 'patient@test.com' },
      {
        $set: {
          full_name: 'Test Patient',
          password: patientPassword,
          role: 'patient',
          is_active: true,
          otp_verified: true,
          phone_verified: true,
        },
      },
      { upsert: false }
    );

    if (patientResult.matchedCount === 0) {
      await usersCollection.insertOne({
        id: 'patient-001',
        email: 'patient@test.com',
        full_name: 'Test Patient',
        password: patientPassword,
        role: 'patient',
        auth_provider: 'local',
        otp_verified: true,
        phone_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('Patient user created');
    } else {
      console.log('Patient user updated');
    }

    // Verify the updates
    const doctor = await usersCollection.findOne({ email: 'doctor@healthline.com' });
    const patient = await usersCollection.findOne({ email: 'patient@test.com' });

    console.log('\n=== TEST CREDENTIALS ===');
    console.log('Doctor:');
    console.log('  Email:', doctor.email);
    console.log('  Role:', doctor.role);
    console.log('  Password: Doctor@123');
    console.log('\nPatient:');
    console.log('  Email:', patient.email);
    console.log('  Role:', patient.role);
    console.log('  Password: Patient@123');
    console.log('========================\n');

    await mongoose.disconnect();
    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedTestUsers();
