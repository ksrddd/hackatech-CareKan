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

    // สถานะกำลังโหลด
    if (!state || state.kind === 'submitting') {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                กำลังโหลดข้อมูล...
            </div>
        );
    }

    // สถานะเมื่อเกิดข้อผิดพลาด หรือไม่พบข้อมูล
    if (state.kind === 'error') {
        return (
            <div className="max-w-md mx-auto mt-10 text-center px-4">
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <p className="text-xl font-bold text-red-500">
                        ไม่พบข้อมูลคิว
                    </p>
                    <p className="text-gray-500 mt-2">
                        QR Code นี้ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง
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