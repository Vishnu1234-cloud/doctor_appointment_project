import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
      index: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    auth_provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    google_id: {
      type: String,
      sparse: true,
    },
    profile_image: String,
    otp_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    last_login: Date,
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users',
  }
);

// Indexes for performance
userSchema.index({ email: 1, role: 1 });
userSchema.index({ id: 1 }, { unique: true });
userSchema.index({ google_id: 1 }, { sparse: true }); // Faster OAuth lookup

const User = mongoose.model('User', userSchema);

export default User;
