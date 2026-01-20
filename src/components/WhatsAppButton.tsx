const WHATSAPP_NUMBER = '971562551980';
const WHATSAPP_MESSAGE = 'Hi Digrro team, I would like to learn more about your services.';

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Digrro on WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-40"></span>
      <span className="absolute inset-0 rounded-full border border-white/20 animate-pulse"></span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_12px_30px_rgba(37,211,102,0.45)] transition-transform duration-300 group-hover:scale-110">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.52 3.48A11.92 11.92 0 0 0 12.02 0C5.62 0 .4 5.2.4 11.6c0 2.05.54 4.04 1.56 5.8L0 24l6.7-1.76a11.63 11.63 0 0 0 5.33 1.36h.01c6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6.03-3.36-8.12zm-8.49 18.4h-.01a9.68 9.68 0 0 1-4.93-1.35l-.35-.2-3.97 1.04 1.06-3.87-.22-.36a9.7 9.7 0 0 1-1.49-5.18c0-5.36 4.37-9.72 9.74-9.72 2.6 0 5.05 1 6.89 2.85a9.68 9.68 0 0 1 2.85 6.88c0 5.37-4.37 9.73-9.72 9.73zm5.3-7.27c-.29-.14-1.7-.84-1.97-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.23-.45-2.34-1.44-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.56-.88-2.14-.23-.55-.46-.47-.64-.48l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.41 0 1.41 1.03 2.78 1.17 2.97.14.19 2.02 3.09 4.9 4.34.69.3 1.23.48 1.64.61.69.22 1.32.19 1.81.12.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33z"
          />
        </svg>
      </span>
    </a>
  );
}
