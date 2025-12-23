
import React, { useState, useEffect } from 'react';

interface GoogleAuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<'select' | 'loading'>('select');
  const [selectedEmail, setSelectedEmail] = useState('');

  const accounts = [
    { name: 'Alex Thompson', email: 'alex.t@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { name: 'Work Account', email: 'alex.thompson@company.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AT' },
  ];

  const handleSelectAccount = (email: string) => {
    setSelectedEmail(email);
    setStep('loading');
  };

  useEffect(() => {
    if (step === 'loading') {
      const timer = setTimeout(() => {
        onSuccess();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [step, onSuccess]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-[380px] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 transform animate-in zoom-in-95 duration-200">
        
        {/* Header with Google Logo */}
        <div className="pt-8 pb-4 flex flex-col items-center">
          <svg className="w-12 h-12 mb-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          
          {step === 'select' ? (
            <>
              <h1 className="text-2xl font-normal text-gray-800 dark:text-zinc-100">Choose an account</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2">to continue to <span className="font-medium text-gray-900 dark:text-white">ZIP Extractor Pro</span></p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-normal text-gray-800 dark:text-zinc-100">Signing in...</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2">Connecting to <span className="font-medium text-gray-900 dark:text-white">{selectedEmail}</span></p>
            </>
          )}
        </div>

        <div className="px-1 py-4">
          {step === 'select' ? (
            <div className="flex flex-col">
              {accounts.map((acc, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectAccount(acc.email)}
                  className="flex items-center gap-4 px-8 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors border-t border-gray-100 dark:border-zinc-800 first:border-none"
                >
                  <img src={acc.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate">{acc.name}</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-500 truncate">{acc.email}</span>
                  </div>
                </button>
              ))}
              
              <button className="flex items-center gap-4 px-8 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors border-t border-gray-100 dark:border-zinc-800">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400">
                  <span className="material-symbols-outlined !text-[20px]">account_circle</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">Use another account</span>
              </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center">
              <div className="w-full h-1 bg-gray-100 dark:bg-zinc-800 absolute bottom-0 left-0 overflow-hidden">
                <div className="h-full bg-[#4285F4] w-1/3 absolute animate-[loading-bar_1.5s_infinite_linear]"></div>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#4285F4] animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#EA4335] animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#FBBC05] animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        {step === 'select' && (
          <div className="px-8 py-6 text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed">
            To continue, Google will share your name, email address, language preference, and profile picture with ZIP Extractor Pro. Before using this app, you can review ZIP Extractor Pro's <a href="#" className="text-blue-600 dark:text-blue-400 font-medium">privacy policy</a> and <a href="#" className="text-blue-600 dark:text-blue-400 font-medium">terms of service</a>.
          </div>
        )}

        {/* Footer actions */}
        <div className="px-8 pb-8 flex justify-between items-center mt-2">
          <button 
            onClick={onClose}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthModal;
