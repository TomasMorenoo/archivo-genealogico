import { useEffect, useRef, useState } from 'react';
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
  const [whatsNew, setWhatsNew] = useState<{ lastSeenId: number; channel: 'stable' | 'beta' } | null>(null);
  const channelRef = useRef<'stable' | 'beta'>('stable');

  useEffect(() => {
    if (!window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.getArchivoRoot().then(root => {
      setReady(root !== null);
    });
    window.electronAPI.checkWhatsNew().then(({ isNew, lastSeenId, channel }) => {
      channelRef.current = channel;
      if (isNew) setWhatsNew({ lastSeenId, channel });
    });
    const unlisten = window.electronAPI.onOpenWhatsNew(() => {
      setWhatsNew({ lastSeenId: 0, channel: channelRef.current });
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
      {whatsNew && <WhatsNew lastSeenId={whatsNew.lastSeenId} channel={whatsNew.channel} onClose={() => setWhatsNew(null)} />}
    </>
  );
}
