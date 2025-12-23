// Declare gapi as a global constant to satisfy TypeScript compiler
declare const gapi: any;

import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DrivePicker from './components/DrivePicker';
import ArchivePreview from './components/ArchivePreview';
import DestinationPicker from './components/DestinationPicker';
import ExtractionProgress from './components/ExtractionProgress';
import GoogleAuthModal from './components/GoogleAuthModal';
import { View } from './types';

// CẤU HÌNH GOOGLE API (Thay thế bằng thông tin của bạn từ Google Cloud Console)
const CLIENT_ID = '627461813768-32hbllfh1ij4t5f4hj31rvgfbtctab9h.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Khởi tạo gapi
  useEffect(() => {
    const initGapi = () => {
      // Fix: Use global gapi variable
      gapi.load('client', async () => {
        await gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
      });
    };
    initGapi();
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const navigateTo = useCallback((view: View, archiveId?: string) => {
    if (archiveId) setSelectedArchive(archiveId);
    setCurrentView(view);
  }, []);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    // Fix: Use global gapi variable to set token
    gapi.client.setToken({ access_token: token });
    setShowAuthModal(false);
    navigateTo(View.PICKER);
  };

  const renderView = () => {
    switch (currentView) {
      case View.LANDING:
        return <LandingPage onConnect={() => setShowAuthModal(true)} />;
      case View.PICKER:
        return (
          <DrivePicker 
            onFileSelect={(id) => navigateTo(View.PREVIEW, id)} 
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            accessToken={accessToken}
          />
        );
      case View.PREVIEW:
        return (
          <ArchivePreview 
            archiveId={selectedArchive || ''} 
            onExtract={() => navigateTo(View.DESTINATION)}
            onBack={() => navigateTo(View.PICKER)}
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
          />
        );
      case View.DESTINATION:
        return (
          <DestinationPicker 
            onCancel={() => navigateTo(View.PREVIEW)} 
            onConfirm={() => navigateTo(View.EXTRACTING)} 
          />
        );
      case View.EXTRACTING:
        return (
          <ExtractionProgress 
            onComplete={() => navigateTo(View.PICKER)} 
            onCancel={() => navigateTo(View.DESTINATION)}
          />
        );
      default:
        return <LandingPage onConnect={() => setShowAuthModal(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {renderView()}
      {showAuthModal && (
        <GoogleAuthModal 
          onSuccess={handleAuthSuccess} 
          onClose={() => setShowAuthModal(false)}
          clientId={CLIENT_ID}
          scopes={SCOPES}
        />
      )}
    </div>
  );
};

export default App;