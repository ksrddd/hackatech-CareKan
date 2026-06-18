import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthRoute } from './components/AuthRoute';
import { CitizenLayout } from './components/CitizenLayout';
import { GuestRoute } from './components/GuestRoute';
import { PageLoader } from './components/PageLoader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './lib/auth';
import { ElderlyModeProvider } from './lib/elderlyMode';

const Landing         = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login           = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register        = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const HospitalSearch  = lazy(() => import('./pages/HospitalSearch').then(m => ({ default: m.HospitalSearch })));
const HospitalDetail  = lazy(() => import('./pages/HospitalDetail').then(m => ({ default: m.HospitalDetail })));
const MyAppointments  = lazy(() => import('./pages/MyAppointments').then(m => ({ default: m.MyAppointments })));
const AppointmentDetail = lazy(() => import('./pages/AppointmentDetail').then(m => ({ default: m.AppointmentDetail })));
const BookAppointment = lazy(() => import('./pages/BookAppointment').then(m => ({ default: m.BookAppointment })));
const BookSuccess     = lazy(() => import('./pages/BookSuccess').then(m => ({ default: m.BookSuccess })));
const Profile         = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const RequestApiKey   = lazy(() => import('./pages/RequestApiKey').then(m => ({ default: m.RequestApiKey })));


function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-3">ไม่พบหน้านี้</h1>
      <p className="text-gray-600 mb-5">
        ลิงก์ที่ท่านเข้าถึงอาจไม่ถูกต้อง หรือถูกย้ายไปยังที่อื่นแล้ว
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-3 font-semibold text-white bg-gov-primary border-2 border-gov-primary-dark hover:bg-gov-primary-dark"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ElderlyModeProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<CitizenLayout />}>
                <Route index element={<Landing />} />
                <Route element={<GuestRoute />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                </Route>
                <Route path="search" element={<HospitalSearch />} />
                <Route path="hospitals/:id" element={<HospitalDetail />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="my-appointments" element={<MyAppointments />} />
                  <Route path="appointments/:id" element={<AppointmentDetail />} />
                  <Route path="book" element={<BookAppointment />} />
                  <Route path="book/success/:id" element={<BookSuccess />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                <Route element={<AuthRoute />}>
                  <Route path="request-api-key" element={<RequestApiKey />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ElderlyModeProvider>
    </AuthProvider>
  );
}
