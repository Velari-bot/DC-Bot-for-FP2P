import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';

import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from './components/Navbar/NavBar';
import Footer from './components/Footer/Footer';

import Index from './pages/index';
import BeginnerMasterclass from './pages/beginnerMasterclass';
import Coaching from './pages/coaching';
import IntermediateMasterclass from './pages/intermediateMasterclass';
import AdvancedMasterclass from './pages/advancedMasterclass';
import FightingMasterclass from './pages/fightingMasterclass';
import PaymentSuccess from "./pages/paymentSuccess"
import LoginSuccess from "./pages/loginSuccess"
import Claim from "./pages/claim"
import AdminDashboard from "./pages/Admin";
import CoursePlayer from "./pages/CoursePlayer";
import PurchaseTest from "./pages/PurchaseTest";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import Refunds from "./pages/refunds";
import TranscribePage from "./pages/TranscribePage";

import { UploadProvider } from './contexts/UploadContext';
import UploadWidget from './components/Upload/UploadWidget';

const App = () => {
  const { pathname } = useLocation();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    AOS.init({
      once: false,
      offset: 100,
      anchorPlacement: 'top-bottom',
    });
  }, []);

  return (
    <UploadProvider>
      <div className="min-h-screen w-full bg-[#050505]">
        <Navbar />
        <main className='min-h-[calc(100dvh-250px)]'>
          <Routes>
            {/* General Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/beginner-masterclass" element={<BeginnerMasterclass />} />
            <Route path="/intermediate-masterclass" element={<IntermediateMasterclass />} />
            <Route path="/advanced-masterclass" element={<AdvancedMasterclass />} />
            <Route path="/fighting-masterclass" element={<FightingMasterclass />} />
            <Route path="/coaching" element={<Coaching />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* New Course Player Route */}
            <Route path="/course/:courseId" element={<CoursePlayer />} />

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/login-success" element={<LoginSuccess />} />
            <Route path="/claim" element={<Claim />} />
            <Route path="/test-purchase" element={<PurchaseTest />} />

            {/* Legal Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refunds" element={<Refunds />} />

            {/* Transcription Tool */}
            <Route path="/transcribe" element={<TranscribePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!pathname.startsWith('/course/') && pathname !== '/claim' && <Footer />}
        <UploadWidget />
      </div>
    </UploadProvider>
  );
};

export default App;