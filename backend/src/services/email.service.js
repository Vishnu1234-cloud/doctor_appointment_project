import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// ✅ Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── OTP Email ──────────────────────────────────────────
export const sendOtpEmail = async ({ email, otp, userName }) => {
  if (!config.email.enabled) return false;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `${otp} — Aapka HealthLine OTP`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">🏥 HealthLine</h1>
              <p style="margin:6px 0 0;color:#ccfbf1;font-size:13px;">Telemedicine Platform</p>
            </div>
            <div style="padding:40px;text-align:center;">
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                Namaste <strong>${userName || 'User'}</strong>,<br>
                Aapka OTP yeh hai:
              </p>
              <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:16px;padding:24px;margin-bottom:24px;">
                <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#0f766e;font-family:monospace;">
                  ${otp}
                </div>
              </div>
              <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">
                ⏱️ Ye OTP <strong>5 minutes</strong> mein expire ho jayega
              </p>
              <p style="color:#ef4444;font-size:13px;margin:0;">
                ⚠️ Kisi ke saath share mat karein
              </p>
            </div>
            <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 HealthLine Telemedicine</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('OTP email failed:', error);
    return false;
  }
};

// ── Appointment Confirmation Email ─────────────────────
export const sendAppointmentConfirmationEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  date,
  time,
  consultationType,
  appointmentId,
}) => {
  if (!config.email.enabled) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: patientEmail,
      subject: '✅ Appointment Confirmed — HealthLine',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

            <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">🏥 HealthLine</h1>
              <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Telemedicine Platform</p>
            </div>

            <div style="padding:40px;">
              <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
                <div style="font-size:48px;margin-bottom:8px;">✅</div>
                <h2 style="margin:0;color:#15803d;font-size:22px;">Appointment Confirmed!</h2>
              </div>

              <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                Namaste <strong>${patientName}</strong>,<br><br>
                Aapka appointment successfully book ho gaya hai. Neeche details hain:
              </p>

              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;color:#6b7280;font-size:14px;width:40%;">👨‍⚕️ Doctor</td>
                    <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">Dr. ${doctorName}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:10px 0;color:#6b7280;font-size:14px;">📅 Date</td>
                    <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${date}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:10px 0;color:#6b7280;font-size:14px;">⏰ Time</td>
                    <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${time}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:10px 0;color:#6b7280;font-size:14px;">💻 Type</td>
                    <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">
                      ${consultationType === 'video' ? '🎥 Video Call' : '💬 Chat'}
                    </td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:10px 0;color:#6b7280;font-size:14px;">🆔 ID</td>
                    <td style="padding:10px 0;color:#6b7280;font-size:12px;font-family:monospace;">${appointmentId}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align:center;margin-bottom:28px;">
                <a href="https://doctor-appointment-project-one.vercel.app/patient/dashboard"
                   style="background:linear-gradient(135deg,#0f766e,#14b8a6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:16px;font-weight:600;display:inline-block;">
                  Dashboard Dekhein →
                </a>
              </div>

              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px;">
                <p style="margin:0;color:#92400e;font-size:14px;">
                  ⏰ <strong>Reminder:</strong> Appointment se 10 minute pehle aapko ek reminder email aayega.
                </p>
              </div>
            </div>

            <div style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 HealthLine Telemedicine</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`Confirmation email sent to ${patientEmail}`);
  } catch (error) {
    logger.error('Appointment email failed:', error);
  }
};

// ── Appointment Reminder Email ──────────────────────────
export const sendAppointmentReminderEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  date,
  time,
  consultationType,
  appointmentId,
}) => {
  if (!config.email.enabled) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: patientEmail,
      subject: '⏰ Appointment Reminder — 10 Minutes Mein! — HealthLine',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#fffbeb;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

            <div style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">🏥 HealthLine</h1>
              <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">Appointment Reminder</p>
            </div>

            <div style="padding:40px;">
              <div style="background:#fffbeb;border:2px solid #fcd34d;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
                <div style="font-size:48px;margin-bottom:8px;">⏰</div>
                <h2 style="margin:0;color:#92400e;font-size:22px;">Sirf 10 Minute Baaki!</h2>
                <p style="margin:8px 0 0;color:#b45309;font-size:14px;">Aapka appointment shuru hone wala hai</p>
              </div>

              <p style="color:#374151;font-size:16px;">
                Namaste <strong>${patientName}</strong>,<br><br>
                Aapka appointment <strong>10 minute mein</strong> shuru hoga. Taiyar ho jaiye!
              </p>

              <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;width:40%;">👨‍⚕️ Doctor</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:14px;">Dr. ${doctorName}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">⏰ Time</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:14px;">${time}</td>
                  </tr>
                  <tr style="border-top:1px solid #e5e7eb;">
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">💻 Type</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:14px;">
                      ${consultationType === 'video' ? '🎥 Video Call' : '💬 Chat'}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align:center;">
                <a href="https://doctor-appointment-project-one.vercel.app/consultation/${appointmentId}"
                   style="background:linear-gradient(135deg,#d97706,#f59e0b);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:16px;font-weight:600;display:inline-block;">
                  Consultation Join Karein →
                </a>
              </div>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 HealthLine Telemedicine</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`Reminder email sent to ${patientEmail}`);
  } catch (error) {
    logger.error('Reminder email failed:', error);
  }
};

const emailService = {
  sendAppointmentConfirmationEmail,
  sendAppointmentEmail: sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendOtpEmail,
};

export default emailService;