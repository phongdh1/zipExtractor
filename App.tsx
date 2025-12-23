// Declare gapi as a global constant to satisfy TypeScript compiler
declare const gapi: any;

import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DrivePicker from './components/DrivePicker';
import ArchivePreview from './components/ArchivePreview';
import DestinationPicker, { ExtractionConfig } from './components/DestinationPicker';
import ExtractionProgress from './components/ExtractionProgress';
import GoogleAuthModal from './components/GoogleAuthModal';
import { View } from './types';

// CẤU HÌNH GOOGLE API
const CLIENT_ID = '627461813768-32hbllfh1ij4t5f4hj31rvgfbtctab9h.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [selectedArchiveName, setSelectedArchiveName] = useState<string>('');
  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Khôi phục token từ sessionStorage nếu có
    return sessionStorage.getItem('drive_access_token');
  });
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

  useEffect(() => {
    const initGapi = () => {
      gapi.load('client', async () => {
        await gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        
        // Nếu đã có token từ trước, thiết lập cho gapi client luôn
        if (accessToken) {
          gapi.client.setToken({ access_token: accessToken });
          // Nếu đã có token, có thể tự động chuyển sang màn hình PICKER
          if (currentView === View.LANDING) {
            setCurrentView(View.PICKER);
          }
        }
      });
    };
    initGapi();
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    // Lưu vào sessionStorage để duy trì phiên
    sessionStorage.setItem('drive_access_token', token);
    gapi.client.setToken({ access_token: token });
    setShowAuthModal(false);
    setCurrentView(View.PICKER);
  };

  const handleLogout = () => {
    setAccessToken(null);
    sessionStorage.removeItem('drive_access_token');
    setCurrentView(View.LANDING);
  };

  const startExtraction = (config: ExtractionConfig) => {
    setExtractionConfig(config);
    setCurrentView(View.EXTRACTING);
  };

  const renderView = () => {
    switch (currentView) {
      case View.LANDING:
        return <LandingPage onConnect={() => setShowAuthModal(true)} />;
      case View.PICKER:
        return (
          <DrivePicker 
            onFileSelect={(id) => {
              setSelectedArchiveId(id);
              setCurrentView(View.PREVIEW);
            }} 
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            accessToken={accessToken}
          />
        );
      case View.PREVIEW:
        return (
          <ArchivePreview 
            archiveId={selectedArchiveId || ''} 
            accessToken={accessToken}
            onExtract={(name) => {
              setSelectedArchiveName(name);
              setCurrentView(View.DESTINATION);
            }}
            onBack={() => setCurrentView(View.PICKER)}
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
          />
        );
      case View.DESTINATION:
        return (
          <DestinationPicker 
            archiveName={selectedArchiveName || 'Archive.zip'} 
            onCancel={() => setCurrentView(View.PREVIEW)} 
            onConfirm={startExtraction} 
            accessToken={accessToken}
          />
        );
      case View.EXTRACTING:
        return (
          <ExtractionProgress 
            archiveId={selectedArchiveId || ''}
            config={extractionConfig!}
            accessToken={accessToken}
            onComplete={() => setCurrentView(View.PICKER)} 
            onCancel={() => setCurrentView(View.DESTINATION)}
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
