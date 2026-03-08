import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-accent/30">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary">Refund Policy</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="rounded-3xl border-none shadow-lg">
          <CardContent className="p-12 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">1. Cancellation and Refund Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                At HealthLine, we strive to provide the best telemedicine services. We understand that sometimes plans change, and we have established the following refund policy to ensure fairness for both patients and healthcare providers.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">2. Full Refund Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You are eligible for a full refund in the following cases:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Cancellation made at least 24 hours before scheduled appointment</li>
                <li>Doctor cancels the appointment</li>
                <li>Technical issues prevent the consultation from taking place</li>
                <li>Doctor fails to join the consultation within 15 minutes of scheduled time</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">3. Partial Refund (50%)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                A 50% refund will be provided if:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Cancellation made between 12-24 hours before scheduled appointment</li>
                <li>You request to reschedule after payment but before consultation</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">4. No Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                No refund will be provided if:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Cancellation made less than 12 hours before scheduled appointment</li>
                <li>Patient fails to join the consultation</li>
                <li>Consultation has already been completed</li>
                <li>Prescription has been provided</li>
                <li>Patient violates terms and conditions during consultation</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">5. Refund Process</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To request a refund:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Cancel your appointment through the patient dashboard</li>
                <li>Refund requests will be processed within 5-7 business days</li>
                <li>Refunds will be credited to the original payment method</li>
                <li>You will receive a confirmation email once refund is processed</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">6. Rescheduling Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may reschedule your appointment free of charge if done at least 24 hours in advance. Rescheduling within 24 hours may incur a 50% rebooking fee.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">7. Emergency Situations</h2>
              <p className="text-muted-foreground leading-relaxed">
                In case of medical emergencies that prevent you from attending your consultation, please contact our support team. We will review each case individually and may provide exceptions to this policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">8. Disputes</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any concerns about billing or refunds, please contact our support team at support@healthline.com. We are committed to resolving all disputes fairly and promptly.
              </p>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated: February 2026
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For refund-related questions, contact: billing@healthline.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}