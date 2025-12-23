// Declare google as a global constant for Google Identity Services
declare const google: any;

import React, { useState, useEffect } from 'react';

interface GoogleAuthModalProps {
  onSuccess: (token: string) => void;
  onClose: () => void;
  clientId: string;
  scopes: string;
}

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ onSuccess, onClose, clientId, scopes }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fix: Use global google variable for Token Client initialization
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        callback: (response: any) => {
          if (response.error !== undefined) {
            setError(response.error_description || 'Authentication failed');
            setIsLoading(false);
            return;
          }
          onSuccess(response.access_token);
        },
      });

      // Yêu cầu token
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('GIS Error:', err);
      setError('Google Login could not be initialized. Check your Client ID.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-[380px] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 transform animate-in zoom-in-95 duration-200 p-8 flex flex-col items-center">
        
        <svg className="w-12 h-12 mb-6" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Connect to Drive</h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 text-center mb-8">
          We need access to your Google Drive to list and extract your ZIP files.
        </p>

        {error && (
          <div className="w-full p-3 mb-4 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          {isLoading ? (
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">Sign in with Google</span>
            </>
          )}
        </button>

        <button 
          onClick={onClose}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default GoogleAuthModal;