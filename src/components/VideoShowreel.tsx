export default function VideoShowreel() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl overflow-hidden relative group border-2 border-gray-200 hover:border-blue-300 transition-all">
      <div className="aspect-video bg-black relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/digrro_video_logo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
