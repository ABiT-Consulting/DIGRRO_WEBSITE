import { Calendar, Clock } from 'lucide-react';

interface InsightsProps {
  onNavigate: (page: string) => void;
}

export default function Insights({ onNavigate }: InsightsProps) {
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
              <span className="text-cyan-400 text-sm font-medium">Insights & Resources</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Thought Leadership
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                & Industry Insights
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Expert perspectives on AI, digital transformation, and technology trends shaping the future.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-y border-cyan-500/20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stay Updated
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Subscribe to our newsletter for the latest insights and industry trends
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:flex-1 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-cyan-500/50 transition-all whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
