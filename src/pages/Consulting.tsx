import { Users, ArrowRight } from 'lucide-react';

interface ConsultingProps {
  onNavigate: (page: string) => void;
}

export default function Consulting({ onNavigate }: ConsultingProps) {
  return (
    <div className="bg-gray-950 pt-20">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex p-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl mb-8">
              <Users size={48} className="text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Consulting
              <br />
              <span className="bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
                Services
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Strategic technology consulting to guide your digital transformation journey
              and optimize enterprise technology investments.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-green-900/20 to-teal-900/20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Let's discuss your strategic technology challenges
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="group px-10 py-5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all inline-flex items-center space-x-2"
          >
            <span>Schedule a Consultation</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
