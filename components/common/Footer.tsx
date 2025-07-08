import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 w-full bg-slate-900/95 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-2 z-40 backdrop-blur-md">
        <span className="truncate text-center">
          Data provided by DESCO Open APIs. This is an unofficial client.
        </span>
        <span className="hidden sm:inline mx-2">|</span>
        <button
          className="underline hover:text-cyan-400 focus:outline-none"
          onClick={() => setShowModal(true)}
          aria-label="Privacy and Disclaimer"
        >
          Privacy
        </button>
      </footer>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 relative m-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Privacy & Disclaimer</h2>
            <div className="mb-4 text-slate-300 text-sm bg-slate-700/60 rounded p-3">
              <p className="mb-2">This app is <b>not affiliated with or endorsed by DESCO</b>. It is provided for your convenience only.</p>
              <p className="mb-2">We <b>do not store or persist any of your account data on our servers</b>. All information is processed locally in your browser and never leaves your device.</p>
              <p className="mb-2">Your data is used solely to display your account information and is never shared with third parties.</p>
              <p className="text-xs text-slate-500 mt-2">For more information, contact the developer.</p>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white font-semibold" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer; 