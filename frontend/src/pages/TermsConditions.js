import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-accent/30">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary">Terms & Conditions</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-12 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using HealthLine telemedicine platform, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">2. Medical Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                HealthLine provides online medical consultation services. Our services include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Video and chat consultations with licensed medical professionals</li>
                <li>Digital prescriptions</li>
                <li>Medical history management</li>
                <li>Health information and guidance</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                As a user of HealthLine, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete medical information</li>
                <li>Keep your account credentials confidential</li>
                <li>Use the platform only for lawful purposes</li>
                <li>Respect the privacy and rights of healthcare professionals</li>
                <li>Attend scheduled appointments or cancel with appropriate notice</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">4. Appointments and Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                All appointments must be booked through our platform. Payment is required at the time of booking. Consultation fees are non-refundable except as stated in our Refund Policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">5. Medical Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                While our doctors provide professional medical advice, telemedicine consultations may not be appropriate for all medical conditions. In case of emergencies, please call emergency services or visit the nearest hospital immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">6. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to protecting your personal and medical information. Please review our Privacy Policy for detailed information about how we collect, use, and protect your data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                HealthLine and its healthcare providers shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
              </p>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated: February 2026
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For questions about these terms, please contact: support@healthline.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}