import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'healthline_db';

console.log('Connecting to MongoDB...');
await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
console.log('✅ Connected to MongoDB');

// User Schema
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    password: { type: String },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone: String,
    auth_provider: { type: String, default: 'local' },
    otp_verified: { type: Boolean, default: true },
    phone_verified: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const User = mongoose.model('User', userSchema);

// Test users
const testUsers = [
  {
    email: 'patient@test.com',
    full_name: 'Test Patient',
    password: 'test123',
    role: 'patient',
    phone: '+919876543210',
  },
  {
    email: 'doctor@healthline.com',
    full_name: 'Dr. Annu Sharma',
    password: 'doctor123',
    role: 'doctor',
    phone: '+919876543211',
  },
  {
    email: 'admin@healthline.com',
    full_name: 'Admin User',
    password: 'admin123',
    role: 'admin',
    phone: '+919876543212',
  },
];

console.log('\n🌱 Seeding test users...\n');

for (const userData of testUsers) {
  try {
    // Check if user already exists
    const existing = await User.findOne({ email: userData.email });
    
    if (existing) {
      console.log(`⏭️  User already exists: ${userData.email}`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    await User.create({
      id: uuidv4(),
      email: userData.email,
      full_name: userData.full_name,
      password: hashedPassword,
      role: userData.role,
      phone: userData.phone,
      auth_provider: 'local',
      otp_verified: true,
      phone_verified: true,
      is_active: true,
    });

    console.log(`✅ Created ${userData.role}: ${userData.email}`);
  } catch (error) {
    console.error(`❌ Error creating ${userData.email}:`, error.message);
  }
}

// Seed Doctor Profile
const doctorProfileSchema = new mongoose.Schema({
  full_name: { type: String, default: 'Dr. Annu Sharma' },
  specialization: { type: [String], default: ['General Physician', "Gynecologist & Women's Health"] },
  qualifications: { type: String, default: 'MD (Ayurveda) | Postgraduate Physician | IMS-BHU Graduate' },
  experience_years: { type: Number, default: 8 },
  registration_number: { type: String, default: 'AYUR-BHU-2016-12345' },
  languages: { type: [String], default: ['Hindi', 'English'] },
  bio: { type: String, default: 'MD (Ayurveda Samhita & Siddhant) physician with advanced knowledge of classical Ayurvedic texts and principles. Trained at IMS-BHU, dedicated to delivering authentic, evidence-based, and patient-centered Ayurvedic care with focus on root-cause treatment and holistic healing.' },
  consultation_fee: { type: Number, default: 100 },
  image_url: { type: String, default: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f' },
  available_days: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  available_time: { type: String, default: '6:00pm to 8:00pm' },
});

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

console.log('\n👨‍⚕️ Seeding doctor profile...\n');

try {
  const existingProfile = await DoctorProfile.findOne();
  if (!existingProfile) {
    await DoctorProfile.create({});
    console.log('✅ Doctor profile created: Dr. Annu Sharma');
  } else {
    console.log('⏭️  Doctor profile already exists');
  }
} catch (error) {
  console.error('❌ Error creating doctor profile:', error.message);
}

console.log('\n✅ Seeding complete!\n');
console.log('📋 Test Credentials:\n');
console.log('Patient:');
console.log('  Email: patient@test.com');
console.log('  Password: test123\n');
console.log('Doctor:');
console.log('  Email: doctor@healthline.com');
console.log('  Password: doctor123\n');
console.log('Admin:');
console.log('  Email: admin@healthline.com');
console.log('  Password: admin123\n');

await mongoose.connection.close();
console.log('✅ MongoDB connection closed');
process.exit(0);
