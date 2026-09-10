import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TradeAnalytics from './pages/TradeAnalytics';
import Alerts from './pages/Alerts';
import MarketPressure from './pages/MarketPressure';
import Navigation from './components/Navigation';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white">
        {isAuthenticated && <Navigation />}
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/market-pressure"
            element={isAuthenticated ? <MarketPressure /> : <Navigate to="/login" />}
          />
          <Route
            path="/trade-analytics"
            element={isAuthenticated ? <TradeAnalytics /> : <Navigate to="/login" />}
          />
          <Route
            path="/alerts"
            element={isAuthenticated ? <Alerts /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
