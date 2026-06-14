interface QrStubProps {
  label?: string;
}

export function QrStub({ label }: QrStubProps) {
  return (
    <div className="text-center">
      <div
        className="qr-block mx-auto"
        aria-label={label ?? 'QR Code สำหรับสแกนเช็กอินวันนัด'}
      >
        <span className="qr-corner" />
      </div>
      {label && <p className="text-sm text-gray-500 mt-2">{label}</p>}
    </div>
  );
}
