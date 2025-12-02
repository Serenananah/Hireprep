
import React, { useState, useEffect } from 'react';
import { Page, User, InterviewConfig, InterviewSession } from './types';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import Layout from './components/Layout';
import { authService } from './services/authService';
import { LogOut, User as UserIcon } from 'lucide-react';

// Ensure API key is available
if (!process.env.API_KEY) {
  console.warn("API_KEY is not set in process.env. The app might not function correctly.");
}

const App: React.FC = () => {
  // Global State
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore session from authService on mount (Persistent Login)
  useEffect(() => {
    const initApp = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          // Don't auto-redirect to Setup if we are on Landing, let user choose to "Start"
        }
      } catch (e) {
        console.error("Session restore failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setCurrentPage(Page.SETUP);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPage(Page.AUTH); // Send back to Auth page
    setCurrentSession(null);
  };

  const startInterview = (config: InterviewConfig) => {
    const newSession: InterviewSession = {
      id: Date.now().toString(),
      config,
      transcript: [],
      analyses: [],
      startTime: Date.now()
    };
    setCurrentSession(newSession);
    setCurrentPage(Page.INTERVIEW);
  };

  const endInterview = (sessionData: InterviewSession) => {
    const completedSession = { ...sessionData, endTime: Date.now() };
    setCurrentSession(completedSession);
    setCurrentPage(Page.FEEDBACK);
  };

  const renderPage = () => {
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (currentPage) {
      case Page.LANDING:
        return (
          <LandingPage 
            onStart={() => setCurrentPage(user ? Page.SETUP : Page.AUTH)} 
          />
        );
      case Page.AUTH:
        return <AuthPage onLogin={handleLogin} />;
      case Page.SETUP:
        return <SetupPage onStartInterview={startInterview} user={user} />;
      case Page.INTERVIEW:
        return (
          currentSession ? (
            <InterviewPage 
              session={currentSession} 
              onEndInterview={endInterview} 
            /> 
          ) : <SetupPage onStartInterview={startInterview} user={user} />
        );
      case Page.FEEDBACK:
        return (
          currentSession ? (
            <FeedbackPage 
              session={currentSession} 
              onHome={() => setCurrentPage(Page.SETUP)}
            />
          ) : <SetupPage onStartInterview={startInterview} user={user} />
        );
      default:
        return <LandingPage onStart={() => setCurrentPage(Page.AUTH)} />;
    }
  };

  return (
    <Layout>
      {/* Global Header/Nav Overlay */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-[#0f172a] to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage(Page.LANDING)}>
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            H
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">Hireprep</span>
        </div>
        
        {user ? (
          <div className="pointer-events-auto flex items-center gap-4 group relative">
             <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-sm font-bold text-white">{user.name}</span>
               <span className="text-xs text-blue-300">{user.email}</span>
             </div>
             
             <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 border border-white/20 shadow-lg flex items-center justify-center text-slate-900 font-bold cursor-pointer hover:scale-105 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-3 w-48 py-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 translate-y-2 group-hover:translate-y-0">
                   <div className="px-4 py-2 border-b border-white/5 sm:hidden">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                   </div>
                   <button 
                     onClick={handleLogout}
                     className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                   >
                      <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="pointer-events-auto">
            {currentPage !== Page.AUTH && currentPage !== Page.LANDING && (
              <button 
                onClick={() => setCurrentPage(Page.AUTH)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/10 rounded-full hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all"
              >
                <UserIcon className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full pt-20 pb-10 px-4 flex flex-col">
        {renderPage()}
      </main>
    </Layout>
  );
};

export default App;
