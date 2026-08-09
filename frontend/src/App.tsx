import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';
import SetupPage from './pages/SetupPage';
import WhatsNew from './components/WhatsNew/WhatsNew';

export default function App() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [whatsNew, setWhatsNew] = useState<{ version: string } | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.getArchivoRoot().then(root => {
      setReady(root !== null);
    });
    window.electronAPI.checkWhatsNew().then(({ isNew, version }) => {
      if (isNew) setWhatsNew({ version });
    });
  }, []);

  if (ready === null) return null;
  if (!ready) return <SetupPage onSetup={() => setReady(true)} />;

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/persona/:id" element={<PersonaPage />} />
      </Routes>
      {whatsNew && <WhatsNew version={whatsNew.version} onClose={() => setWhatsNew(null)} />}
    </>
  );
}
