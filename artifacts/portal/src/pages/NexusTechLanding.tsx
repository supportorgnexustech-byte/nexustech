import React, { useState } from "react";
import { useLocation } from "wouter";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Menu,
  X,
  ArrowRight,
  Gamepad2,
  Cog,
  Code2,
  Cloud,
  Lightbulb,
  Settings,
  Sparkles,
  LayoutDashboard,
  UserCog,
  ShieldCheck,
  Headset,
  Mail,
  Phone,
  MapPin,
  Send,
  Linkedin,
  Twitter,
  Instagram,
  Zap,
  Hexagon,
  Triangle,
  CircleDot,
  Diamond,
  type LucideIcon,
} from "lucide-react";

/**
 * NexusTech landing page
 * --------------------------------------------------------------
 * Drop your real assets in /public:
 *   - logo.png   -> brand mark used in the header & footer
 *   - hero.png   -> the hero illustration on the right side
 *   - sopirL.PNG -> the decorative graphic in the "Ready to Bring
 *                    your Ideas to Life?" panel
 * Theme: warm cream background with a clay / terracotta-brown accent.
 */

const navItems = ["Home", "Services", "Why NexusTech", "Our Work"];

const heroHighlights: { icon: LucideIcon; label: string }[] = [
  { icon: Gamepad2, label: "Gaming & AR/VR Solutions" },
  { icon: Cog, label: "Industrial Automation" },
  { icon: Code2, label: "Custom Software Development" },
  { icon: Cloud, label: "Cloud & DevOps Services" },
];

const trustedBrands: { icon: LucideIcon; name: string }[] = [
  { icon: Zap, name: "Vantra" },
  { icon: Hexagon, name: "Korvex" },
  { icon: Triangle, name: "Brexa" },
  { icon: CircleDot, name: "Lumenis" },
  { icon: Diamond, name: "Stratos" },
  { icon: Zap, name: "Quanta" },
];

const aboutPoints: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Lightbulb, title: "Innovation", desc: "Driven by ideas" },
  { icon: Settings, title: "Precision", desc: "Built with care" },
  { icon: Sparkles, title: "Impact", desc: "Delivered always" },
];

const services: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Custom Software Development",
    desc: "Tailored solutions built to meet your unique business needs.",
  },
  {
    icon: UserCog,
    title: "IT Consulting",
    desc: "Expert guidance to optimize your technology strategy.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    desc: "Rigorous testing for secure, scalable, high-performing solutions.",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    desc: "We're here round the clock to support your growth journey.",
  },
];

const contactDetails: { icon: LucideIcon; label: string; value: string }[] = [
  { icon: Mail, label: "Email", value: "support.org.nexustech@gmail.com" },
  { icon: Phone, label: "Phone", value: "+91 86304 35910" },
  { icon: MapPin, label: "Location", value: "vikas bazar mathura up india" },
];

const inputClass =
  "w-full rounded-xl border border-[#E6D9C4] bg-[#FBF6EF] px-4 py-3 text-sm text-[#3A2A1D] placeholder-[#A8927A] outline-none transition-colors focus:border-[#B5754A] focus:ring-2 focus:ring-[#B5754A]/20";

