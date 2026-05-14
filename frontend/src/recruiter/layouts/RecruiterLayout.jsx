import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bot, Users, UserCheck, LogOut } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const VLogo = ({ color = "#E11D48", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L13 4L21 28L12 28L4 4Z" fill={color} />
    <path d="M28 4L19 4L11 28L20 28L28 4Z" fill={color} opacity="0.6" />
  </svg>
);

const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'AI Recruiter', path: '/recruiter/ai', icon: Bot },
    { name: 'Applicants', path: '/recruiter/applicants', icon: Users },
    { name: 'Shortlisted', path: '/recruiter/shortlisted', icon: UserCheck },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20 shadow-sm">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8">
          <VLogo size={32} />
          <span className="text-2xl font-heading font-bold text-gray-900 tracking-tight">Vector<span className="text-[#E11D48]">Hire</span></span>
        </div>
      </div>
      
      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                isActive 
                  ? 'text-[#E11D48] bg-red-50' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#E11D48] rounded-r-full shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#E11D48]' : 'group-hover:text-gray-900 transition-colors'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-[#E11D48] transition-colors group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

const RecruiterLayout = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 20, stiffness: 300 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="flex min-h-screen bg-[#F9F9F9] text-gray-900 font-sans selection:bg-red-100 selection:text-red-900">
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] hidden md:flex items-center justify-center mix-blend-multiply"
        style={{ x: cursorX, y: cursorY }}
      >
        <div className="w-full h-full bg-red-100 rounded-full opacity-70"></div>
        <div className="w-2 h-2 bg-red-500 rounded-full absolute"></div>
      </motion.div>

      <Sidebar />
      <div className="flex-1 ml-64 overflow-hidden relative flex flex-col">
        <main className="flex-1 overflow-y-auto z-10 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RecruiterLayout;
