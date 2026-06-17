import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { CitizenLayout } from './components/CitizenLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './lib/auth';
import { BookingsProvider } from './lib/bookingsStore';
import { ElderlyModeProvider } from './lib/elderlyMode';
import { AppointmentDetail } from './pages/AppointmentDetail';
import { BookAppointment } from './pages/BookAppointment';
import { BookSuccess } from './pages/BookSuccess';
import { HospitalDetail } from './pages/HospitalDetail';
import { HospitalSearch } from './pages/HospitalSearch';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { MyAppointments } from './pages/MyAppointments';
import { Register } from './pages/Register';
import { UserFlow } from './pages/UserFlow';

// Code-split admin bundle — citizen users never download it.
// Saves ~25 KB on the initial citizen page load and keeps the
// admin module hot-reloadable during admin-side dev work.
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
);
const QueueView = lazy(() =>
  import('./pages/admin/QueueView').then((m) => ({ default: m.QueueView })),
);

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

function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-gray-500">
      กำลังโหลดหน้าเจ้าหน้าที่…
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ElderlyModeProvider>
        <BookingsProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<CitizenLayout />}>
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="search" element={<HospitalSearch />} />
                <Route path="hospitals/:id" element={<HospitalDetail />} />
                <Route path="user-flow" element={<UserFlow />} />

                <Route element={<ProtectedRoute role="citizen" />}>
                  <Route path="my-appointments" element={<MyAppointments />} />
                  <Route
                    path="appointments/:id"
                    element={<AppointmentDetail />}
                  />
                  <Route path="book" element={<BookAppointment />} />
                  <Route path="book/success/:id" element={<BookSuccess />} />
                </Route>
              </Route>

              <Route path="admin" element={<AdminLayout />}>
                <Route element={<ProtectedRoute role="admin" />}>
                  <Route
                    index
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminDashboard />
                      </Suspense>
                    }
                  />
                  <Route
                    path="queue"
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <QueueView />
                      </Suspense>
                    }
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BookingsProvider>
      </ElderlyModeProvider>
    </AuthProvider>
  );
}
