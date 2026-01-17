import { TrendingUp, ArrowRight, Target, Megaphone, LineChart, SearchCheck, Zap, CheckCircle, Globe, Rocket } from 'lucide-react';

interface DigitalMarketingProps {
  onNavigate: (page: string) => void;
}

export default function DigitalMarketing({ onNavigate }: DigitalMarketingProps) {
  const services = [
    {
      icon: Target,
      title: 'Performance Marketing',
      description: 'AI-optimized campaigns across Google, Meta, LinkedIn, and TikTok with real-time budget allocation and predictive analytics.',
      features: ['Paid Search (PPC)', 'Social Media Ads', 'Programmatic Display', 'Retargeting Campaigns'],
    },
    {
      icon: SearchCheck,
      title: 'SEO & Content Strategy',
      description: 'Data-driven SEO strategies that dominate search rankings and drive qualified organic traffic to your enterprise.',
      features: ['Technical SEO Audits', 'Content Optimization', 'Link Building', 'Local SEO'],
    },
    {
      icon: Megaphone,
      title: 'Brand & Social Media',
      description: 'Strategic brand positioning and social media management that builds authority and drives engagement across platforms.',
      features: ['Brand Strategy', 'Social Media Management', 'Influencer Marketing', 'Community Building'],
    },
    {
      icon: LineChart,
      title: 'Analytics & Insights',
      description: 'Advanced analytics and business intelligence that transform data into actionable growth strategies.',
      features: ['GA4 Implementation', 'Custom Dashboards', 'Attribution Modeling', 'Conversion Optimization'],
    },
    {
      icon: Globe,
      title: 'E-commerce Marketing',
      description: 'Complete e-commerce growth strategies from marketplace optimization to customer retention programs.',
      features: ['Product Feed Optimization', 'Shopping Campaigns', 'Amazon/Noon Marketing', 'Cart Abandonment'],
    },
    {
      icon: Rocket,
      title: 'Growth Marketing',
      description: 'Rapid experimentation and growth hacking strategies that scale user acquisition and revenue exponentially.',
      features: ['A/B Testing', 'Conversion Rate Optimization', 'Marketing Automation', 'Lifecycle Marketing'],
    },
  ];

  const results = [
    { metric: '300%', label: 'Average ROI Increase' },
    { metric: '5x', label: 'Lead Generation Growth' },
    { metric: '65%', label: 'Cost Per Acquisition Reduction' },
    { metric: '12M+', label: 'Monthly Ad Spend Managed' },
  ];

  const process = [
    {
      step: '01',
      title: 'Audit & Strategy',
      description: 'Comprehensive analysis of your current marketing performance and competitive landscape',
    },
    {
      step: '02',
      title: 'Campaign Design',
      description: 'Data-driven campaign architecture with clear KPIs and growth projections',
    },
    {
      step: '03',
      title: 'Execution & Testing',
      description: 'Multi-channel campaign launch with continuous A/B testing and optimization',
    },
    {
      step: '04',
      title: 'Scale & Optimize',
      description: 'Performance monitoring and strategic scaling based on real-time analytics',
    },
  ];

  const advantages = [
    'AI-powered campaign optimization',
    'Full-funnel marketing strategies',
    'Real-time performance tracking',
    'GCC market specialization',
    'Multilingual campaigns (EN/AR)',
    'Transparent ROI reporting',
  ];

  return (
    <div className="bg-[#0E1116] pt-20">
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-[#2F80FF] opacity-20 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[#00E5FF] opacity-15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
              <TrendingUp size={48} className="text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-12 leading-[1.1] tracking-tight">
              Intelligence-Driven
              <br />
              <span className="text-gradient-ai">
                Growth Marketing
              </span>
            </h1>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Data science and predictive analytics for market leadership across the GCC
            </p>
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#121417]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Proven Results
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
            {results.map((result, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-gradient-ai mb-4">
                  {result.metric}
                </div>
                <div className="text-gray-400 text-lg font-medium">{result.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#0E1116]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Comprehensive Marketing Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {services.map((service, index) => (
              <div
                key={index}
                className="glassmorphism rounded-3xl p-12 hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all group"
              >
                <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                  <service.icon size={40} className="text-white" />
                </div>

                <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-[#00E5FF] transition-colors">
                  {service.title}
                </h3>

                <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                  {service.description}
                </p>

                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-300">
                      <CheckCircle size={20} className="text-[#00E5FF] mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#121417]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Our Growth Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {process.map((phase, index) => (
              <div
                key={index}
                className="relative glassmorphism rounded-3xl p-10 hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all"
              >
                <div className="text-8xl font-bold text-gradient-ai mb-8 opacity-20">
                  {phase.step}
                </div>

                <h3 className="text-2xl font-bold text-white mb-6">
                  {phase.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {phase.description}
                </p>

                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-5 transform -translate-y-1/2">
                    <ArrowRight size={28} className="text-[#2F80FF] opacity-40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#0E1116]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              The Digrro Difference
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="glassmorphism rounded-2xl p-10 flex items-start space-x-6 hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all"
              >
                <Zap size={32} className="text-[#00E5FF] flex-shrink-0 mt-1" />
                <span className="text-white font-semibold text-2xl">{advantage}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-48 bg-gradient-to-b from-[#121417] to-[#0E1116] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2F80FF] opacity-10 rounded-full blur-[150px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-16 leading-tight">
            Ready to Accelerate
            <br />
            <span className="text-gradient-ai">Your Growth?</span>
          </h2>
          <button
            onClick={() => onNavigate('contact')}
            className="group px-12 py-6 gradient-ai text-white rounded-xl font-bold text-xl glow-blue hover:scale-105 transition-all inline-flex items-center space-x-3"
          >
            <span>Get a Marketing Audit</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
          </button>
        </div>
      </section>
    </div>
  );
}
