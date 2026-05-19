import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Activities from './pages/Activities';
import Login from './pages/Login';
import Register from './pages/Register';
import News from './pages/News';
import ActivityDetail from './pages/ActivityDetail';
import Profile from './pages/Profile';
import CrearOrganizacion from './pages/CrearOrganizacion';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/actividades" element={<Activities />} />
          <Route path="/actividades/:id" element={<ActivityDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/noticias" element={<News />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/perfil/:id" element={<Profile />} />
          <Route path="/crear-organizacion" element={<CrearOrganizacion />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;