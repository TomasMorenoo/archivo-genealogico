import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';
import SetupPage from './pages/SetupPage';
import MigracionLugaresPage from './pages/MigracionLugaresPage';
import ArbolPage from './pages/ArbolPage';
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
  const [whatsNew, setWhatsNew] = useState<{ lastSeenId: number } | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.getArchivoRoot().then(root => {
      setReady(root !== null);
    });
    window.electronAPI.checkWhatsNew().then(({ isNew, lastSeenId }) => {
      if (isNew) setWhatsNew({ lastSeenId });
    });
    const unlisten = window.electronAPI.onOpenWhatsNew(() => {
      setWhatsNew({ lastSeenId: 0 });
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
        <Route path="/arbol" element={<ArbolPage />} />
      </Routes>
      {whatsNew && <WhatsNew lastSeenId={whatsNew.lastSeenId} onClose={() => setWhatsNew(null)} />}
    </>
  );
}
