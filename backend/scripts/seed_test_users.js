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
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // ─── Passwords Hash ───────────────────────────────────────
    const doctorPassword  = await bcrypt.hash('Doctor@123', 12);
    const patientPassword = await bcrypt.hash('Patient@123', 12);
    const adminPassword   = await bcrypt.hash('Admin@123', 12);

    // ─────────────────────────────────────────────────────────
    // 1. DOCTOR
    // ─────────────────────────────────────────────────────────
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
          updated_at: new Date(),
        },
      },
      { upsert: false }
    );

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
      console.log('✅ Doctor user created');
    } else {
      console.log('✅ Doctor user updated');
    }

    // ─────────────────────────────────────────────────────────
    // 2. PATIENT
    // ─────────────────────────────────────────────────────────
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
          updated_at: new Date(),
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
        phone: '+919000000001',
        auth_provider: 'local',
        otp_verified: true,
        phone_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('✅ Patient user created');
    } else {
      console.log('✅ Patient user updated');
    }

    // ─────────────────────────────────────────────────────────
    // 3. ADMIN  ← NAYA ADD HUA
    // ─────────────────────────────────────────────────────────
    const adminResult = await usersCollection.updateOne(
      { email: 'admin@healthline.com' },
      {
        $set: {
          full_name: 'Super Admin',
          password: adminPassword,
          role: 'admin',
          phone: '+919999999999',
          is_active: true,
          otp_verified: true,
          phone_verified: true,
          updated_at: new Date(),
        },
      },
      { upsert: false }
    );

    if (adminResult.matchedCount === 0) {
      await usersCollection.insertOne({
        id: 'admin-001',
        email: 'admin@healthline.com',
        full_name: 'Super Admin',
        password: adminPassword,
        role: 'admin',
        phone: '+919999999999',
        auth_provider: 'local',
        otp_verified: true,
        phone_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user updated');
    }

    // ─────────────────────────────────────────────────────────
    // VERIFY — Sab users check karo
    // ─────────────────────────────────────────────────────────
    const doctor  = await usersCollection.findOne({ email: 'doctor@healthline.com' });
    const patient = await usersCollection.findOne({ email: 'patient@test.com' });
    const admin   = await usersCollection.findOne({ email: 'admin@healthline.com' });

    console.log('\n========= TEST CREDENTIALS =========');
    console.log('\n🩺 Doctor:');
    console.log('   Email   :', doctor.email);
    console.log('   Role    :', doctor.role);
    console.log('   Password: Doctor@123');

    console.log('\n👤 Patient:');
    console.log('   Email   :', patient.email);
    console.log('   Role    :', patient.role);
    console.log('   Password: Patient@123');

    console.log('\n🔐 Admin:');
    console.log('   Email   :', admin.email);
    console.log('   Role    :', admin.role);
    console.log('   Password: Admin@123');

    console.log('\n=====================================\n');

    await mongoose.disconnect();
    console.log('✅ Database seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedTestUsers();