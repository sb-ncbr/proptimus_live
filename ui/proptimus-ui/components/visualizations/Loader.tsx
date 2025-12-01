type LoaderProps = {
  message?: string;
};

export function Loader({ message = "Loading 3D structure..." }: LoaderProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx={true}>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {message}
      </div>
    </div>
  );
}
