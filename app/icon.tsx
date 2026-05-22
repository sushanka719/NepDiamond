import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Diamond shape */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mountain peaks */}
          <path
            d="M2 14 L7 6 L10 10 L13 6 L18 14 Z"
            fill="white"
            opacity="0.9"
          />
          {/* Diamond overlay */}
          <path
            d="M10 3 L15 8 L10 17 L5 8 Z"
            fill="white"
            opacity="0.3"
          />
          <path
            d="M10 3 L15 8 L10 17 L5 8 Z"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
