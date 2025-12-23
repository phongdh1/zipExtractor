
import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import DrivePicker from './components/DrivePicker';
import ArchivePreview from './components/ArchivePreview';
import DestinationPicker from './components/DestinationPicker';
import ExtractionProgress from './components/ExtractionProgress';
import GoogleAuthModal from './components/GoogleAuthModal';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const navigateTo = useCallback((view: View, archiveId?: string) => {
    if (archiveId) setSelectedArchive(archiveId);
    setCurrentView(view);
  }, []);

  const handleAuthSuccess = () => {
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
          />
        );
      case View.PREVIEW:
        return (
          <ArchivePreview 
            archiveId={selectedArchive || 'project-backup-2023.zip'} 
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
        />
      )}
    </div>
  );
};

export default App;
