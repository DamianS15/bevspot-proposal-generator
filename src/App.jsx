import { useEffect } from 'react';
import { initGenerator } from './script';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import CompanyDetails from './components/CompanyDetails';
import ClientDetails from './components/ClientDetails';
import AgreementDetails from './components/AgreementDetails';
import TermsPreview from './components/TermsPreview';
import GenerateArea from './components/GenerateArea';

export default function App() {
  useEffect(() => {
    // Run after paint so all DOM nodes exist; return cleanup for HMR safety
    const timeoutId = setTimeout(() => {
      const cleanup = initGenerator();
      // Store cleanup so the effect teardown can call it
      if (typeof cleanup === 'function') {
        window.__bevspot_cleanup = cleanup;
      }
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      if (typeof window.__bevspot_cleanup === 'function') {
        window.__bevspot_cleanup();
        delete window.__bevspot_cleanup;
      }
    };
  }, []);

  return (
    <>
      <Topbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">
          <h1 className="page-title">BevSpot Proposal Generator</h1>
          <p className="page-subtitle">Fill in the fields below to customize and generate a new proposal PDF.</p>
          
          <CompanyDetails />
          <ClientDetails />
          <AgreementDetails />
          <TermsPreview />
          <GenerateArea />
        </main>
      </div>
    </>
  );
}
