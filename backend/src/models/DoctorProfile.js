import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      default: 'Dr. Annu Sharma',
    },
    specialization: {
      type: [String],
      default: ['General Physician', 'Gynecologist & Women\'s Health'],
    },
    qualifications: {
      type: String,
      default: 'MD (Ayurveda) | Postgraduate Physician | IMS-BHU Graduate',
    },
    experience_years: {
      type: Number,
      default: 8,
    },
    registration_number: {
      type: String,
      default: 'AYUR-BHU-2016-12345',
    },
    languages: {
      type: [String],
      default: ['Hindi', 'English'],
    },
    bio: {
      type: String,
      default: 'MD (Ayurveda Samhita & Siddhant) physician with advanced knowledge of classical Ayurvedic texts and principles. Trained at IMS-BHU, dedicated to delivering authentic, evidence-based, and patient-centered Ayurvedic care with focus on root-cause treatment and holistic healing.',
    },
    consultation_fee: {
      type: Number,
      default: 100,
    },
    image_url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f',
    },
    available_days: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    available_time: {
      type: String,
      default: '6:00pm to 8:00pm',
    },
  },
  {
    collection: 'doctor_profile',
  }
);

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
