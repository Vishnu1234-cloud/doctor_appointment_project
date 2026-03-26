import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';

const Section = ({ id, number, title, children, danger }) => {
  const [open, setOpen] = useState(true);
  return (
    <section id={`p${id}`} className="scroll-mt-20">
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

const List = ({ items }) => (
  <ul className="list-disc list-outside ml-5 space-y-1.5">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

const Sub = ({ children }) => (
  <p className="font-semibold text-gray-800 mt-3 mb-1 text-sm">{children}</p>
);

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

const toc = [
  [1,  'Who We Are'],
  [2,  'What Information We Collect'],
  [3,  'How We Use Your Information'],
  [4,  'Who We Share It With'],
  [5,  'Consultation Recording & Audit'],
  [6,  'Keeping Your Data Safe'],
  [7,  'SMS, Calls & DND'],
  [8,  'Cookies'],
  [9,  'How Long We Keep Your Data'],
  [10, 'Your Rights'],
  [11, 'Children & Minors'],
  [12, 'Third-Party Services'],
  [13, 'Changes to This Policy'],
  [14, 'Data Protection Officer'],
  [15, 'Contact Us'],
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState(1);

  useEffect(() => {
    const fn = () => {
      setShowTop(window.scrollY > 500);
      for (let i = toc.length; i >= 1; i--) {
        const el = document.getElementById(`p${toc[i - 1][0]}`);
        if (el && el.getBoundingClientRect().top < 100) {
          setActive(toc[i - 1][0]);
          break;
        }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const jump = id =>
    document.getElementById(`p${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
            </Button>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              Privacy Policy
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:flex lg:gap-12">

        {/* Sidebar TOC */}
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

        {/* Document */}
        <article className="flex-1 max-w-2xl">

          {/* Title block */}
          <div className="mb-10 pb-8 border-b border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
              Legal · Last updated February 2025
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm leading-7">
              Your privacy matters to us — especially when it comes to your health
              information. This policy explains what data HealthLine collects, why
              we collect it, and how we protect it. If you have questions, email us
              at{' '}
              <a href="mailto:privacy@healthline.com"
                className="text-blue-600 hover:underline">
                privacy@healthline.com
              </a>.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['IT Act 2000', 'SPI Rules 2011', 'DPDP Act 2023', 'Telemedicine Guidelines 2020'].map(t => (
                <span key={t}
                  className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Sections */}

          <Section id={1} number="1" title="Who We Are">
            <p>
              HealthLine Technologies Pvt. Ltd. ("HealthLine", "we", "us") operates the
              HealthLine platform — a telemedicine and doctor appointment service available
              on our website and mobile app.
            </p>
            <p>
              This Privacy Policy applies to everyone who uses HealthLine — patients,
              doctors, and anyone who visits our platform.
            </p>
          </Section>

          <Section id={2} number="2" title="What Information We Collect">
            <p>
              We only collect information that helps us provide you with a good
              healthcare experience. Here's what that includes:
            </p>

            <Sub>Information you give us directly</Sub>
            <List items={[
              'Your name, date of birth, gender, and photograph',
              'Email address, mobile number, and home address',
              'Medical history, symptoms, allergies, and current medications',
              'Messages, prescriptions, and files you share during consultations',
              'Payment details — processed by Razorpay, not stored on our servers',
              'Insurance information, if you provide it',
              'For doctors: your MCI or State Council registration details and identity proof',
            ]} />

            <Sub>Information we collect automatically</Sub>
            <List items={[
              'Device type, operating system, and browser',
              'Pages you visit, features you use, and your appointment history',
              'IP address, access times, and error logs',
              'Approximate location from your IP address (not GPS, unless you allow it)',
              'Cookie data — see Section 8 for details',
            ]} />

            <Sub>Information from third parties</Sub>
            <List items={[
              'Your name and email if you sign in with Google',
              'Transaction status from our payment gateway, Razorpay',
              'Clinical notes and prescriptions from your doctor after a consultation',
            ]} />
          </Section>

          <Section id={3} number="3" title="How We Use Your Information">
            <p>We use your information to run the platform and improve it over time.</p>

            <Sub>To provide our services</Sub>
            <List items={[
              'Creating and managing your account',
              'Booking appointments and sending reminders',
              'Running video and chat consultations',
              'Storing and sharing your prescriptions and medical records',
              'Processing payments and sending receipts',
              'Handling support queries and complaints',
              'Sending you OTPs and other essential account notifications',
            ]} />

            <Sub>To improve our platform</Sub>
            <List items={[
              'Analysing how people use HealthLine (in anonymised form)',
              'Building new features and fixing problems',
              'Detecting fraud and security issues',
              'Auditing consultations for quality — see Section 5',
              'Sharing anonymised data with research institutions for healthcare analytics',
            ]} />
          </Section>

          <Section id={4} number="4" title="Who We Share It With">
            <p>
              We do <strong>not sell</strong> your personal information. We share it only
              when we have to, and only with people who need it:
            </p>
            <List items={[
              'Your doctor — to deliver your consultation',
              'Razorpay, Google, Zoom, and our cloud providers — to run the platform, bound by confidentiality agreements',
              'Law enforcement or courts — only when required by law',
              'A new owner — if HealthLine is ever acquired, with the same privacy protections in place',
            ]} />
            <p>
              Any data we share for research is fully anonymised — it cannot be used
              to identify you.
            </p>
          </Section>

          <Section id={5} number="5" title="Consultation Recording & Audit" danger>
            <Note type="danger">
              <strong>Please read this carefully</strong> — it explains how your
              consultation records are stored and who can access them.
            </Note>
            <p>
              Every consultation on HealthLine — text messages, prescriptions, shared
              reports, and images — is stored on our secure servers. We need to do
              this to maintain your medical records and to deliver our service properly.
            </p>
            <p>
              <strong>Video calls:</strong> We may record video consultations for quality
              checks and to resolve disputes. You'll always be told before a session is
              recorded. If you'd rather not be recorded, let your doctor know — the
              consultation can still go ahead if your doctor agrees.
            </p>
            <p>
              <strong>Audits:</strong> Authorised HealthLine staff may review consultation
              records — including transcripts and shared files — to ensure our platform
              meets quality standards and complies with the Telemedicine Practice
              Guidelines, 2020. These reviews are carried out under strict
              confidentiality obligations.
            </p>
            <p>
              <strong>Phone calls:</strong> Calls made through the platform may be
              recorded. You'll hear an automated message at the start of the call.
              Continuing the call means you're okay with it being recorded.
            </p>
            <p>
              By using HealthLine, you're giving us consent to store and audit your
              consultation records as described above.
            </p>
          </Section>

          <Section id={6} number="6" title="Keeping Your Data Safe">
            <p>
              We take security seriously — especially for medical data. Here's what
              we do to protect your information:
            </p>
            <List items={[
              'All data is encrypted when it travels between your device and our servers (TLS/SSL) and when it\'s stored',
              'Access to your records is restricted — only authorised staff can see sensitive data',
              'We run regular security audits and vulnerability checks',
              'No HealthLine employee will ever know your plain-text password — it\'s stored in hashed form',
            ]} />
            <p>
              That said, no system is completely secure. We can't guarantee that
              something beyond our control — like your device being compromised —
              won't lead to unauthorised access. If we ever detect a breach that
              affects your data, we'll notify you and the relevant authorities as
              required under the DPDP Act, 2023.
            </p>
          </Section>

          <Section id={7} number="7" title="SMS, Calls & DND">
            <Note type="warning">
              By creating an account, you agree to receive essential messages from
              us even if your number is on the DND list.
            </Note>
            <p>
              We send you messages that are necessary for the service — OTPs,
              appointment reminders, prescription alerts, and payment receipts.
              These are transactional messages, not marketing, and we'll send them
              even if your number is registered on the DND (Do Not Disturb) list
              or the NCPR under TRAI regulations. We need to send these for
              the platform to work properly.
            </p>
            <p>
              If you don't want to receive promotional or marketing messages from us,
              you can opt out anytime from your account settings or by emailing{' '}
              <a href="mailto:support@healthline.com" className="text-blue-600 hover:underline">
                support@healthline.com
              </a>.
              Opting out of marketing won't affect your transactional messages.
            </p>
          </Section>

          <Section id={8} number="8" title="Cookies">
            <p>
              We use cookies — small files stored on your device — to keep you logged
              in, remember your preferences, and understand how people use our platform.
            </p>
            <List items={[
              'Essential cookies: needed for login, security, and core features. You can\'t turn these off and still use HealthLine.',
              'Analytics cookies: help us see which pages are popular and where things go wrong. All data is anonymised.',
              'Preference cookies: remember your settings like language and notifications.',
              'Third-party cookies: Razorpay and Google Analytics may set their own cookies, governed by their policies.',
            ]} />
            <p>
              You can manage or delete cookies through your browser settings. Turning
              off essential cookies will stop you from logging in. We never store
              medical data in cookies.
            </p>
          </Section>

          <Section id={9} number="9" title="How Long We Keep Your Data">
            <p>
              We keep your personal data for as long as your account is active and
              for as long as we need it to meet our legal obligations.
            </p>
            <p>
              Medical records and consultation data are kept for a minimum of
              <strong> 7 years</strong>, as required by Indian medical regulations.
              After that, we anonymise the data.
            </p>
            <p>
              If you ask us to delete your account, we'll delete or anonymise your
              personal data within 30 days — unless we're legally required to keep
              certain records.
            </p>
          </Section>

          <Section id={10} number="10" title="Your Rights">
            <p>
              Under the Digital Personal Data Protection Act, 2023, you have the
              right to:
            </p>
            <List items={[
              'See what personal data we hold about you',
              'Ask us to correct anything that\'s wrong or incomplete',
              'Ask us to delete your data (subject to legal requirements)',
              'Withdraw your consent to processing at any time',
              'File a complaint with our Data Protection Officer — or escalate to the Data Protection Board of India',
              'Nominate someone to act on your behalf if you\'re unable to',
            ]} />
            <p>
              To make any of these requests, email{' '}
              <a href="mailto:privacy@healthline.com" className="text-blue-600 hover:underline">
                privacy@healthline.com
              </a>.
              We respond within 30 days.
            </p>
          </Section>

          <Section id={11} number="11" title="Children & Minors">
            <p>
              HealthLine is not designed for anyone under 18. If you're booking
              for a child or family member, you — as the account holder — are
              responsible for their use of the platform and for accepting this
              policy on their behalf.
            </p>
            <p>
              If we ever find out we've collected data from a minor without
              appropriate consent, we'll delete it straight away.
            </p>
          </Section>

          <Section id={12} number="12" title="Third-Party Services">
            <p>
              HealthLine uses Razorpay for payments, Google for login, and Zoom
              for video calls. Each of these companies has its own privacy policy
              that governs how they handle your data when you use their services
              through HealthLine.
            </p>
            <p>
              We're not responsible for the privacy practices of third-party
              platforms — including any links we point to from our site.
            </p>
          </Section>

          <Section id={13} number="13" title="Changes to This Policy">
            <p>
              We'll update this policy when the law changes, when we add new features,
              or when we change how we handle data. If the change is significant,
              we'll give you at least <strong>15 days' notice</strong> by email or
              via a notice on the platform before the change takes effect.
            </p>
            <p>
              Continuing to use HealthLine after a change means you accept the
              updated policy.
            </p>
          </Section>

          <Section id={14} number="14" title="Data Protection Officer">
            <p>
              We've appointed a Data Protection Officer (DPO) as required by the
              DPDP Act, 2023. If you have a privacy concern or complaint, they're
              your first point of contact.
            </p>
            <div className="bg-gray-50 rounded-xl px-5 py-4 mt-2 text-sm space-y-2">
              <p><strong>Data Protection Officer:</strong> [To be designated]</p>
              <p><strong>Organisation:</strong> HealthLine Technologies Pvt. Ltd.</p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@healthline.com"
                  className="text-blue-600 hover:underline">
                  privacy@healthline.com
                </a>
              </p>
              <p>
                <strong>Grievance email:</strong>{' '}
                <a href="mailto:grievance@healthline.com"
                  className="text-blue-600 hover:underline">
                  grievance@healthline.com
                </a>
              </p>
              <p><strong>Response time:</strong> We acknowledge within 48 hours and aim to resolve within 30 days.</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              If your complaint isn't resolved to your satisfaction, you can escalate
              to the Data Protection Board of India under the DPDP Act, 2023.
            </p>
          </Section>

          <Section id={15} number="15" title="Contact Us">
            <p>
              Questions about this policy or about your data? Reach us here:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              {[
                { role: 'General support', email: 'support@healthline.com' },
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
              <a href="/terms" className="hover:text-blue-600 hover:underline">Terms & Conditions</a>
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