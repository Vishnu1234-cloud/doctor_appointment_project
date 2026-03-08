import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-accent/30">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-12 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect the following types of information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Personal information (name, email, phone number)</li>
                <li>Medical history and health information</li>
                <li>Consultation records and prescriptions</li>
                <li>Payment information (processed securely through our payment partners)</li>
                <li>Usage data and platform interactions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide medical consultation services</li>
                <li>Maintain your medical records securely</li>
                <li>Process payments and send appointment confirmations</li>
                <li>Improve our services and user experience</li>
                <li>Communicate important updates about your health care</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal and medical information. All data is encrypted in transit and at rest. Access to your medical records is restricted to authorized healthcare professionals only.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>With healthcare providers for consultation purposes</li>
                <li>With payment processors for transaction processing</li>
                <li>When required by law or legal proceedings</li>
                <li>With your explicit consent</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal and medical information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Download your medical records</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your medical records for the period required by law and medical best practices. You may request deletion of your account, though we may retain certain information as required by legal obligations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to improve your experience on our platform. You can control cookie preferences through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for children under 18 without parental consent. We do not knowingly collect information from children.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">9. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notification.
              </p>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated: February 2026
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For privacy-related questions, contact: privacy@healthline.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}