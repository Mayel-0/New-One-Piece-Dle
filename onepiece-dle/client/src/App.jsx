import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header.jsx';
import GameSolo from './pages/SoloPage.jsx';
import DuelPage from './pages/DuelPage.jsx';

function App() {
  return (
    <Router>
      <Header />
      <nav style={{ padding: '10px', background: '#222' }}>
        <Link to="/" style={{ color: 'white', marginRight: '20px' }}>Solo</Link>
        <Link to="/duel" style={{ color: 'gold' }}>Mode Duel ⚔️</Link>
      </nav>

      <Routes>
        <Route path="/" element={<GameSolo />} />
        <Route path="/duel" element={<DuelPage />} />
      </Routes>
    </Router>
  );
}

export default App;
