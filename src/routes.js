import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentPage from './pages/StudentPage';
import DrivePage from './pages/DrivePage';
import ReportPage from './pages/ReportPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/students" element={<StudentPage />} />
    <Route path="/drives" element={<DrivePage />} />
    <Route path="/reports" element={<ReportPage />} />
  </Routes>
);

export default AppRoutes;