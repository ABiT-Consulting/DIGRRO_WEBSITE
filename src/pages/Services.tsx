import { Brain, TrendingUp, Smartphone, Users, ArrowRight } from 'lucide-react';

interface ServicesProps {
  onNavigate: (page: string) => void;
}

export default function Services({ onNavigate }: ServicesProps) {
  const mainServices = [
    {
      id: 'ai-solutions',
      icon: Brain,
      title: 'AI Strategy & Implementation',
      description: 'Enterprise AI transformation from strategy to deployment',
    },
    {
      id: 'digital-marketing',
      icon: TrendingUp,
      title: 'Intelligence-Driven Growth',
      description: 'Data science and predictive analytics for market leadership',
    },
    {
      id: 'web-mobile',
      icon: Smartphone,
      title: 'Intelligent Platforms',
      description: 'Enterprise systems with embedded AI capabilities',
    },
    {
      id: 'consulting',
      icon: Users,
      title: 'Technology Advisory',
      description: 'Strategic guidance for digital and AI transformation',
    },
  ];

  return (
    <div className="bg-[#0E1116] min-h-screen pt-20">
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-[#2F80FF] opacity-20 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[#00E5FF] opacity-15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-12 leading-[1.1] tracking-tight">
              Strategic
              <br />
              <span className="text-gradient-ai">
                Capabilities
              </span>
            </h1>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto font-light">
              Enterprise technology solutions for the AI era
            </p>
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#121417]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {mainServices.map((service) => (
              <div
                key={service.id}
                className="group relative glassmorphism rounded-3xl p-12 hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all cursor-pointer overflow-hidden"
                onClick={() => onNavigate(service.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2F80FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative z-10">
                  <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                    <service.icon size={40} className="text-white" />
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-6 group-hover:text-[#00E5FF] transition-colors">
                    {service.title}
                  </h2>

                  <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                    {service.description}
                  </p>

                  <div className="flex items-center text-[#00E5FF] font-semibold group-hover:translate-x-2 transition-transform">
                    <span>Learn More</span>
                    <ArrowRight size={20} className="ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-48 bg-gradient-to-b from-[#0E1116] to-[#121417] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2F80FF] opacity-10 rounded-full blur-[150px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-16 leading-tight">
            Custom Enterprise
            <br />
            <span className="text-gradient-ai">Solutions</span>
          </h2>
          <button
            onClick={() => onNavigate('contact')}
            className="group px-12 py-6 gradient-ai text-white rounded-xl font-bold text-xl glow-blue hover:scale-105 transition-all inline-flex items-center space-x-3"
          >
            <span>Request Consultation</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
          </button>
        </div>
      </section>
    </div>
  );
}
