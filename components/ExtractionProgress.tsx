
import React, { useState, useEffect } from 'react';

interface ExtractionProgressProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({ onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing extraction...');
  const [currentFile, setCurrentFile] = useState('Checking project-backup-2023.zip');
  const [isSuccess, setIsSuccess] = useState(false);

  const steps = [
    { threshold: 10, status: 'Analyzing archive structure...', file: 'Reading metadata' },
    { threshold: 25, status: 'Scanning for conflicts...', file: 'Checking destination folder' },
    { threshold: 45, status: 'Decompressing images/', file: 'logo.png' },
    { threshold: 65, status: 'Decompressing images/', file: 'banner.jpg' },
    { threshold: 85, status: 'Writing to Google Drive...', file: 'design_specs.docx' },
    { threshold: 95, status: 'Finalizing...', file: 'report.pdf' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 5;
        
        const currentStep = steps.find(s => next <= s.threshold);
        if (currentStep) {
          setStatus(currentStep.status);
          setCurrentFile(currentStep.file);
        }

        if (next >= 100) {
          clearInterval(timer);
          setIsSuccess(true);
          return 100;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="size-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="material-symbols-outlined text-4xl filled">check_circle</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Extraction Complete!</h2>
          <p className="text-gray-500 mb-8">Successfully extracted 7 files to "Campaign Assets 2024".</p>
          <button 
            onClick={onComplete}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
          >
            Go to My Drive
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-lg bg-white dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined filled">unarchive</span>
              </div>
              <div>
                <h2 className="font-black text-lg">Extracting Files...</h2>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{Math.round(progress)}% Complete</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{status}</span>
                <span className="text-xs font-mono text-primary font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_12px_rgba(19,127,236,0.4)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-gray-400">description</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentFile}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Writing to destination...</p>
              </div>
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Client-Side Engine Active</p>
          <button 
            onClick={onCancel}
            className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg"
          >
            Cancel Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
