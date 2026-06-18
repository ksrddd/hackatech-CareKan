import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { CitizenLayout } from './components/CitizenLayout';
import { GuestRoute } from './components/GuestRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './lib/auth';
import { ElderlyModeProvider } from './lib/elderlyMode';
import { AppointmentDetail } from './pages/AppointmentDetail';
import { BookAppointment } from './pages/BookAppointment';
import { BookSuccess } from './pages/BookSuccess';
import { HospitalDetail } from './pages/HospitalDetail';
import { HospitalSearch } from './pages/HospitalSearch';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { MyAppointments } from './pages/MyAppointments';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';

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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ElderlyModeProvider>
    </AuthProvider>
  );
}
