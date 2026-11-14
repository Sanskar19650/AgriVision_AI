import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  MapPin,
  Microscope,
  ShieldCheck,
  Sprout,
  CheckCircle2,
} from 'lucide-react';
import { useAgri } from '../context/AgriContext';

export function LandingPage() {
  const { enterDemoMode, firebaseUser } = useAgri();
  const navigate = useNavigate();

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleExploreDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.includes('@') || !contactForm.message.trim()) {
      setContactError('Please enter your name, a valid email address, and your inquiry.');
      return;
    }
    setContactError('');
    setContactSent(true);
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#263238]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E0E0E0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display font-bold text-xl text-[#2E7D32] tracking-tight whitespace-nowrap shrink-0"
          >
            AgriVision AI
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#546E7A]" aria-label="Primary">
            <a href="#about" className="hover:text-[#2E7D32] transition-colors whitespace-nowrap shrink-0">
              About
            </a>
            <a href="#features" className="hover:text-[#2E7D32] transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#ai-tech" className="hover:text-[#2E7D32] transition-colors whitespace-nowrap shrink-0">
              AI &amp; IoT
            </a>
            <a href="#blockchain" className="hover:text-[#2E7D32] transition-colors whitespace-nowrap shrink-0">
              Blockchain
            </a>
            <a href="#contact" className="hover:text-[#2E7D32] transition-colors whitespace-nowrap shrink-0">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={firebaseUser ? '/dashboard' : '/login'}
              className="px-4 py-2 text-sm font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] transition-colors whitespace-nowrap shrink-0"
            >
              {firebaseUser ? 'Open Workspace' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-sm font-medium text-[#2E7D32]">
              Maharashtra 7/12 Land Registry · Arduino IoT · Crop Vision · SHA-256 Ledger
            </p>
            <h1
              className="font-display font-bold text-[#263238] leading-[1.12] tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.35rem)', textWrap: 'balance' }}
            >
              Smart Agriculture. Intelligent Decisions. Better Harvests.
            </h1>
            <p className="text-base sm:text-lg text-[#546E7A] leading-relaxed max-w-[60ch]">
              Empowering farmers through Artificial Intelligence, IoT monitoring, satellite mapping and blockchain technology across every stage from soil preparation to harvest verification.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExploreDemo}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] transition-colors whitespace-nowrap"
              >
                <span>Open Farmer Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center px-5 py-3 text-sm font-semibold bg-white text-[#263238] border border-[#E0E0E0] rounded-lg hover:bg-[#E8F5E9] hover:border-[#66BB6A] transition-colors whitespace-nowrap"
              >
                Explore Features
              </a>
              <Link
                to="/register"
                className="text-sm font-medium text-[#2E7D32] hover:underline px-2 py-2 whitespace-nowrap"
              >
                Register Account
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-[#E0E0E0] bg-[#E8F5E9]">
              <img
                src="/src/assets/images/hero_smart_farm_1794662768941.jpg"
                alt="Aerial view of irrigated Maharashtra sugarcane and mango farmland at sunrise"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-column summary strip below hero */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Land Units Supported', value: 'Acres · Hectares · Guntha' },
            { label: 'Priority Vision Crops', value: 'Sugarcane · Mango · Banana · Coconut' },
            { label: 'IoT Field Controller', value: 'Arduino Uno / Mega + RS485 NPK' },
            { label: 'Document Integrity', value: 'SHA-256 + Solidity Registry' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white border border-[#E0E0E0] rounded-xl p-4"
            >
              <p className="text-xs font-medium text-[#546E7A]">{item.label}</p>
              <p className="mt-1 font-display font-semibold text-sm text-[#263238]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white border-y border-[#E0E0E0] py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-[#E0E0E0] bg-[#E8F5E9] aspect-[4/3]">
              <img
                src="/src/assets/images/iot_arduino_sensor_1794662769152.jpg"
                alt="Field soil sensor probe installed next to young crop seedlings"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#263238]">
              Built for Ground-Level Farm Management
            </h2>
            <p className="text-[#546E7A] leading-relaxed">
              AgriVision AI unifies Maharashtra 7/12 (Satbara) parcel registration, interactive Leaflet boundary mapping, Arduino soil telemetry, deep-learning crop diagnostics, weather-aware irrigation planning, and SHA-256 report verification in one clear workspace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                <p className="font-display font-semibold text-sm text-[#263238]">
                  Transparent Data Provenance
                </p>
                <p className="text-xs text-[#546E7A] mt-1">
                  Every soil measurement distinguishes live Arduino hardware packets, manual lab entries, and simulator test streams.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                <p className="font-display font-semibold text-sm text-[#263238]">
                  Honest 7/12 Verification
                </p>
                <p className="text-xs text-[#546E7A] mt-1">
                  Upload 7/12 extracts for OCR text capture, manually verify survey/Gat numbers, and draw exact parcel polygons on satellite tiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Bento Grid */}
      <section id="features" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#263238]">
            End-to-End Agricultural Lifecycle Modules
          </h2>
          <p className="text-sm sm:text-base text-[#546E7A] mt-2">
            Structured workflows connecting field preparation, soil health, crop protection, and auditable harvest documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white border border-[#E0E0E0] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-[#2E7D32] font-display font-semibold text-lg">
                <MapPin className="w-5 h-5" />
                <span>01. Maharashtra 7/12 Land Registration &amp; Satellite Mapping</span>
              </div>
              <p className="text-sm text-[#546E7A] mt-2 leading-relaxed">
                Record 7/12 numbers, Survey and Gat numbers, Village, Taluka, and District. Upload extracts for OCR parsing, draw farm boundaries interactively on Leaflet OpenStreetMap or Satellite imagery, compute Acres/Hectares/Guntha, and export GeoJSON polygons.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#E0E0E0] flex flex-wrap gap-6 text-xs text-[#546E7A]">
              <span>GeoJSON Boundary Storage</span>
              <span>·</span>
              <span>Automatic Guntha Conversion</span>
              <span>·</span>
              <span>Manual Verification Status</span>
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-[#2E7D32] font-display font-semibold text-lg">
              <Sprout className="w-5 h-5" />
              <span>02. 12-Stage Crop Lifecycle</span>
            </div>
            <p className="text-sm text-[#546E7A] mt-2 leading-relaxed">
              Track Sugarcane, Mango, Banana, Coconut, Rice, Wheat, Cotton, Soybean, and Maize from land preparation and seed selection through harvesting and yield logs.
            </p>
          </div>

          <div id="ai-tech" className="bg-white border border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-[#2E7D32] font-display font-semibold text-lg">
              <Microscope className="w-5 h-5" />
              <span>03. CNN Disease &amp; YOLOv8 Damage</span>
            </div>
            <p className="text-sm text-[#546E7A] mt-2 leading-relaxed">
              Upload leaf or field photos for disease classification (Red Rot, Rust, Anthracnose, Sigatoka, Bud Rot), YOLOv8 damage bounding boxes, and Random Forest crop recommendation.
            </p>
          </div>

          <div className="md:col-span-2 bg-white border border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-2.5 text-[#2E7D32] font-display font-semibold text-lg">
              <Cpu className="w-5 h-5" />
              <span>04. Arduino Uno / Mega IoT Telemetry &amp; Smart Irrigation</span>
            </div>
            <p className="text-sm text-[#546E7A] mt-2 leading-relaxed">
              Connects Arduino Uno or Mega controllers via ESP8266 Wi-Fi bridge to stream Soil Moisture, Soil pH, DHT22 Temperature/Humidity, and RS485 Modbus NPK readings to <code className="text-xs bg-[#F5F7F5] px-1.5 py-0.5 rounded">/api/iot/telemetry</code>. Includes a Python simulator for hardware-free verification.
            </p>
          </div>
        </div>
      </section>

      {/* Blockchain & How It Works */}
      <section id="blockchain" className="bg-white border-y border-[#E0E0E0] py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32]">
              <ShieldCheck className="w-4 h-4" />
              <span>Blockchain Document Verification</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#263238]">
              Tamper-Evident SHA-256 Anchoring for Farm Certificates
            </h2>
            <p className="text-sm sm:text-base text-[#546E7A] leading-relaxed">
              Soil test reports, crop lifecycle certificates, and harvest records are hashed using SHA-256 and anchored to the <code className="text-xs bg-[#F5F7F5] px-1.5 py-0.5 rounded">AgriVision.sol</code> smart contract pattern. Any single-character alteration is immediately flagged during verification.
            </p>
            <ul className="space-y-2 text-sm text-[#263238]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span>Only cryptographic hashes and timestamps stored on-chain</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span>Instant integrity verification against transaction hash</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <h3 className="font-display font-semibold text-lg text-[#263238] mb-4">
              How AgriVision AI Works
            </h3>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Register Farm & 7/12 Parcel', desc: 'Add Maharashtra 7/12 details and draw plot boundaries on satellite imagery.' },
                { step: '02', title: 'Monitor Soil & Weather', desc: 'Stream Arduino Uno/Mega NPK + moisture data and real-time weather advisories.' },
                { step: '03', title: 'Run AI Crop Diagnostics', desc: 'Get Random Forest crop suitability, CNN disease treatment, and YOLOv8 damage boxes.' },
                { step: '04', title: 'Export & Anchor Reports', desc: 'Download CSV/PDF reports and register SHA-256 hashes for verification.' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 p-3.5 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                  <span className="font-mono text-sm font-semibold text-[#2E7D32] tabular-nums">{s.step}</span>
                  <div>
                    <p className="font-display font-semibold text-sm text-[#263238]">{s.title}</p>
                    <p className="text-xs text-[#546E7A] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
        <div className="max-w-xl mx-auto bg-white border border-[#E0E0E0] rounded-xl p-6 sm:p-8">
          <h2 className="font-display font-bold text-2xl text-[#263238]">Contact Project Team</h2>
          <p className="text-sm text-[#546E7A] mt-1">
            Questions about Arduino sensor calibration, Maharashtra 7/12 workflows, or AI model weights.
          </p>

          {contactSent ? (
            <div className="mt-5 p-4 rounded-lg bg-[#E8F5E9] border border-[#66BB6A] text-sm text-[#2E7D32]">
              Inquiry recorded. Thank you for reaching out to AgriVision AI.
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
              {contactError && (
                <p className="text-xs text-[#E53935] font-medium">{contactError}</p>
              )}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-[#263238] mb-1">
                  Full Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#2E7D32]"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-[#263238] mb-1">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#2E7D32]"
                  placeholder="farmer@example.com"
                />
              </div>
              <div>
                <label htmlFor="contact-msg" className="block text-xs font-medium text-[#263238] mb-1">
                  Message
                </label>
                <textarea
                  id="contact-msg"
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#2E7D32]"
                  placeholder="Describe your farm or technical question..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-sm font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-[#E0E0E0] py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#546E7A]">
          <p className="font-display font-semibold text-sm text-[#263238]">AgriVision AI</p>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#about" className="hover:text-[#2E7D32]">About</a>
            <a href="#features" className="hover:text-[#2E7D32]">Features</a>
            <Link to="/login" className="hover:text-[#2E7D32]">Login</Link>
            <Link to="/register" className="hover:text-[#2E7D32]">Register</Link>
            <button type="button" onClick={handleExploreDemo} className="hover:text-[#2E7D32]">
              Demo Workspace
            </button>
          </div>
          <p>© 2026 AgriVision AI · Agricultural Monitoring &amp; Blockchain Verification</p>
        </div>
      </footer>
    </div>
  );
}
