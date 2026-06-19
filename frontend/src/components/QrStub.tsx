import { QRCodeSVG } from "qrcode.react";

interface QrStubProps {
  queue_id: any;
  fullname?: string;
  status?: string;
}

export function QrStub(label: QrStubProps) {
  const qr_url = `${window.location.origin}/scanned/${label.queue_id}`;
  return (
    <div className="flex justify-center align-middle">
      <QRCodeSVG
      className="mt-auto"
      value={qr_url}
      size={230}
      />
    </div>
  );
}
