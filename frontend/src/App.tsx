import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonaPage from './pages/PersonaPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/persona/:id" element={<PersonaPage />} />
    </Routes>
  );
}
