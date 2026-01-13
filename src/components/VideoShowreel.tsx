import { Play } from 'lucide-react';
import { useState } from 'react';

export default function VideoShowreel() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl overflow-hidden relative group cursor-pointer border-2 border-gray-200 hover:border-blue-300 transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video bg-white flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50"></div>

        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 animate-pulse-soft"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
              <Play size={40} className="text-white ml-1" />
            </div>
          </div>
          <p className="text-gray-900 text-xl font-bold mb-2">AI Motion Showreel</p>
          <p className="text-gray-600 text-sm">Premium video production & motion graphics</p>
        </div>

        {isHovered && (
          <div className="absolute inset-0 bg-blue-500/5 transition-all duration-300"></div>
        )}
      </div>
    </div>
  );
}
