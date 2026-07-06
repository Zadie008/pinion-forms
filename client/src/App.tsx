import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import FormBuilder from './FormBuilder';
import RespondForm from './RespondForm';
import ViewResponses from './ViewResponses';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/edit/:formId" element={<FormBuilder />} />
        <Route path="/admin/responses/:formId" element={<ViewResponses />} />
        <Route path="/respond/:formId" element={<RespondForm />} />
      </Routes>
    </BrowserRouter>
  );
}