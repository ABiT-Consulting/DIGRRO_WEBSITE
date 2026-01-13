import { Target, Users, Rocket, Award } from 'lucide-react';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export default function About({ onNavigate }: AboutProps) {
  const values = [
    {
      icon: Target,
      title: 'AI-First',
    },
    {
      icon: Users,
      title: 'Enterprise Focus',
    },
    {
      icon: Rocket,
      title: 'Results Driven',
    },
    {
      icon: Award,
      title: 'GCC Expertise',
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-20">
      <section className="relative py-40 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-12 leading-[1.1] tracking-tight">
              Enterprise AI
              <br />
              <span className="text-gradient-ai">
                For the GCC
              </span>
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-light">
              Strategic technology partner for regional enterprises
            </p>
          </div>
        </div>
      </section>

      <section className="py-40 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Our Approach
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="inline-flex p-6 gradient-ai rounded-2xl mb-8 mx-auto shadow-md">
                  <value.icon size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{value.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Partner with Us?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Let's explore how we can drive your digital transformation
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            Get in Touch
          </button>
        </div>
      </section>
    </div>
  );
}
