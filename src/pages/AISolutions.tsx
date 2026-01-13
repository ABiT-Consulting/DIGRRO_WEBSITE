import { Brain, ArrowRight, Cpu, Zap, TrendingUp, BarChart3, Network, Shield } from 'lucide-react';

interface AISolutionsProps {
  onNavigate: (page: string) => void;
}

export default function AISolutions({ onNavigate }: AISolutionsProps) {
  const capabilities = [
    {
      icon: Brain,
      title: 'Machine Learning',
      description: 'Predictive models and intelligent systems',
    },
    {
      icon: Cpu,
      title: 'Automation',
      description: 'End-to-end process intelligence',
    },
    {
      icon: Network,
      title: 'Neural Networks',
      description: 'Deep learning architectures',
    },
    {
      icon: BarChart3,
      title: 'Data Science',
      description: 'Advanced analytics and insights',
    },
  ];

  const outcomes = [
    {
      metric: '40%',
      label: 'Efficiency Gain',
    },
    {
      metric: '65%',
      label: 'Cost Reduction',
    },
    {
      metric: '10x',
      label: 'Processing Speed',
    },
  ];

  return (
    <div className="bg-[#0E1116] min-h-screen pt-20">
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-[#2F80FF] opacity-20 rounded-full blur-[120px] animate-pulse-glow"></div>
          <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-[#00E5FF] opacity-15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

          <div className="absolute inset-0 opacity-20">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-16 bg-gradient-to-b from-transparent via-[#2F80FF] to-transparent"
                style={{
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animation: `neural-pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                  animationDelay: Math.random() * 2 + 's',
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <div className="inline-flex p-8 gradient-ai rounded-3xl mb-12 glow-blue">
              <Brain size={64} className="text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-12 leading-[1.1] tracking-tight">
              AI Strategy &
              <br />
              <span className="text-gradient-ai">
                Implementation
              </span>
            </h1>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto font-light">
              Enterprise AI transformation from strategy to deployment
            </p>
          </div>

          <div className="grid grid-cols-3 gap-12 mb-24">
            {outcomes.map((outcome, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl font-bold text-gradient-ai mb-4">
                  {outcome.metric}
                </div>
                <div className="text-gray-400 text-lg">{outcome.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#121417] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#2F80FF] rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00E5FF] rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Core Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="glassmorphism rounded-3xl p-12 hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all group"
              >
                <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                  <capability.icon size={40} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-[#00E5FF] transition-colors">
                  {capability.title}
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-[#0E1116]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Implementation Framework
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glassmorphism rounded-3xl p-12 text-center hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all">
              <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                <Shield size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Assessment
              </h3>
            </div>

            <div className="glassmorphism rounded-3xl p-12 text-center hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all">
              <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                <Zap size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Deployment
              </h3>
            </div>

            <div className="glassmorphism rounded-3xl p-12 text-center hover:border-[#2F80FF] hover:bg-[#1C1F24] transition-all">
              <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 glow-blue">
                <TrendingUp size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Optimization
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-48 bg-gradient-to-b from-[#121417] to-[#0E1116] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2F80FF] opacity-10 rounded-full blur-[150px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-16 leading-tight">
            Transform Your
            <br />
            <span className="text-gradient-ai">Enterprise with AI</span>
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
