
import React from 'react';

interface LandingPageProps {
  onConnect: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onConnect }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-background-dark/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined !text-[20px]">folder_zip</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight">ZIP Extractor</h2>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-sm font-medium transition-colors text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined !text-[18px]">help</span>
            <span className="hidden sm:inline">Need Help?</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 md:px-10 py-10">
        <div className="w-full max-w-5xl flex flex-col gap-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-6 order-2 lg:order-1">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 w-fit border border-blue-100 dark:border-blue-800">
                  <span className="material-symbols-outlined text-primary text-sm">lock</span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Secure Client-Side Extraction</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Extract ZIP files directly in your browser
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-[540px]">
                  Unzip, view, and save files from your Google Drive without downloading them. Connect your account to seamlessly integrate with your workflow.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={onConnect}
                  className="flex h-12 items-center justify-center gap-3 rounded-lg bg-primary px-6 text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                >
                  <div className="bg-white rounded-sm p-0.5 flex items-center justify-center size-5">
                    <svg className="w-full h-full" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.6 40.8l4.8-8.4-4.8-8.4L0 40.8h9.6zm4.8-25.2h19.2L24 0l-9.6 15.6zm10.8 7.2l-4.8 8.4 9.6 16.8h19.2l-4.8-8.4-19.2-16.8z" fill="#00AC47"></path>
                      <path d="M0 40.8h9.6l4.8-8.4-4.8-8.4L0 40.8zm14.4-25.2h19.2L24 0l-9.6 15.6zm10.8 7.2l-4.8 8.4 9.6 16.8h19.2l-4.8-8.4-19.2-16.8z" fill="#EA4335"></path>
                      <path d="M9.6 40.8l4.8-8.4-4.8-8.4L0 40.8h9.6zm4.8-25.2h19.2L24 0l-9.6 15.6zm10.8 7.2l-4.8 8.4 9.6 16.8h19.2l-4.8-8.4-19.2-16.8z" fill="#FFC107"></path>
                      <path d="M25.2 22.8l-4.8 8.4 9.6 16.8h19.2l-4.8-8.4-19.2-16.8zM9.6 40.8l4.8-8.4-4.8-8.4L0 40.8h9.6zm4.8-25.2h19.2L24 0l-9.6 15.6z" fill="#188038"></path>
                      <path d="M0 40.8h9.6l4.8-8.4-4.8-8.4L0 40.8zm14.4-25.2h19.2L24 0l-9.6 15.6zM49.2 40.8h-19.2l-9.6-16.8 4.8-8.4 24 25.2z" fill="#2684FC"></path>
                    </svg>
                  </div>
                  <span className="font-bold text-base tracking-wide">Connect to Google Drive</span>
                </button>
                <button className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 text-slate-700 dark:text-slate-200 font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                  <span>Learn More</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                By connecting, you agree to our <a className="underline hover:text-primary" href="#">Terms of Service</a> and <a className="underline hover:text-primary" href="#">Privacy Policy</a>.
              </p>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden group">
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#137fec 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-4 w-28 h-36 bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl shadow-lg transform -rotate-6 z-10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-5xl drop-shadow-md">folder_zip</span>
                      <div className="absolute -top-3 -right-3 bg-white dark:bg-slate-700 rounded-full p-2 shadow-md">
                        <span className="material-symbols-outlined text-green-500 !text-sm">check_circle</span>
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-0 w-24 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-primary animate-[pulse_2s_infinite]"></div>
                    </div>
                    <div className="absolute right-1/4 top-1/2 -translate-y-1/2 translate-x-4 w-28 h-36 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg transform rotate-6 z-10 flex items-center justify-center flex-col gap-2">
                      <span className="material-symbols-outlined text-white text-5xl drop-shadow-md">cloud_upload</span>
                      <span className="text-white text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">Drive</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-10 border-t border-slate-200 dark:border-slate-800">
            {[
              { icon: 'shield_lock', title: 'Client-side Security', desc: 'Your files never leave your browser during extraction. The process happens locally for maximum privacy.', color: 'green' },
              { icon: 'cloud_off', title: 'No Uploads Needed', desc: 'Save bandwidth and time. Work directly with your files without re-uploading to a third-party server.', color: 'blue' },
              { icon: 'save_as', title: 'Instant Drive Save', desc: 'Extracted files are saved immediately back to your Google Drive in the folder you choose.', color: 'purple' }
            ].map((f, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors duration-200">
                <div className={`w-10 h-10 rounded-lg bg-${f.color}-100 dark:bg-${f.color}-900/30 flex items-center justify-center text-${f.color}-600 dark:text-${f.color}-400`}>
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 dark:text-slate-500 text-sm">© 2024 ZIP Extractor Pro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="text-slate-500 dark:text-slate-400 text-sm hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-slate-500 dark:text-slate-400 text-sm hover:text-primary transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
