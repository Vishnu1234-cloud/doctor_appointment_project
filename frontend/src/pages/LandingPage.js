import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Video, MessageCircle, FileText, Clock, Award, Shield, Star, Calendar, Heart, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchDoctorProfile();
    fetchTestimonials();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await axios.get(`${API}/doctor/profile`);
      setDoctorProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API}/testimonials`);
      setTestimonials(response.data.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    }
  };

  const handleBookConsultation = () => {
    if (user) {
      navigate('/patient/book-appointment');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="logo">HealthLine</h1>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href="#about" className="text-muted-foreground hover:text-primary" data-testid="nav-about">About</a>
              <a href="#services" className="text-muted-foreground hover:text-primary" data-testid="nav-services">Services</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-primary" data-testid="nav-testimonials">Testimonials</a>
              <a href="/blog" className="text-muted-foreground hover:text-primary" data-testid="nav-blog">Blog</a>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex gap-3">
              {user ? (
                <Button
                  onClick={() => navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}
                  variant="outline"
                  className="rounded-full"
                  data-testid="dashboard-button"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full" data-testid="login-button">
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')} className="rounded-full" data-testid="register-button">
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-2 border-t mt-3">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-muted-foreground hover:text-primary py-2 px-2">About</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-muted-foreground hover:text-primary py-2 px-2">Services</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-muted-foreground hover:text-primary py-2 px-2">Testimonials</a>
              <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="block text-muted-foreground hover:text-primary py-2 px-2">Blog</a>
              <div className="flex gap-3 pt-3">
                {user ? (
                  <Button
                    onClick={() => navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}
                    variant="outline"
                    className="rounded-full w-full"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full flex-1">Login</Button>
                    <Button onClick={() => navigate('/register')} className="rounded-full flex-1">Get Started</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20 md:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight mb-6" data-testid="hero-title">
                Your Health, <br />Our Priority
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8" data-testid="hero-description">
                Expert online medical consultations from the comfort of your home. Specialized in General Health and Women's Wellness.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleBookConsultation} size="lg" className="rounded-full h-12 px-8" data-testid="hero-book-button">
                  Book Consultation
                </Button>
              </div>
              <div className="flex items-center gap-8 mt-8">
                <div>
                  <p className="text-3xl font-bold text-primary" data-testid="patients-count">500+</p>
                  <p className="text-sm text-muted-foreground">Happy Patients</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary" data-testid="experience-years">12+</p>
                  <p className="text-sm text-muted-foreground">Years Experience</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary" data-testid="rating">4.9</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
            <div className="relative" data-testid="hero-image">
              <img
                src="https://images.unsplash.com/photo-1673865641073-4479f93a7776"
                alt="Professional Female Doctor"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Doctor Section */}
      {doctorProfile && (
        <section id="about" className="py-20 md:py-32 bg-accent/30" data-testid="about-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="about-title">Meet Your Doctor</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="about-subtitle">
                Compassionate care with years of experience in women's health
              </p>
            </div>
            <Card className="max-w-4xl mx-auto rounded-3xl border-none shadow-lg" data-testid="doctor-profile-card">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-1">
                    <img
                      src={doctorProfile.image_url}
                      alt={doctorProfile.full_name}
                      className="rounded-2xl w-full"
                      data-testid="doctor-image"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-3xl font-serif font-bold text-foreground mb-2" data-testid="doctor-name">
                      {doctorProfile.full_name}
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid="doctor-qualifications">{doctorProfile.qualifications}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Specialization</p>
                        <p className="font-medium" data-testid="doctor-specialization">
                          {doctorProfile.specialization.join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-medium" data-testid="doctor-experience">{doctorProfile.experience_years} Years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registration No.</p>
                        <p className="font-medium" data-testid="doctor-registration">{doctorProfile.registration_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Languages</p>
                        <p className="font-medium" data-testid="doctor-languages">
                          {doctorProfile.languages.join(', ')}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6" data-testid="doctor-bio">
                      {doctorProfile.bio}
                    </p>
                    <div className="flex items-center gap-4">
                      <Award className="text-primary" size={24} />
                      <Shield className="text-primary" size={24} />
                      <Heart className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="services-title">Our Services</h2>
            <p className="text-lg text-muted-foreground" data-testid="services-subtitle">Comprehensive healthcare at your fingertips</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="rounded-3xl border-none bg-slate-50/50 hover:bg-white hover:shadow-lg p-8 group" data-testid="service-video">
              <Video className="text-primary mb-4" size={40} />
              <h3 className="text-2xl font-medium mb-3">Video Consultation</h3>
              <p className="text-muted-foreground leading-relaxed">HD quality video calls with secure, private consultations</p>
            </Card>
            <Card className="rounded-3xl border-none bg-slate-50/50 hover:bg-white hover:shadow-lg p-8 group" data-testid="service-chat">
              <MessageCircle className="text-primary mb-4" size={40} />
              <h3 className="text-2xl font-medium mb-3">Chat Support</h3>
              <p className="text-muted-foreground leading-relaxed">Real-time messaging for quick medical queries</p>
            </Card>
            <Card className="rounded-3xl border-none bg-slate-50/50 hover:bg-white hover:shadow-lg p-8 group" data-testid="service-prescription">
              <FileText className="text-primary mb-4" size={40} />
              <h3 className="text-2xl font-medium mb-3">Digital Prescriptions</h3>
              <p className="text-muted-foreground leading-relaxed">Instant digital prescriptions delivered to your device</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-accent/30" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="how-it-works-title">How It Works</h2>
            <p className="text-lg text-muted-foreground" data-testid="how-it-works-subtitle">Three simple steps to better health</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center" data-testid="step-1">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-medium mb-3">Book Appointment</h3>
              <p className="text-muted-foreground">Choose your preferred date and time slot</p>
            </div>
            <div className="text-center" data-testid="step-2">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-medium mb-3">Make Payment</h3>
              <p className="text-muted-foreground">Secure online payment with multiple options</p>
            </div>
            <div className="text-center" data-testid="step-3">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-medium mb-3">Start Consultation</h3>
              <p className="text-muted-foreground">Connect with doctor via video or chat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-20 md:py-32" data-testid="testimonials-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="testimonials-title">
                Trusted Patient Experiences
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="testimonials-subtitle">
                Safe, private and professional online medical care
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100" data-testid="trust-badge-secure">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="text-primary" size={28} />
                </div>
                <p className="font-medium text-sm">Secure Consultation</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100" data-testid="trust-badge-certified">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="text-primary" size={28} />
                </div>
                <p className="font-medium text-sm">Certified Doctor</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100" data-testid="trust-badge-prescription">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <FileText className="text-primary" size={28} />
                </div>
                <p className="font-medium text-sm">Digital Prescription</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100" data-testid="trust-badge-booking">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Calendar className="text-primary" size={28} />
                </div>
                <p className="font-medium text-sm">Easy Booking</p>
              </div>
            </div>
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {doctorProfile && (
        <section className="py-20 md:py-32 bg-accent/30" data-testid="pricing-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="pricing-title">Consultation Fee</h2>
            <p className="text-lg text-muted-foreground mb-12" data-testid="pricing-subtitle">Transparent pricing, no hidden charges</p>
            <Card className="rounded-3xl border-none shadow-lg p-12" data-testid="pricing-card">
              <p className="text-5xl font-bold text-primary mb-4" data-testid="consultation-fee">
                ₹{doctorProfile.consultation_fee / 100}
              </p>
              <p className="text-muted-foreground mb-8">Per consultation (Video or Chat)</p>
              <Button onClick={handleBookConsultation} size="lg" className="rounded-full h-12 px-8" data-testid="pricing-book-button">
                Book Now
              </Button>
            </Card>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 md:py-32" data-testid="faq-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4" data-testid="faq-title">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-2xl px-6" data-testid="faq-1">
              <AccordionTrigger className="text-left font-medium">How do I book an appointment?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply register on our platform, choose your preferred date and time, make the payment, and you're all set!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border rounded-2xl px-6" data-testid="faq-2">
              <AccordionTrigger className="text-left font-medium">Is the video consultation secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we use encrypted video technology to ensure your consultation is completely private and secure.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border rounded-2xl px-6" data-testid="faq-3">
              <AccordionTrigger className="text-left font-medium">Can I get a prescription online?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! After your consultation, the doctor will provide a digital prescription that you can download.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border rounded-2xl px-6" data-testid="faq-4">
              <AccordionTrigger className="text-left font-medium">What payment methods are accepted?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept UPI, credit/debit cards, and digital wallets through our secure payment gateway.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary mb-4">HealthLine</h3>
              <p className="text-muted-foreground text-sm">Your trusted partner in online healthcare consultations.</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><a href="#about">About Doctor</a></p>
                <p><a href="#services">Services</a></p>
                <p><a href="/blog">Health Blog</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><a href="/terms" className="hover:text-primary cursor-pointer">Terms & Conditions</a></p>
                <p><a href="/privacy" className="hover:text-primary cursor-pointer">Privacy Policy</a></p>
                <p><a href="/refund" className="hover:text-primary cursor-pointer">Refund Policy</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Email: support@healthline.com</p>
                <p>Phone: +91 98765 43210</p>
                <p>Available: 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 HealthLine. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TestimonialCarousel({ testimonials }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative overflow-hidden">
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card
            key={testimonial.id}
            className="rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid={`testimonial-slide-${index}`}
          >
            <CardContent className="p-8">
              <div className="flex mb-6" data-testid={`testimonial-rating-${index}`}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-secondary fill-secondary" size={20} />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6 text-base" data-testid={`testimonial-text-${index}`}>
                "{testimonial.comment}"
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <CheckCircle2 className="text-primary" size={18} />
                <p className="font-medium text-sm text-foreground" data-testid={`testimonial-badge-${index}`}>
                  Verified Patient Experience
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}