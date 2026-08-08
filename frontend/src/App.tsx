import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';
import SetupPage from './pages/SetupPage';

export default function App() {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.getArchivoRoot().then(root => {
      setReady(root !== null);
    });
  }, []);

  if (ready === null) return null;
  if (!ready) return <SetupPage onSetup={() => setReady(true)} />;

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/persona/:id" element={<PersonaPage />} />
    </Routes>
  );
}