export default function NexusTechLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Admin login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const { toast } = useToast();
  const submitContact = useSubmitContact();

  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });
  
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitContact.mutateAsync({ data: contactForm });
      toast({ title: "Message Sent", description: "We will get back to you shortly." });
      setContactForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "support.org.nexustech@gmail.com" && adminPassword === "Nexus!2") {
      localStorage.setItem("nexus_admin_auth", "true");
      setLocation("/pricing");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  return (
    <div className="bg-[#FBF6EF] font-sans text-[#3A2A1D] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#EBDFC9] bg-[#FBF6EF]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10 lg:px-16">
          <a href="#home" className="flex items-center gap-2.5">
            <img src="/assets/logo-dark.png" alt="NexusTech logo" className="h-9 w-9 object-contain" />
            <span className="text-xl font-bold tracking-tight">
              nexus<span className="text-[#B5754A]">Tech</span>
            </span>
          </a>

          <nav className="hidden items-center gap-9 lg:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-[#7A6655] transition-colors hover:text-[#3A2A1D]"
              >
                {item}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden rounded-full bg-[#B5754A] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9C6239] lg:inline-flex"
          >
            Contact
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-[#EBDFC9] p-2 text-[#3A2A1D] lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#EBDFC9] bg-[#FBF6EF] px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-[#7A6655] hover:text-[#3A2A1D]"
                >
                  {item}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex w-fit rounded-full bg-[#B5754A] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Contact
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative overflow-hidden px-6 pt-14 pb-20 md:px-10 md:pt-20 md:pb-28 lg:px-16"
      >
        <div
          className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#E7CBA5] opacity-50 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Building the Future of{" "}
              <span className="text-[#B5754A]">Tech Solutions</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-[#7A6655] md:text-lg">
              NexusTech delivers cutting-edge digital solutions that empower
              businesses to innovate, scale, and succeed in a connected world.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#B5754A] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#9C6239]"
              >
                Let&apos;s Build Together
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center rounded-full border border-[#D9C7B0] px-7 py-3.5 text-sm font-semibold text-[#3A2A1D] transition-colors hover:bg-[#F4EAD9]"
              >
                Explore Services
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="/assets/hero.gif"
              alt="Illustration representing NexusTech's software, gaming, automation and cloud services"
              className="w-full max-w-md object-contain mix-blend-multiply"
            />
          </div>
        </div>

        <div className="relative mx-auto mt-16 grid max-w-7xl grid-cols-2 gap-8 border-t border-[#EBDFC9] pt-10 md:grid-cols-4">
          {heroHighlights.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#F4EAD9] text-[#B5754A]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-[#5C4934]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Steps */}
      <section className="border-y border-[#EBDFC9] bg-[#F4EAD9] px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Steps to Register in NexusTech
          </h2>
          <p className="mt-3 text-[#8C7A66]">
            Follow these simple steps to get started with our services
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B5754A] text-2xl font-bold text-white shadow-lg">
                1
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#3A2A1D]">Contact Us</h3>
              <p className="mt-2 text-[#7A6655]">Reach out with your project details using our contact form.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B5754A] text-2xl font-bold text-white shadow-lg">
                2
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#3A2A1D]">Consultation</h3>
              <p className="mt-2 text-[#7A6655]">We'll schedule a call to discuss your requirements and scope.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B5754A] text-2xl font-bold text-white shadow-lg">
                3
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#3A2A1D]">Onboarding</h3>
              <p className="mt-2 text-[#7A6655]">Sign the proposal and access your dedicated client portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="why-nexustech" className="px-6 py-20 md:px-10 md:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#B5754A]">
              Who we are
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">About nexusTech</h2>
            <p className="mt-5 leading-relaxed text-[#7A6655]">
              At nexusTech, we merge technology and creativity to build
              future-ready solutions. From custom software to intelligent
              automation — we engineer experiences that drive real impact.
              Our mission is simple: deliver innovation, with precision and
              purpose.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {aboutPoints.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#EBDFC9] bg-white p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4EAD9] text-[#B5754A]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-[#8C7A66]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-[#F4EAD9] px-6 py-20 md:px-10 md:py-28 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#B5754A]">
              What we offer
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Services We Provide
            </h2>
          </div>
          <div className="flex justify-start mt-6">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#B5754A] px-6 py-2 text-sm font-bold text-[#B5754A] transition-colors hover:bg-[#B5754A] hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Portal Login
            </button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#EBDFC9] bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4EAD9] text-[#B5754A]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold leading-snug">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8C7A66]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="our-work" className="px-6 py-20 md:px-10 md:py-28 lg:px-16">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-[#EBDFC9] bg-white lg:grid-cols-2">
          <div className="p-10 md:p-14 lg:p-16">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Bring your Ideas to Life?
            </h2>
            <p className="mt-4 max-w-md text-[#7A6655]">
              Let&apos;s build something extraordinary together. We&apos;re
              just a message away.
            </p>
            <a
              href="#contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#B5754A] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#9C6239]"
            >
              Start Your Project
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="h-64 lg:h-auto">
            <img
              src="/assets/spiral.png"
              alt="Decorative spiral graphic"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Contact / Get Support */}
      <section id="contact" className="px-6 py-20 md:px-10 md:py-28 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[3fr_auto_4fr] items-center">
          <div className="-mt-12">
            <div className="flex items-center gap-4">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#B5754A]">
                  Get Support
                </p>
                <h2 className="mt-1 text-3xl font-bold md:text-4xl">Get in Touch</h2>
              </div>
            </div>
            <p className="mt-2 max-w-md text-[#7A6655]">
              Have a project in mind? Let&apos;s talk about how we can help.
            </p>

            <div className="mt-16 space-y-5">
              {contactDetails.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#F4EAD9] text-[#B5754A]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-sm text-[#8C7A66]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center px-4">
            <img src="/assets/robo ai.svg" alt="Robo AI Mascot" className="h-96 w-96 object-contain" />
          </div>

          <div className="rounded-3xl border border-[#EBDFC9] bg-white p-8 md:p-10">
            <h3 className="text-lg font-bold">Send Us a Message</h3>
            <p className="mt-1 text-sm text-[#8C7A66]">
              Fill out the form below and we&apos;ll get back to you within 24 hours.
            </p>

            <form onSubmit={handleContactSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    Full name
                  </label>
                  <input id="firstName" type="text" placeholder="First Name" className={inputClass} value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">
                    Last name
                  </label>
                  <input id="lastName" type="text" placeholder="Last Name" className={inputClass} value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} required />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input id="email" type="email" placeholder="Email Address" className={inputClass} value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
              </div>

              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone number
                </label>
                <input id="phone" type="tel" placeholder="Phone Number" className={inputClass} value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} required />
              </div>

              <div>
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your project..."
                  className={`${inputClass} resize-none`}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitContact.isPending}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B5754A] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#9C6239] disabled:opacity-50"
              >
                {submitContact.isPending ? "Sending..." : "Send Message"}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EBDFC9] px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <a href="#home" className="flex items-center gap-2.5">
            <img src="/assets/logo-dark.png" alt="NexusTech logo" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              nexus<span className="text-[#B5754A]">Tech</span>
            </span>
          </a>

          <p className="text-sm text-[#9A8771]">© 2026 nexusTech. All rights reserved.</p>

          <div className="flex items-center gap-3">
            {[Linkedin, Twitter, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social media link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBDFC9] text-[#6B5947] transition-colors hover:bg-[#F4EAD9]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A2A1D]/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute right-4 top-4 text-[#7A6655] hover:text-[#3A2A1D]"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold text-[#3A2A1D]">Admin Login</h3>
            <p className="mt-2 text-sm text-[#7A6655]">Enter your credentials to access the NexusTech portal.</p>
            
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#3A2A1D]">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#3A2A1D]">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              
              {loginError && <p className="text-sm font-semibold text-red-600">{loginError}</p>}
              
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-[#B5754A] py-3 text-sm font-bold text-white transition-colors hover:bg-[#9C6239]"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
