import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';
import SetupPage from './pages/SetupPage';
import MigracionLugaresPage from './pages/MigracionLugaresPage';
import WhatsNew from './components/WhatsNew/WhatsNew';

function NavigationHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!window.electronAPI) return;
    const unlisten = window.electronAPI.onNavigate((path) => navigate(path));
    return unlisten;
  }, [navigate]);
  return null;
}

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
    const unlisten = window.electronAPI.onOpenWhatsNew(() => {
      window.electronAPI!.getVersion().then(v => setWhatsNew({ version: v }));
    });
    return unlisten;
  }, []);

  if (ready === null) return null;
  if (!ready) return <SetupPage onSetup={() => setReady(true)} />;

  return (
    <>
      <NavigationHandler />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/persona/:id" element={<PersonaPage />} />
        <Route path="/migracion-lugares" element={<MigracionLugaresPage />} />
      </Routes>
      {whatsNew && <WhatsNew version={whatsNew.version} onClose={() => setWhatsNew(null)} />}
    </>
  );
}
