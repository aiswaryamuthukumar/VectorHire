import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { User, FileText, ArrowRight, Activity, CheckCircle2, Bot } from 'lucide-react';

const VLogo = ({ color = "#E11D48" }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L13 4L21 28L12 28L4 4Z" fill={color} />
    <path d="M28 4L19 4L11 28L20 28L28 4Z" fill={color} opacity="0.6" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const [activeActionIndex, setActiveActionIndex] = React.useState(1);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveActionIndex((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Custom Cursor
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 20, stiffness: 300 }; // Much faster trailing
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
    <div className="font-sans selection:bg-red-100 selection:text-red-900 overflow-hidden relative">
      
      {/* Animated Pale Red Cursor */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] hidden md:flex items-center justify-center mix-blend-multiply"
        style={{ x: cursorX, y: cursorY }}
      >
        <div className="w-full h-full bg-red-100 rounded-full opacity-70"></div>
        <div className="w-2 h-2 bg-red-500 rounded-full absolute"></div>
      </motion.div>
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1400px] w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <VLogo />
            <span className="font-heading font-bold tracking-tight text-xl text-gray-900">VectorHire</span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => navigate('/recruiter/login')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Recruit Login
            </button>
            <button
              onClick={() => navigate('/candidate')}
              className="bg-[#E11D48] text-white px-5 py-2 rounded shadow-sm hover:bg-red-700 transition-colors"
            >
              Apply Now
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Pale peach/white bg) */}
      <section className="bg-[#FEF6F4] pt-32 pb-24 relative z-10 border-b border-red-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex-1 w-full max-w-2xl"
          >
            <motion.h1 variants={fadeUp} className="text-4xl lg:text-6xl font-heading font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-6">
              Your Journey <br />
              with VectorHire
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-gray-700 mb-8 leading-relaxed">
              Experience a smooth, sophisticated approach to modern recruitment, combining institutional precision with AI-guided transparency.
            </motion.p>

            <motion.div variants={fadeUp}>
              <button
                onClick={() => navigate('/candidate')}
                className="bg-[#E11D48] text-white px-8 py-3.5 rounded shadow-md hover:bg-red-700 transition-colors font-medium text-lg inline-flex items-center gap-2"
              >
                Start Application
              </button>
            </motion.div>
          </motion.div>

          {/* Right Centerpiece: Code-like minimalist UI */}
          <div className="flex-1 w-full lg:w-auto relative h-[450px] flex items-center justify-center">
            <motion.div style={{ y }} className="relative w-full h-full max-w-[600px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate Analysis Script</span>
              </div>
              
              {/* Body */}
              <div className="p-6 flex-1 bg-white relative overflow-hidden flex items-center justify-center">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <path d="M180 160 L 300 200" stroke="#E5E7EB" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                  <path d="M420 160 L 300 200" stroke="#E5E7EB" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                </svg>

                {/* Central Card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm p-5 z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Applicant</div>
                      <div className="text-xs text-gray-500">Processing...</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                    <div className="h-2 w-4/5 bg-gray-100 rounded-full"></div>
                  </div>
                </motion.div>

                {/* Left Card */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="absolute left-6 top-12 bg-white border border-gray-200 rounded-lg shadow-sm p-3 z-10 w-36">
                  <div className="text-xs font-bold text-gray-700 mb-2">Frontend Exp.</div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full"></div>
                </motion.div>

                {/* Right Card */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="absolute right-6 top-12 bg-white border border-gray-200 rounded-lg shadow-sm p-3 z-10 w-36">
                  <div className="text-xs font-bold text-gray-700 mb-2">Backend Exp.</div>
                  <div className="h-1.5 w-3/4 bg-gray-100 rounded-full"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

        {/* FEATURES GRID SECTION (Light Gray bg) */}
        <section className="bg-[#F9F9F9] py-24 border-b border-gray-200">
          <div className="max-w-[1000px] w-full mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-16">
              What makes VectorHire the best AI recruitment software for your business?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Contextual matching with a human element", icon: <User className="w-8 h-8 text-amber-600" /> },
                { title: "Bias-free automated skill detection", icon: <Activity className="w-8 h-8 text-blue-600" /> },
                { title: "Integrations with top ATS platforms", icon: <CheckCircle2 className="w-8 h-8 text-green-600" /> },
                { title: "Detailed insights for every candidate", icon: <FileText className="w-8 h-8 text-red-600" /> }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="mb-6 h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{feature.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RAG-POWERED ANALYSIS SECTION (White bg) */}
        <section className="bg-white py-24 border-b border-gray-200">
          <div className="max-w-[1400px] w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <div className="flex-1 w-full text-left">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h2 className="text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                  RAG-Powered Candidate Analysis
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  VectorHire uses contextual retrieval to understand candidate experience beyond keywords — surfacing relevant skills, projects, and technical alignment more intelligently.
                </p>

                <div className="flex items-center gap-3 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 w-max shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#E11D48] shrink-0" />
                  <div className="text-gray-900">
                    AI provides insight. <span className="text-[#E11D48]">Recruiters make the final decision.</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Visual: Pipeline / Nodes */}
            <div className="flex-1 w-full relative flex items-center justify-center">
              <div className="relative w-full max-w-[540px] bg-gray-50 rounded-2xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[450px] flex flex-col justify-center items-center">
                
                {/* Pipeline visual */}
                <div className="space-y-4 relative z-10 w-full max-w-[260px]">
                  
                  {/* Vertical connecting line for the pipeline - Aligned exactly to the center of the circles */}
                  <div className="absolute top-6 bottom-6 left-[31px] w-px bg-transparent z-0 border-l-2 border-dashed border-gray-300"></div>

                  {[
                    "Resume Parsing",
                    "Embedding Generation",
                    "Vector Retrieval",
                    "Contextual Matching",
                    "Recruiter Review"
                  ].map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 }}
                      className="bg-white pl-5 pr-5 py-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 w-full relative z-20"
                    >
                      <div className="w-6 h-6 shrink-0 rounded-full bg-red-50 text-[#E11D48] flex items-center justify-center text-xs font-bold border border-red-100 ring-4 ring-white">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{step}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Floating UI cards in background */}
                {[
                  { label: 'Semantic Retrieval', pos: 'top-10 right-6' },
                  { label: 'Vector Search', pos: 'bottom-16 right-6' },
                  { label: 'Project Intelligence', pos: 'top-1/3 left-6' },
                  { label: 'Context Mapping', pos: 'bottom-10 left-6' }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 1.2, ease: "easeInOut" }}
                    className={`absolute bg-white border border-gray-200 rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm opacity-50 z-0 ${item.pos}`}
                  >
                    {item.label}
                  </motion.div>
                ))}

              </div>
            </div>

          </div>
        </section>

        {/* WHAT HAPPENS AFTER YOU APPLY (Dark Maroon bg) */}
        <section className="bg-[#2E1111] py-24">
          <div className="max-w-[1400px] w-full mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
              
              {/* Left Text */}
              <div className="flex-1 w-full text-white">
                <h2 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-6">
                  Answer common hiring questions with our AI
                </h2>
                <p className="text-lg text-white/80 mb-10 leading-relaxed font-light">
                  Automate resume screening and provide instant insights to recruiters with our ready-to-deploy AI-driven candidate parsing. VectorHire understands common skills in natural language and matches them using your custom requirements.
                </p>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-px before:bg-white/20">
                  {[
                    { step: "1", title: "Submission received" },
                    { step: "2", title: "AI Assessment", active: true },
                    { step: "3", title: "Human Review" }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }}
                      className={`relative flex items-center gap-6 ${item.active ? 'opacity-100' : 'opacity-50'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${item.active ? 'bg-white text-[#2E1111]' : 'bg-[#2E1111] border border-white/30 text-white/50'}`}>
                        {item.step}
                      </div>
                      <div className={`text-xl ${item.active ? 'text-white font-semibold' : 'text-white/70'}`}>
                        {item.title}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Interactive Visual (Chat/Widget style) */}
              <div className="flex-1 flex justify-center lg:justify-end w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl"
                >
                  {/* Widget Header */}
                  <div className="bg-[#B91C1C] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">Vector AI Match</div>
                      <div className="text-red-100 text-xs">Analyzing profile...</div>
                    </div>
                  </div>

                  {/* Widget Body */}
                  <div className="p-6 bg-white space-y-6">
                    <div className="bg-gray-100 rounded-lg rounded-tl-none p-4 text-sm text-gray-700 shadow-sm max-w-[85%]">
                      Resume evidence is retrieved from indexed candidate records.
                    </div>
                    
                    <div className="bg-red-50 rounded-lg rounded-tr-none p-4 text-sm text-gray-800 shadow-sm ml-auto max-w-[85%] border border-red-100">
                      <div className="font-semibold mb-2">Backend Signals:</div>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-600" /> Supabase candidate data</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-600" /> Retrieved resume context</li>
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Decision Source</span>
                      <span className="text-sm font-bold text-[#B91C1C]">Live backend</span>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* TRANSPARENT INTELLIGENCE (Very light gray bg) */}
        <section className="bg-[#F4F4F4] py-24 border-t border-gray-200 flex flex-col items-center text-center">
          <div className="max-w-[1400px] w-full mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            
            <div className="flex-1 text-left">
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Boost your hiring capabilities with easy automation
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Make the most out of your integrations and streamline routine tasks using intelligent AI insights in VectorHire.
              </p>
            </div>

            <div className="flex-1 w-full relative flex items-center justify-center">
              {/* Flow Visualization */}
              <div className="flex items-center justify-center w-full max-w-lg relative h-[300px]">
                
                {/* Center Node that moves up and down */}
                <motion.div 
                  className="absolute left-8 md:left-12 flex items-center gap-2"
                  animate={{ y: (activeActionIndex - 1.5) * 58 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center z-10">
                    <VLogo color="#E11D48" />
                  </div>
                  <div className="h-px bg-transparent border-t-2 border-dashed border-gray-300 w-10"></div>
                  <div className="w-2 h-2 rounded-full bg-red-500 relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                </motion.div>

                {/* Actions list */}
                <div className="flex flex-col gap-3 absolute right-8 md:right-12">
                  {['Extract keywords', 'Rank candidates', 'Format resume', 'Flag missing skills'].map((action, i) => {
                    const isActive = i === activeActionIndex;
                    return (
                      <motion.div 
                        key={i} 
                        animate={{
                          x: isActive ? -16 : 0,
                          borderColor: isActive ? '#fca5a5' : '#f3f4f6',
                          boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        }}
                        className={`px-5 py-3 rounded-lg border text-sm font-medium flex items-center gap-3 bg-white w-64 z-20`}
                      >
                        <CheckCircle2 className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{action}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-[1400px] w-full mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <VLogo color="#E11D48" />
            <span className="font-heading font-bold text-gray-900 text-lg">VectorHire</span>
          </div>
          <span className="text-sm text-gray-500">© 2026 VectorHire Inc. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
