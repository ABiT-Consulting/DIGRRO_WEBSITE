import { Building2, ArrowRight } from 'lucide-react';

interface IndustriesProps {
  onNavigate: (page: string) => void;
}

export default function Industries({ onNavigate }: IndustriesProps) {
  return (
    <div className="bg-gray-950 pt-20">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-sm font-medium">Industries We Serve</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Sector-Specific
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI Solutions
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Deep industry expertise combined with cutting-edge technology to deliver
              solutions tailored to your sector's unique challenges.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-y border-cyan-500/20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Don't See Your Industry?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            We work across diverse sectors. Let's discuss your specific requirements.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="group px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all inline-flex items-center space-x-2"
          >
            <span>Discuss Your Needs</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
