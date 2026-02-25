import { useState } from 'react';
import { ArrowRight, Brain, TrendingUp, Smartphone, Users, Target, BarChart3, Megaphone, LineChart, SearchCheck, Globe, Rocket, Code, Zap, CheckCircle, Send, ArrowDown, Mail, Phone, MapPin, Sparkles, Network, Cpu, Database, FileText, Palette, Layers, Type, Pen, Video, Film, Monitor, Play, Linkedin, Facebook, Instagram } from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import VideoShowreel from '../components/VideoShowreel';
import TurnstileCaptcha from '../components/TurnstileCaptcha';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const servicesReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const aiSolutionsReveal = useScrollReveal();
  const processReveal = useScrollReveal();
  const caseStudyReveal = useScrollReveal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      alert('Please complete the captcha verification before submitting the form.');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Thank you! Your message has been sent successfully. We will get back to you soon.');
        setFormData({ name: '', email: '', company: '', message: '' });
        setCaptchaToken('');
        setCaptchaKey((previousKey) => previousKey + 1);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Sorry, there was an error sending your message. Please try again or contact us directly at info@digrro.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { value: '500+', label: 'AI-Powered Projects' },
    { value: '50+', label: 'Enterprise Clients' },
    { value: '15+', label: 'GCC Markets' },
    { value: '98%', label: 'Success Rate' },
  ];

  const services = [
    {
      icon: Brain,
      title: 'AI Solutions Development',
      description: 'Custom AI systems, predictive analytics, intelligent automation, and enterprise AI integration.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      title: 'Digital Marketing & Performance',
      description: 'AI-driven targeting, analytics dashboards, CRO, and performance marketing strategies.',
      gradient: 'from-cyan-500 to-green-500',
    },
    {
      icon: Smartphone,
      title: 'Web & App Development',
      description: 'Enterprise websites, web apps, mobile apps, AI & CRM integration with UX/UI excellence.',
      gradient: 'from-green-500 to-yellow-500',
    },
    {
      icon: Palette,
      title: 'AI-Powered Branding & Design',
      description: 'Brand identity, logo systems, design guidelines, and digital design enhanced by AI.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Video,
      title: 'AI Video Creation & Motion',
      description: 'AI-assisted video production, motion graphics, brand videos, and social content.',
      gradient: 'from-orange-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Consulting & Strategy',
      description: 'Digital transformation, AI adoption, branding strategy, IT modernization, and governance.',
      gradient: 'from-pink-500 to-purple-500',
    },
    {
      icon: Database,
      title: 'Data & Analytics',
      description: 'Business intelligence, data warehousing, real-time analytics, and data-driven insights.',
      gradient: 'from-purple-500 to-blue-500',
    },
    {
      icon: Layers,
      title: 'Add-On Development',
      description: 'Expert SAP and Odoo add-on development with deep technical expertise and custom modules.',
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      icon: FileText,
      title: 'ZATCA E-Invoicing (KSA)',
      description: 'ZATCA-compliant e-invoice implementation and ERP integration for Saudi Arabia (KSA).',
      gradient: 'from-emerald-500 to-cyan-500',
    },
    {
      icon: Network,
      title: 'Integration Services',
      description: 'Seamless system integration, API development, and third-party service connectivity.',
      gradient: 'from-indigo-500 to-cyan-500',
    },
  ];

  const aiFeatures = [
    { icon: Cpu, title: 'Custom AI Systems', description: 'Tailored AI solutions for enterprise needs' },
    { icon: BarChart3, title: 'Predictive Analytics', description: 'Data-driven forecasting and insights' },
    { icon: Zap, title: 'Intelligent Automation', description: 'Process optimization with AI' },
    { icon: Network, title: 'Enterprise Integration', description: 'Seamless AI system deployment' },
  ];

  const marketingServices = [
    { icon: Target, title: 'Performance Marketing', description: 'AI-optimized campaigns across channels' },
    { icon: SearchCheck, title: 'SEO & Content', description: 'Data-driven search optimization' },
    { icon: Megaphone, title: 'Brand & Social', description: 'Strategic brand positioning' },
    { icon: LineChart, title: 'Analytics & Insights', description: 'Advanced business intelligence' },
  ];

  const webServices = [
    { icon: Globe, title: 'Enterprise Websites', description: 'Scalable, high-performance web platforms' },
    { icon: Smartphone, title: 'Mobile Apps', description: 'Native and cross-platform solutions' },
    { icon: Code, title: 'Web Applications', description: 'Custom web app development' },
    { icon: Sparkles, title: 'UX/UI Design', description: 'User-centered design excellence' },
  ];

  const brandingServices = [
    { icon: Palette, title: 'Brand Identity Design', description: 'Complete brand systems from strategy to execution' },
    { icon: Layers, title: 'Logo & Visual Systems', description: 'Memorable logos and cohesive design systems' },
    { icon: Type, title: 'Brand Guidelines', description: 'Comprehensive brand standards and style guides' },
    { icon: Pen, title: 'Digital Design', description: 'Modern UI/UX enhanced by AI tools' },
  ];

  const videoServices = [
    { icon: Video, title: 'AI-Assisted Video Production', description: 'Smart video creation with AI enhancement' },
    { icon: Film, title: 'Motion Graphics', description: 'Dynamic animations and visual storytelling' },
    { icon: Play, title: 'Brand & Explainer Videos', description: 'Engaging narrative-driven content' },
    { icon: Monitor, title: 'Social Media Content', description: 'Optimized video for digital platforms' },
  ];

  const consultingAreas = [
    'Digital Transformation Strategy',
    'AI Adoption & Implementation',
    'Brand Strategy & Positioning',
    'IT Infrastructure Modernization',
    'Technology Roadmaps',
    'Digital Governance',
  ];

  const process = [
    { step: '01', title: 'Analyze', description: 'Deep dive into your business, challenges, and opportunities', icon: SearchCheck },
    { step: '02', title: 'Design', description: 'Strategic blueprints and AI-powered solution architecture', icon: Brain },
    { step: '03', title: 'Build', description: 'Agile development with continuous integration', icon: Rocket },
    { step: '04', title: 'Optimize', description: 'Performance monitoring and intelligent scaling', icon: Sparkles },
  ];

  const industries = [
    { name: 'Government & Semi-Government', icon: Users },
    { name: 'Enterprise & Corporate', icon: Network },
    { name: 'Tech & SaaS', icon: Cpu },
    { name: 'Healthcare & Medical', icon: Target },
    { name: 'Finance & Banking', icon: BarChart3 },
    { name: 'E-commerce & Retail', icon: Globe },
  ];

  const caseStudyChallenges = [
    'Booking confirmations depended on fragmented email and spreadsheet handoffs, creating avoidable processing delays.',
    'Vendor coordination lacked a single workflow, causing rate, availability, and fulfillment updates to drift across teams.',
    'Finance teams reconciled bookings, supplier invoices, and customer receipts manually, delaying period-end closure and review.',
    'Leadership reporting was retrospective and slow, limiting timely interventions on demand shifts and margin leakage.',
  ];

  const caseStudyImplementation = [
    'Implemented ERPNext as a centralized platform for inquiry-to-booking, fulfillment, and billing lifecycle control.',
    'Designed booking workflow automation with status-driven transitions, approval checkpoints, and exception routing.',
    'Built a vendor coordination module for onboarding, SLA tracking, allocation monitoring, and communication traceability.',
    'Integrated accounting flows for receivables, payables, tax configuration, and event-based financial posting.',
    'Automated financial reconciliation with rule-based matching across booking references, vendor invoices, and payments.',
    'Enabled role-specific real-time dashboards for operations, finance, and management teams.',
  ];

  const caseStudyArchitecture = [
    {
      icon: Network,
      title: 'Process Orchestration Layer',
      description: 'Booking desks and operations teams execute standardized ERPNext workflows with governed transitions and approvals.',
    },
    {
      icon: Database,
      title: 'Core ERP Data Layer',
      description: 'ERPNext acts as the system of record for bookings, vendors, transactions, and operational status history.',
    },
    {
      icon: BarChart3,
      title: 'Finance Control Layer',
      description: 'Integrated accounting automates posting, reconciliation, and financial traceability across service delivery events.',
    },
    {
      icon: Brain,
      title: 'AI Insight Layer',
      description: 'AI services produce data summaries, demand forecasting, and variance insights to support faster decisions.',
    },
  ];

  const caseStudyTimeline = [
    { week: 'Week 1', title: 'Discovery & Baseline', detail: 'Process diagnostics, KPI baselining, and data-readiness assessment.' },
    { week: 'Week 2', title: 'Solution Design', detail: 'Target operating model, ERPNext blueprinting, and control framework definition.' },
    { week: 'Week 3', title: 'Booking Automation Build', detail: 'Workflow states, approval matrix, and exception-handling logic configuration.' },
    { week: 'Week 4', title: 'Vendor Module Delivery', detail: 'Vendor lifecycle management, SLA controls, and fulfillment tracking setup.' },
    { week: 'Week 5', title: 'Accounting Integration', detail: 'Posting rules, chart mappings, reconciliation policies, and financial controls.' },
    { week: 'Week 6', title: 'AI Reporting Enablement', detail: 'Automated data summarization, forecasting pipelines, and insight templates.' },
    { week: 'Week 7', title: 'UAT & Capability Transfer', detail: 'Scenario testing, role validation, and business-user training execution.' },
    { week: 'Week 8', title: 'Go-Live & Stabilization', detail: 'Production launch, hypercare monitoring, and post-deployment governance.' },
  ];

  const caseStudyOutcomes = [
    { metric: '41%', label: 'Reduction in booking process delays from inquiry to confirmation' },
    { metric: '82%', label: 'Faster reconciliation across bookings, invoices, and payments' },
    { metric: '64%', label: 'Operational tasks shifted from manual handling to workflow automation' },
    { metric: '55%', label: 'Improvement in reporting turnaround using AI-assisted analysis' },
  ];

  return (
    <div className="bg-gray-900 overflow-x-hidden">
      <section id="hero" className="relative min-h-screen flex items-center justify-center gradient-hero-bg animate-gradient overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-blue-500 opacity-[0.12] rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-cyan-500 opacity-[0.12] rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-teal-500 opacity-[0.1] rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }}></div>

          <div className="absolute inset-0 opacity-[0.08]">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-blue-400 rounded-full"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
                  animationDelay: Math.random() * 5 + 's',
                }}
              ></div>
            ))}
          </div>

          <div className="absolute inset-0 opacity-[0.12]">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-24 bg-gradient-to-b from-transparent via-[#2F80FF] to-transparent"
                style={{
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animation: `neural-pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                  animationDelay: Math.random() * 2 + 's',
                }}
              ></div>
            ))}
          </div>

          {[...Array(8)].map((_, i) => (
            <div
              key={`geo-${i}`}
              className="absolute w-20 h-20 border-2 border-blue-400/20"
              style={{
                top: Math.random() * 80 + 10 + '%',
                left: Math.random() * 80 + 10 + '%',
                animation: `float-rotate ${Math.random() * 30 + 20}s ease-in-out infinite`,
                animationDelay: Math.random() * 5 + 's',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            ></div>
          ))}

          {[...Array(5)].map((_, i) => (
            <div
              key={`trail-${i}`}
              className="absolute h-px w-32 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40"
              style={{
                top: Math.random() * 100 + '%',
                left: 0,
                animation: `trail ${Math.random() * 8 + 6}s ease-in-out infinite`,
                animationDelay: Math.random() * 4 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[...Array(3)].map((_, i) => (
              <div
                key={`orbit-${i}`}
                className="absolute w-3 h-3 bg-blue-400 rounded-full"
                style={{
                  animation: `orbit ${15 + i * 5}s linear infinite`,
                  animationDelay: `${i * 2}s`,
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
          <div className="mb-8" style={{ animation: 'hero-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards' }}>
            <img src="/image_fc91df1d-53b0-439b-9c3e-c444469fda79-removebg-preview copy copy copy.png" alt="Digrro" className="h-16 mx-auto mb-12 opacity-90" />
          </div>

          <h1
            className="relative text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-12 leading-[1.05] tracking-tight"
            style={{ animation: 'hero-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s backwards' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 blur-xl"
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s ease-in-out infinite',
                   animationDelay: '1.5s'
                 }}>
            </div>
            AI-Powered Digital, IT,
            <br />
            Branding & Consulting
            <br />
            <span className="text-gradient-ai relative">
              Solutions
            </span>
          </h1>

          <p
            className="text-xl md:text-2xl text-gray-300/80 mb-16 max-w-4xl mx-auto leading-relaxed font-light"
            style={{ animation: 'hero-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s backwards' }}
          >
            We build intelligent systems, brands, and experiences that drive scalable growth across the GCC
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
            style={{ animation: 'hero-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s backwards' }}
          >
            <a
              href="#contact"
              className="group relative px-12 py-6 bg-[#2F80FF] text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-[0_0_40px_rgba(47,128,255,0.6)] hover:-translate-y-1 transition-all duration-500 flex items-center space-x-3 hover:brightness-110 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative">Request AI Consultation</span>
              <ArrowRight className="relative group-hover:translate-x-2 transition-transform duration-300" size={24} />
            </a>
            <a
              href="#services"
              className="group px-12 py-6 bg-gray-800/80 border-2 border-blue-500/30 text-white rounded-xl font-semibold text-xl hover:bg-gray-800 hover:border-blue-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(47,128,255,0.3)] hover:-translate-y-1 hover:scale-105"
            >
              Explore the Journey
            </a>
          </div>

          <div style={{ animation: 'bounce-gentle 3s ease-in-out infinite' }}>
            <ArrowDown size={32} className="text-blue-400 mx-auto" />
          </div>
        </div>
      </section>

      <section id="trust" className="py-32 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `float-diagonal ${Math.random() * 15 + 10}s ease-in-out infinite`,
                animationDelay: Math.random() * 5 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div
            ref={statsReveal.ref}
            className={`transition-all duration-1000 ${
              statsReveal.isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Trusted by Enterprises & Governments Across the GCC
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                AI-driven growth strategies • Data-first & creativity-powered approach
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="relative text-center group cursor-default"
                  style={{
                    animation: statsReveal.isVisible ? `metric-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s backwards` : 'none'
                  }}
                >
                  <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="text-5xl md:text-6xl font-bold text-gradient-ai mb-4 group-hover:scale-110 transition-transform duration-500">
                      <AnimatedCounter value={stat.value} duration={2500} />
                    </div>
                    <div className="text-gray-400 text-lg font-medium group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-32 h-32 border border-blue-400/20 rounded-full"
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `float-rotate ${Math.random() * 40 + 30}s ease-in-out infinite`,
                animationDelay: Math.random() * 10 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div
            ref={servicesReveal.ref}
            className={`text-center mb-24 transition-all duration-1000 ${
              servicesReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              What We Do
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive AI-powered solutions for modern enterprises
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative bg-gray-800 border-2 border-gray-700 rounded-3xl p-10 hover-card-glow cursor-pointer overflow-hidden"
                style={{
                  animation: servicesReveal.isVisible ? `card-entrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s backwards` : 'none'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>

                <div className="relative z-10">
                  <div className={`inline-flex p-6 bg-gradient-to-br ${service.gradient} rounded-2xl mb-8 shadow-md transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <service.icon size={36} className="text-gray-900" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gradient-ai transition-all duration-300">
                    {service.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-solutions" className="py-40 bg-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div
              ref={aiSolutionsReveal.ref}
              className={`transition-all duration-1000 ${
                aiSolutionsReveal.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                AI Solutions
                <br />
                <span className="text-gradient-ai">Development</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Custom AI systems, predictive analytics, intelligent automation, AI assistants, and enterprise AI integration that transform your business operations.
              </p>

              <div className="space-y-6">
                {aiFeatures.map((feature, index) => (
                  <div key={index} className="group flex items-start space-x-4 bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-x-2">
                    <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <feature.icon size={24} className="text-gray-900" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-12 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2F80FF]/10 to-transparent"></div>

                <div className="absolute inset-0 opacity-[0.08]">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-16 bg-gradient-to-b from-transparent via-blue-400 to-transparent"
                      style={{
                        top: Math.random() * 80 + '%',
                        left: `${(i + 1) * 12}%`,
                        animation: `data-flow ${Math.random() * 2 + 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    ></div>
                  ))}
                </div>

                <div className="relative z-10">
                  <div className="space-y-8">
                    {['Data', 'Intelligence', 'Action', 'Growth'].map((step, index) => (
                      <div key={index} className="flex items-center space-x-6 group/item">
                        <div className="text-6xl font-bold text-gradient-ai opacity-30 group-hover/item:opacity-50 transition-opacity duration-300">{index + 1}</div>
                        <div className="flex-1">
                          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{
                                width: `${100 - index * 15}%`,
                                animation: `progress-fill 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s backwards`
                              }}
                            ></div>
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                              style={{
                                animation: 'shimmer 2s ease-in-out infinite',
                                animationDelay: `${index * 0.3}s`
                              }}
                            ></div>
                          </div>
                          <p className="text-white font-bold text-2xl mt-3 group-hover/item:text-blue-400 transition-colors duration-300">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="digital-marketing" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[#00E5FF] opacity-10 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute top-40 right-40 w-[300px] h-[300px] bg-green-500 opacity-5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Digital Marketing
              <br />
              <span className="text-gradient-ai">& Performance</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              AI-driven targeting, analytics dashboards, CRO, and performance marketing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {marketingServices.map((service, index) => (
              <div
                key={index}
                className="relative bg-gray-800 border-2 border-gray-700 rounded-3xl p-10 hover:border-cyan-500 hover:bg-gray-700 transition-all duration-500 group overflow-hidden"
                style={{
                  animation: `card-entrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="inline-flex p-5 bg-gradient-to-br from-cyan-500 to-green-500 rounded-2xl mb-6 glow-cyan group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <service.icon size={32} className="text-gray-900" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative bg-gray-800 border-2 border-gray-700 rounded-3xl p-12 overflow-hidden group hover:border-cyan-500/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/10 to-transparent"></div>
            <div className="absolute inset-0 opacity-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${10 + i * 15}%`,
                    animation: `pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                ></div>
              ))}
            </div>
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { metric: '300%', label: 'ROI Increase' },
                { metric: '5x', label: 'Lead Growth' },
                { metric: '65%', label: 'Cost Reduction' },
                { metric: '12M+', label: 'Ad Spend Managed' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center transform hover:scale-110 transition-all duration-500 cursor-default"
                  style={{
                    animation: `metric-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1 + 0.5}s backwards`
                  }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-gradient-ai mb-3">{stat.metric}</div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="web-mobile" className="py-40 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-12 bg-gradient-to-b from-transparent via-green-400 to-transparent"
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `neural-pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 2 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Web & App
              <br />
              <span className="text-gradient-ai">Development</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Enterprise websites, web apps, mobile apps with AI & CRM integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {webServices.map((service, index) => (
              <div
                key={index}
                className="relative bg-gray-900 border-2 border-gray-700 rounded-3xl p-10 hover:border-green-500 hover:bg-gray-700 transition-all duration-500 group overflow-hidden"
                style={{
                  animation: `slide-in-${index % 2 === 0 ? 'left' : 'right'} 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s backwards`
                }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-yellow-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="inline-flex p-5 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <service.icon size={32} className="text-gray-900" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="branding" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[#FFD700] to-[#FF8C00] opacity-10 rounded-full blur-[140px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="space-y-6">
                    {['BRAND', 'IDENTITY', 'DESIGN', 'SYSTEM'].map((word, index) => (
                      <div
                        key={index}
                        className="text-5xl font-bold text-white opacity-85 tracking-wider"
                        style={{
                          animationDelay: `${index * 0.2}s`,
                          fontSize: `${60 - index * 5}px`
                        }}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative">
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-90 group-hover:opacity-100 transition-all"></div>
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-lg"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">Logo Concept</span>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative p-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full opacity-80 group-hover:opacity-100 transition-all"></div>
                        <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full opacity-80 group-hover:opacity-100 transition-all"></div>
                        <div className="h-3 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full opacity-80 group-hover:opacity-100 transition-all"></div>
                        <div className="h-3 bg-gradient-to-r from-pink-500 to-pink-400 rounded-full opacity-80 group-hover:opacity-100 transition-all"></div>
                        <div className="pt-2 grid grid-cols-2 gap-2">
                          <div className="h-2 bg-gray-600 rounded-full"></div>
                          <div className="h-2 bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">Color System</span>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative p-4">
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-white opacity-80 group-hover:opacity-100 transition-all">Aa</div>
                        <div className="space-y-1">
                          <div className="h-2 bg-gray-600 rounded w-full opacity-60"></div>
                          <div className="h-2 bg-gray-600 rounded w-5/6 opacity-60"></div>
                          <div className="h-2 bg-gray-600 rounded w-4/6 opacity-60"></div>
                        </div>
                        <div className="text-sm font-light text-gray-400 opacity-80 group-hover:opacity-100 transition-all">Body</div>
                        <div className="h-1 bg-gray-700 rounded w-full opacity-40"></div>
                        <div className="h-1 bg-gray-700 rounded w-4/5 opacity-40"></div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">Typography</span>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative">
                      <div className="absolute inset-0 p-4">
                        <div className="relative w-full h-full">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-40 group-hover:opacity-60 transition-all"
                              style={{
                                top: `${(i % 4) * 25 + 10}%`,
                                left: `${Math.floor(i / 4) * 30 + 10}%`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            ></div>
                          ))}
                          {[...Array(6)].map((_, i) => (
                            <svg
                              key={i}
                              className="absolute opacity-20 group-hover:opacity-30 transition-all"
                              style={{
                                top: `${20 + i * 12}%`,
                                left: '15%',
                                width: '70%',
                                height: '2px',
                              }}
                            >
                              <line x1="0" y1="0" x2="100%" y2="0" stroke="url(#grad)" strokeWidth="1" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">Brand Pattern</span>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative p-3">
                      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border border-gray-800 group-hover:border-cyan-500/30 transition-all p-2">
                        <div className="h-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded mb-2"></div>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <div className="h-8 bg-gray-800 rounded"></div>
                          <div className="h-8 bg-gray-800 rounded"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-700 rounded w-full"></div>
                          <div className="h-1 bg-gray-700 rounded w-4/5"></div>
                          <div className="h-1 bg-gray-700 rounded w-3/5"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">UI Sample</span>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-900 border-2 border-gray-700 rounded-xl hover:border-yellow-500 hover:scale-105 transition-all overflow-hidden group relative p-4">
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-10 bg-gradient-to-br from-gray-900 to-gray-950 rounded border border-gray-700 group-hover:border-cyan-500/50 transition-all flex items-center justify-center">
                          <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-500 to-blue-500 opacity-70"></div>
                        </div>
                        <div className="w-full space-y-1">
                          <div className="h-1 bg-gray-600 rounded w-3/4 mx-auto"></div>
                          <div className="h-1 bg-gray-700 rounded w-1/2 mx-auto"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">Application</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                AI-Powered
                <br />
                <span className="text-gradient-ai">Branding & Design</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Brand identity design, logo systems, brand guidelines, and digital design, all enhanced by AI tools and modern design technologies.
              </p>

              <div className="space-y-6">
                {brandingServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 hover:border-yellow-500 hover:-translate-x-2 transition-all duration-500 group"
                    style={{
                      animation: `slide-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s backwards`
                    }}
                  >
                    <div className="flex-shrink-0 p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <service.icon size={24} className="text-gray-900" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300">{service.title}</h4>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="video" className="py-40 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#FF8C00] rounded-full animate-particle-float"
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              AI Video Creation
              <br />
              <span className="text-gradient-ai">& Motion Content</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              AI-assisted video production, motion graphics, explainer videos, and brand content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {videoServices.map((service, index) => (
              <div
                key={index}
                className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-10 hover:border-orange-500 hover:bg-gray-700 transition-all group"
              >
                <div className="inline-flex p-5 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl mb-6">
                  <service.icon size={32} className="text-gray-900" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-3xl opacity-30 group-hover:opacity-50 blur-xl transition-all duration-500 animate-gradient"></div>
            <div className="relative">
              <VideoShowreel />
            </div>
          </div>
        </div>
      </section>

      <section id="consulting" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2F80FF] opacity-10 rounded-full blur-[150px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Consulting &
              <br />
              <span className="text-gradient-ai">Strategy</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Digital transformation, AI adoption, branding strategy, IT modernization, and governance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultingAreas.map((area, index) => (
              <div
                key={index}
                className="relative bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 flex items-center space-x-4 hover:border-blue-500 hover:bg-gray-700 hover:scale-105 transition-all duration-500 group overflow-hidden cursor-pointer"
                style={{
                  animation: `card-entrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-20 animate-pulse-ring"></div>
                    <CheckCircle size={28} className="text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors duration-300">{area}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-40 bg-gray-800 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div
            ref={processReveal.ref}
            className={`text-center mb-24 transition-all duration-1000 ${
              processReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              How We Work
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              A proven methodology for delivering exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {process.map((phase, index) => (
              <div
                key={index}
                className="relative bg-gray-900 border-2 border-gray-700 rounded-3xl p-10 hover-card-glow overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="text-8xl font-bold text-gradient-ai mb-8 opacity-20 group-hover:opacity-30 transition-opacity">
                    {phase.step}
                  </div>

                  <div className="inline-flex p-5 gradient-ai rounded-2xl mb-8 glow-blue group-hover:scale-105 transition-transform duration-300">
                    <phase.icon size={32} className="text-gray-900" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-gradient-ai transition-all duration-300">
                    {phase.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {phase.description}
                  </p>
                </div>

                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-5 transform -translate-y-1/2 z-20">
                    <ArrowRight size={28} className="text-[#2F80FF] opacity-40 group-hover:opacity-80 transition-opacity" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Industries We Serve
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Trusted across sectors throughout the GCC region
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="relative bg-gray-800 border-2 border-gray-700 rounded-3xl p-10 text-center hover:bg-gray-700 hover:border-blue-500 hover:scale-105 transition-all duration-500 cursor-pointer group overflow-hidden"
                style={{
                  animation: `card-entrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s backwards`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="inline-flex p-6 gradient-ai rounded-2xl mb-6 glow-blue group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <industry.icon size={32} className="text-gray-900" />
                  </div>
                  <div className="text-white font-semibold text-xl group-hover:text-blue-400 transition-colors duration-300">
                    {industry.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="case-study" className="py-40 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/3 w-[560px] h-[560px] bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-[520px] h-[520px] bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div
            ref={caseStudyReveal.ref}
            className={`text-center mb-16 transition-all duration-1000 ${
              caseStudyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full mb-8">
              <span className="text-blue-300 text-sm font-semibold uppercase tracking-wider">Enterprise ERP Case Study</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Alphastart Tourism:
              <br />
              <span className="text-gradient-ai">ERPNext Modernization with AI-Enhanced Operations</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              DIGRRO implemented ERPNext for Alphastart Tourism to unify booking operations, vendor coordination, finance,
              and AI-assisted decision support inside one controlled enterprise platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Client</p>
              <p className="text-white text-xl font-semibold">Alphastart Tourism</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Industry</p>
              <p className="text-white text-xl font-semibold">Travel & Tourism</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Program Scope</p>
              <p className="text-white text-xl font-semibold">Booking, Vendor Ops, Finance, AI Reporting</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Deployment Window</p>
              <p className="text-white text-xl font-semibold">8 Weeks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Operational Inefficiencies Before ERP</h3>
              <ul className="space-y-4">
                {caseStudyChallenges.map((challenge, index) => (
                  <li key={index} className="text-gray-300 leading-relaxed flex items-start gap-3">
                    <CheckCircle size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Technical Implementation Approach</h3>
              <ul className="space-y-4">
                {caseStudyImplementation.map((item, index) => (
                  <li key={index} className="text-gray-300 leading-relaxed flex items-start gap-3">
                    <Zap size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-14 bg-gray-900 border border-gray-700 rounded-3xl p-8">
            <h3 className="text-3xl font-bold text-white mb-6 text-center">AI Capability Enablement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-white mb-3">Data Summarization</h4>
                <p className="text-gray-300 leading-relaxed">
                  AI-generated operational summaries consolidate booking load, vendor performance, and financial variance into
                  concise daily and weekly management briefs.
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-white mb-3">Demand Forecasting</h4>
                <p className="text-gray-300 leading-relaxed">
                  Forecast models use seasonality and booking trends to project demand, helping teams adjust supplier capacity
                  and pricing decisions earlier.
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-white mb-3">Actionable Insights</h4>
                <p className="text-gray-300 leading-relaxed">
                  Insight signals surface anomalies in margins, delays, and reconciliation exceptions so teams can intervene
                  before issues compound.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-14">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">System Architecture Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {caseStudyArchitecture.map((layer, index) => (
                <div key={index} className="bg-gray-900 border border-gray-700 rounded-2xl p-7">
                  <div className="inline-flex p-4 gradient-ai rounded-xl mb-5">
                    <layer.icon size={24} className="text-gray-900" />
                  </div>
                  <h4 className="text-white text-xl font-semibold mb-3">{layer.title}</h4>
                  <p className="text-gray-400 leading-relaxed">{layer.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-14">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">Implementation Phases and Deployment Timeline (8 Weeks)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudyTimeline.map((phase, index) => (
                <div key={index} className="bg-gray-900 border border-gray-700 rounded-2xl p-7">
                  <p className="text-blue-300 font-semibold uppercase tracking-wider text-sm mb-3">{phase.week}</p>
                  <h4 className="text-white text-xl font-semibold mb-3">{phase.title}</h4>
                  <p className="text-gray-400 leading-relaxed">{phase.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-14">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">Measured Business Improvements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {caseStudyOutcomes.map((outcome, index) => (
                <div key={index} className="bg-gray-900 border border-gray-700 rounded-2xl p-7 text-center">
                  <p className="text-4xl md:text-5xl font-bold text-gradient-ai mb-3">{outcome.metric}</p>
                  <p className="text-gray-300 leading-relaxed">{outcome.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-blue-500/30 rounded-3xl p-10 text-center">
            <h3 className="text-3xl font-bold text-white mb-5">Strategic Business Impact</h3>
            <p className="text-xl text-gray-300 max-w-5xl mx-auto leading-relaxed mb-6">
              Alphastart Tourism now operates on a scalable digital backbone that can support higher booking volumes,
              multi-branch coordination, and future service expansion without proportionate growth in administrative overhead.
              The organization moved from fragmented execution to data-guided operations with stronger financial control.
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-gradient-ai">Ready to transform your operations with intelligent ERP systems?</p>
          </div>
        </div>
      </section>

      <section id="contact" className="py-48 bg-gradient-to-b from-[#121417] to-[#0E1116] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#2F80FF] opacity-15 rounded-full blur-[180px] animate-pulse-glow"></div>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
              style={{
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `float-diagonal ${Math.random() * 20 + 15}s ease-in-out infinite`,
                animationDelay: Math.random() * 5 + 's',
              }}
            ></div>
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Build Intelligent Brands
              <br />
              <span className="text-gradient-ai">and Systems with Digrro</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Let's discuss how AI can transform your enterprise
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-gray-750 transition-all duration-300"
                  />
                  <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-300"></div>
                </div>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-gray-750 transition-all duration-300"
                  />
                  <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-300"></div>
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-gray-750 transition-all duration-300"
                  />
                  <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-300"></div>
                </div>
                <div className="relative group">
                  <textarea
                    placeholder="Tell us about your project"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-gray-750 transition-all duration-300 resize-none"
                  ></textarea>
                  <div className="absolute inset-0 -z-10 bg-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-xl transition-all duration-300"></div>
                </div>
                <TurnstileCaptcha
                  key={captchaKey}
                  onTokenChange={setCaptchaToken}
                  className="flex justify-center"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !captchaToken}
                  className="relative w-full group px-10 py-5 gradient-ai text-gray-900 rounded-xl font-bold text-xl glow-blue hover:scale-105 transition-all duration-500 flex items-center justify-center space-x-3 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative">{isSubmitting ? 'Sending...' : 'Talk to an AI Expert'}</span>
                  {!isSubmitting && <Send className="relative group-hover:translate-x-2 group-hover:rotate-12 transition-all duration-300" size={22} />}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-10">
                <h3 className="text-2xl font-bold text-white mb-8">Get in Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Mail size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Email</div>
                      <a href="mailto:info@digrro.com" className="text-white font-semibold hover:text-blue-400 transition-colors">
                        info@digrro.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Phone</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Regional Sales Manager</div>
                          <a href="tel:+971544649231" className="text-white font-semibold hover:text-blue-400 transition-colors">
                            +971 54 464 9231
                          </a>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Creative Department Manager</div>
                          <a href="tel:+971562551980" className="text-white font-semibold hover:text-blue-400 transition-colors">
                            +971 56 255 1980
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <MapPin size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Representative Areas</div>
                      <div className="text-white font-semibold">
                        Saudi Arabia • UAE • Qatar • UK • Jordan
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border-2 border-gray-700 rounded-3xl p-10">
                <h3 className="text-xl font-bold text-white mb-4">Why Partner with Digrro?</h3>
                <ul className="space-y-3">
                  {['AI-first approach', 'Enterprise security', 'GCC expertise', 'Measurable ROI', 'Agile delivery'].map((item, index) => (
                    <li key={index} className="flex items-center text-gray-400">
                      <CheckCircle size={20} className="text-blue-400 mr-3 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <img src="/image_fc91df1d-53b0-439b-9c3e-c444469fda79-removebg-preview copy copy copy.png" alt="Digrro" className="h-10 mx-auto mb-8 opacity-90" />

            <div className="flex items-center justify-center space-x-6 mb-8">
              <a
                href="https://www.linkedin.com/company/digrro/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-blue-400 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://x.com/digrro"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-blue-400 transition-all"
                aria-label="X (Twitter)"
              >
                <XIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://www.facebook.com/share/1BnYvKUZky/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-blue-400 transition-all"
                aria-label="Facebook"
              >
                <Facebook size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/digrro.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-blue-400 transition-all"
                aria-label="Instagram"
              >
                <Instagram size={20} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/digrro.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-blue-400 transition-all"
                aria-label="Threads"
              >
                <ThreadsIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
            </div>

            <p className="text-gray-400 text-sm">
              © 2026 Digrro. Building the Future with AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThreadsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 192 192">
      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 300 300.251">
      <path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>
    </svg>
  );
}
