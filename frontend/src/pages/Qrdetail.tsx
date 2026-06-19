import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQrAppointment } from '@/lib/appointments';
import { QueueStatusBadge } from "@/components/QueueStatusBadge";
import { formatBuddhistDate, formatTimeRange } from '@/lib/format';

export default function QrDetail() {
    const { id } = useParams<{ id: string }>();
    const { state, refetch } = useQrAppointment(id);

    // อัปเดตคิวทุก 5 วินาที
    useEffect(() => {
        refetch();
    }, [refetch]);

    if (!state || state.kind === 'submitting') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <img src="/carekan-logo.jpg" alt="CareKan" className="h-10 mb-4 object-contain" />
                <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
                    <img src="/carekan-logo.jpg" alt="CareKan" className="h-10 mx-auto mb-5 object-contain" />
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-2">ไม่พบข้อมูลคิว</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        QR Code นี้ไม่ถูกต้อง<br className="hidden sm:block" /> หรือหมดอายุแล้ว
                    </p>
                </div>
            </div>
        );
    }

    if (state.kind === 'idle') {
        return null;
    }

    const appt = state.data;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-md mx-auto">
                
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-5 text-center mb-4 border border-gray-100">
                    <img
                        src="/carekan-logo.jpg"
                        alt="CareKan"
                        className="h-12 mx-auto mb-3 object-contain"
                    />
                    <h1 className="text-xl font-bold text-gray-800">
                        ตรวจสอบสถานะคิว
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        จุดแสดงคิวสแกน QR
                    </p>
                </div>

                {/* Queue Number */}
                <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-4 border border-gray-100">
                    <p className="text-gray-500 text-sm uppercase tracking-wide">
                        หมายเลขคิว
                    </p>
                    <h2 className="text-6xl font-bold tracking-widest mt-2 text-gov-ink">
                        {appt.queueNumber}
                    </h2>
                </div>

                {/* Status */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-4 border border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        สถานะคิวปัจจุบัน
                    </p>
                    <QueueStatusBadge status={appt.status} />
                </div>

                {/* Patient Detail */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-5 border border-gray-100">
                    <div>
                        <h3 className="font-bold text-lg border-b border-gray-100 pb-2 mb-3">
                            ข้อมูลผู้รับบริการ
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                            ชื่อผู้ป่วย
                        </p>
                        <p className="font-semibold text-lg text-gray-800">
                            {appt.userFullName}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">
                                วันที่นัด
                            </p>
                            <p className="font-medium text-gray-800">
                                {formatBuddhistDate(appt.date)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">
                                ช่วงเวลา
                            </p>
                            <p className="font-medium text-gray-800">
                                {formatTimeRange(appt.startTime, appt.endTime)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}