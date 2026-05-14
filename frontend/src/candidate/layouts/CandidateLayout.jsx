import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const VLogo = ({ color = "#E11D48" }) => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L13 4L21 28L12 28L4 4Z" fill={color} />
    <path d="M28 4L19 4L11 28L20 28L28 4Z" fill={color} opacity="0.6" />
  </svg>
);

const CandidateLayout = () => {
  const navigate = useNavigate();

  // Custom Cursor
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 20, stiffness: 300 }; // Fast trailing
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 16); // Centered for w-8 h-8 (32px)
      mouseY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FEF6F4] from-50% to-[#F9F9F9] to-50% text-gray-900 relative font-sans selection:bg-red-100 selection:text-red-900 overflow-hidden">

      {/* Animated Pale Red Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] hidden md:flex items-center justify-center mix-blend-multiply"
        style={{ x: cursorX, y: cursorY }}
      >
        <div className="w-full h-full bg-red-100 rounded-full opacity-70"></div>
        <div className="w-2 h-2 bg-red-500 rounded-full absolute"></div>
      </motion.div>

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex justify-between items-center max-w-[1400px] w-full mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#E11D48] hover:text-[#BE123C] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex items-center gap-2">
            <VLogo />
            <span className="text-lg font-heading font-bold text-gray-900 tracking-tight">VectorHire</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CandidateLayout;
