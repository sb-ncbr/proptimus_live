type ErrorDisplayProps = {
  message?: string;
};

export function ErrorDisplay({
  message = "Error loading 3D structure",
}: ErrorDisplayProps) {
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
        padding: "24px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        maxWidth: "280px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          backgroundColor: "#ef4444",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        !
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#7f1d1d",
          fontWeight: "500",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        {message}
      </div>
    </div>
  );
}
