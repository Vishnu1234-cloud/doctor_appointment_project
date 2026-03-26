import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';

// Single collapsible section — clean, no frills
const Section = ({ id, number, title, children, danger }) => {
  const [open, setOpen] = useState(true);
  return (
    <section id={`s${id}`} className="scroll-mt-20">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between py-4 border-b text-left group
          ${danger ? 'border-red-200' : 'border-gray-200'}`}
      >
        <h2 className={`text-base font-semibold group-hover:text-blue-600 transition-colors
          ${danger ? 'text-red-700' : 'text-gray-900'}`}>
          {number}.&nbsp;&nbsp;{title}
        </h2>
        {open
          ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="py-5 text-gray-600 text-sm leading-7 space-y-4">
          {children}
        </div>
      )}
    </section>
  );
};

// Simple bullet — no fancy dots
const List = ({ items }) => (
  <ul className="list-disc list-outside ml-5 space-y-1.5">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

// Highlighted note — like real legal docs use
const Note = ({ children, type = 'info' }) => {
  const styles = {
    info:    'bg-blue-50   border-blue-200  text-blue-900',
    warning: 'bg-amber-50  border-amber-200 text-amber-900',
    danger:  'bg-red-50    border-red-200   text-red-900',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
};

// TOC items
const toc = [
  [1,  'About HealthLine'],
  [2,  'Who These Terms Apply To'],
  [3,  'Using Our Platform'],
  [4,  'Your Account'],
  [5,  'Booking Appointments'],
  [6,  'Online Consultations'],
  [7,  'For Patients'],
  [8,  'For Doctors'],
  [9,  'Prescriptions'],
  [10, 'Payments & Refunds'],
  [11, 'Your Data & Privacy'],
  [12, 'Medical Disclaimer'],
  [13, 'What We Are Not Responsible For'],
  [14, 'Intellectual Property'],
  [15, 'Ending Your Account'],
  [16, 'Disputes & Governing Law'],
  [17, 'Contact Us'],
];

export default function TermsConditions() {
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState(1);

  useEffect(() => {
    const fn = () => {
      setShowTop(window.scrollY > 500);
      for (let i = toc.length; i >= 1; i--) {
        const el = document.getElementById(`s${toc[i-1][0]}`);
        if (el && el.getBoundingClientRect().top < 100) {
          setActive(toc[i-1][0]);
          break;
        }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const jump = id => document.getElementById(`s${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
            </Button>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              Terms &amp; Conditions
            </span>
          </div>
          <button
            onClick={() => window.print()}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors hidden sm:block"
          >
            Print / Save PDF
          </button>
        </div>
      </header>

      {/* ── Emergency strip ── */}
      <div className="bg-red-600 text-white text-xs text-center py-2 px-4">
        Not for emergencies — call <strong>112</strong> or <strong>108</strong> if you need urgent medical help.
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:flex lg:gap-12">

        {/* ── Sidebar TOC ── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              On this page
            </p>
            <nav className="space-y-0.5">
              {toc.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => jump(id)}
                  className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors
                    ${active === id
                      ? 'text-blue-600 font-semibold bg-blue-50'
                      : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Document ── */}
        <article className="flex-1 max-w-2xl">

          {/* Title block */}
          <div className="mb-10 pb-8 border-b border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
              Legal · Last updated February 2025
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Terms &amp; Conditions
            </h1>
            <p className="text-gray-500 text-sm leading-7">
              These are the rules for using HealthLine — our telemedicine and doctor
              appointment platform. Please read them before you book a consultation
              or create an account. If you have any questions, email us at{' '}
              <a href="mailto:support@healthline.com"
                className="text-blue-600 hover:underline">
                support@healthline.com
              </a>.
            </p>
            {/* Compliance chips — subtle */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['IT Act 2000', 'DPDP Act 2023', 'Telemedicine Guidelines 2020', 'MCI Registered'].map(t => (
                <span key={t}
                  className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Sections ── */}

          <Section id={1} number="1" title="About HealthLine">
            <p>
              HealthLine is a technology platform that connects patients with independent,
              licensed doctors across India. We are not a hospital, clinic, or healthcare
              provider — we are the platform that makes it easier for you to find and
              consult a doctor online.
            </p>
            <p>
              All medical services on HealthLine are provided by independent doctors who
              have their own professional responsibilities. HealthLine facilitates the
              connection — the doctor is responsible for the medical care they give you.
            </p>
            <Note type="info">
              Think of HealthLine like a marketplace. We provide the platform;
              the doctors provide the medicine.
            </Note>
          </Section>

          <Section id={2} number="2" title="Who These Terms Apply To">
            <p>
              These Terms apply to everyone who uses HealthLine — patients looking for
              doctors, doctors who list their practice on our platform, and anyone who
              visits our website or app.
            </p>
            <p>
              By creating an account or booking a consultation, you're agreeing to these
              Terms. If you don't agree, please don't use the platform.
            </p>
            <p>
              You must be at least <strong>18 years old</strong> to create an account.
              If you're booking on behalf of a child or family member, you're responsible
              for their use of the platform and for accepting these Terms on their behalf.
            </p>
          </Section>

          <Section id={3} number="3" title="Using Our Platform">
            <p>You agree to use HealthLine honestly and lawfully. Specifically, you agree not to:</p>
            <List items={[
              'Provide false or misleading information about yourself or your medical condition',
              'Pretend to be someone else or create a fake account',
              'Use the platform to harass, threaten, or abuse doctors or other users',
              'Try to access parts of the platform you\'re not supposed to — including hacking or scraping',
              'Copy, reproduce, or resell any part of our platform without written permission',
              'Use automated tools to interact with or extract data from HealthLine',
              'Attempt to bypass our payment system or file fraudulent refund claims',
            ]} />
            <p>
              We can suspend or remove your account if we find you've violated these rules.
            </p>
          </Section>

          <Section id={4} number="4" title="Your Account">
            <p>
              When you register, you're responsible for keeping your login details safe.
              Don't share your password with anyone. If you think someone else has accessed
              your account, tell us at{' '}
              <a href="mailto:support@healthline.com" className="text-blue-600 hover:underline">
                support@healthline.com
              </a>{' '}
              straight away.
            </p>
            <p>
              Doctors need to verify their MCI or State Council registration before their
              profile goes live. We do our best to check credentials, but we rely on the
              accuracy of what doctors submit.
            </p>
          </Section>

          <Section id={5} number="5" title="Booking Appointments">
            <p>
              You can book appointments through HealthLine with any doctor listed on our
              platform. Here's what you need to know about cancellations and no-shows:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border border-gray-200">When you cancel</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border border-gray-200">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2.5 border border-gray-200">More than 24 hours before</td>
                    <td className="px-4 py-2.5 border border-gray-200 text-green-700 font-medium">Full refund</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 border border-gray-200">6–24 hours before</td>
                    <td className="px-4 py-2.5 border border-gray-200 text-amber-700 font-medium">50% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 border border-gray-200">Under 6 hours before</td>
                    <td className="px-4 py-2.5 border border-gray-200 text-red-600 font-medium">No refund</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 border border-gray-200">You don't show up (no cancellation)</td>
                    <td className="px-4 py-2.5 border border-gray-200 text-red-600 font-medium">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              If a doctor cancels on you, you'll get a full refund and the option to
              reschedule — no questions asked.
            </p>
            <p>
              After <strong>3 no-shows</strong> without cancelling, we may temporarily
              limit your ability to book new appointments for up to 4 months.
            </p>
          </Section>

          <Section id={6} number="6" title="Online Consultations">
            <p>
              All video and chat consultations on HealthLine follow the{' '}
              <strong>Telemedicine Practice Guidelines, 2020</strong> issued by the
              Medical Council of India.
            </p>
            <p>
              Online consultations work well for many conditions, but not all. Your doctor
              may ask you to come in person if your condition needs it. Please follow
              their advice.
            </p>
            <p>
              Don't record your consultation without the doctor's explicit consent.
              Your consultation is private and confidential — subject to applicable law.
            </p>
            <Note type="warning">
              If your internet drops during a consultation, we're not responsible for
              the interruption. Make sure you have a stable connection before you start.
            </Note>
          </Section>

          <Section id={7} number="7" title="For Patients">
            <p>
              To get the best care from your doctor, please be honest about your medical
              history, symptoms, and any medications you're taking. Your doctor can only
              help you with the information you give them.
            </p>
            <p>
              HealthLine is not responsible for what happens if you give your doctor
              incomplete or inaccurate information.
            </p>
            <p>
              Telemedicine is not a replacement for emergency care or certain specialist
              treatments. If your doctor says you need to see someone in person, please do.
            </p>
          </Section>

          <Section id={8} number="8" title="For Doctors">
            <p>
              By listing your practice on HealthLine, you confirm that you hold a valid,
              current registration with the Medical Council of India or your State
              Medical Council, and that you'll keep it current.
            </p>
            <p>
              You're an independent professional — HealthLine is not your employer.
              You're responsible for the medical advice and treatment you provide to
              patients through our platform, and you should have appropriate professional
              indemnity insurance in place.
            </p>
            <p>
              You must not prescribe Schedule X drugs via telemedicine, in line with the
              Telemedicine Practice Guidelines, 2020. You must not take patients off the
              platform to avoid our fee structure.
            </p>
          </Section>

          <Section id={9} number="9" title="Prescriptions">
            <p>
              Prescriptions on HealthLine are issued by the doctor, not by us. HealthLine
              does not write, approve, or alter any prescription — that's entirely the
              doctor's professional responsibility.
            </p>
            <p>
              Forging, altering, or misusing a digital prescription is a criminal offence
              under Indian law. We report any suspected misuse to the relevant authorities.
            </p>
          </Section>

          <Section id={10} number="10" title="Payments & Refunds">
            <p>
              Consultation fees are set by each doctor and are shown clearly before you
              book. We charge a small platform fee on top — you'll see this before you pay.
            </p>
            <p>
              Payments are processed securely by{' '}
              <strong>Razorpay</strong>, a certified payment gateway. We don't store your
              card details on our servers.
            </p>
            <p>
              Refunds for eligible cancellations are processed within{' '}
              <strong>5–7 business days</strong> to your original payment method. Our
              platform fee is non-refundable.
            </p>
          </Section>

          <Section id={11} number="11" title="Your Data & Privacy">
            <p>
              We take your privacy seriously — especially when it comes to medical
              information. Our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>{' '}
              explains in full how we collect, use, and protect your data.
            </p>
            <p>
              We comply with the{' '}
              <strong>Digital Personal Data Protection Act, 2023</strong> and all
              applicable Indian data protection law. Your medical records are yours —
              we store them securely and share them only with your doctor and only for
              your care.
            </p>
            <p>
              Consultation records may be retained for audit or quality purposes. We will
              always tell you before recording a video call.
            </p>
          </Section>

          <Section id={12} number="12" title="Medical Disclaimer" danger>
            <Note type="danger">
              <strong>HealthLine does not provide medical advice.</strong> We are a
              technology platform, not a hospital or clinic. The doctors on our
              platform are independent professionals.
            </Note>
            <p>
              Nothing on HealthLine — including information, articles, or advice from
              doctors — should be treated as a substitute for an in-person medical
              evaluation when one is needed.
            </p>
            <p>
              <strong>
                If you are in a medical emergency, please call 112 or 108, or go to
                your nearest hospital immediately. Do not wait for a consultation
                on this platform.
              </strong>
            </p>
          </Section>

          <Section id={13} number="13" title="What We Are Not Responsible For">
            <p>HealthLine is not responsible for:</p>
            <List items={[
              'The medical advice, diagnosis, or treatment provided by any doctor on our platform',
              'Any outcome — positive or negative — from a consultation',
              'A doctor cancelling, being late, or being unavailable',
              'Technical issues like internet dropouts during a video call',
              'The accuracy of information doctors provide in their profiles',
              'Any loss of data or service interruption caused by factors outside our control',
            ]} />
            <p>
              To the extent permitted by Indian law, our total liability to you for any
              claim is limited to the amount you paid us in the 3 months before the
              claim arose.
            </p>
          </Section>

          <Section id={14} number="14" title="Intellectual Property">
            <p>
              Everything you see on HealthLine — our name, logo, design, code, and
              content — belongs to us and is protected by Indian copyright and trademark law.
            </p>
            <p>
              You can use HealthLine as a patient or doctor. You can't copy, reproduce,
              or commercially use anything from our platform without our written permission.
            </p>
          </Section>

          <Section id={15} number="15" title="Ending Your Account">
            <p>
              You can close your account any time by emailing{' '}
              <a href="mailto:support@healthline.com" className="text-blue-600 hover:underline">
                support@healthline.com
              </a>.
              We'll delete or anonymise your data within 30 days, except where we're
              required to keep it by law.
            </p>
            <p>
              We may suspend or close your account without notice if we find serious
              violations of these Terms — including fraud, impersonation, or abuse
              of our platform or staff.
            </p>
          </Section>

          <Section id={16} number="16" title="Disputes & Governing Law">
            <p>
              These Terms are governed by the laws of India. If you have a complaint,
              please contact us first — we'd like the opportunity to resolve it directly.
            </p>
            <p>
              If we can't resolve it within 30 days, disputes will go to binding
              arbitration under the Arbitration and Conciliation Act, 1996, in
              New Delhi. The courts of New Delhi have exclusive jurisdiction for
              any matters not covered by arbitration.
            </p>
          </Section>

          <Section id={17} number="17" title="Contact Us">
            <p>
              If you have questions about these Terms, or a complaint about how we've
              handled something, please reach out:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {[
                { role: 'General questions', email: 'support@healthline.com' },
                { role: 'Privacy concerns', email: 'privacy@healthline.com' },
                { role: 'Legal & compliance', email: 'legal@healthline.com' },
                { role: 'Grievance Officer', email: 'grievance@healthline.com' },
              ].map(({ role, email }) => (
                <div key={email} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">{role}</p>
                  <a href={`mailto:${email}`}
                    className="text-sm font-medium text-blue-600 hover:underline">
                    {email}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              We aim to respond within 2 business days.
            </p>
          </Section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
              <span>HealthLine Technologies Pvt. Ltd.</span>
              <span>Version 2.0 — February 2025</span>
              <a href="/privacy" className="hover:text-blue-600 hover:underline">Privacy Policy</a>
              <a href="/contact" className="hover:text-blue-600 hover:underline">Contact</a>
            </div>
          </div>

        </article>
      </div>

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-gray-900 text-white p-2.5 rounded-full
            shadow-md hover:bg-gray-700 transition-colors z-30"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </div>
  );
}