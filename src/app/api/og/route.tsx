import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const title = searchParams.get("title") || "Power Play";
  const rink = searchParams.get("rink") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";
  const fw = searchParams.get("fw") || "0/8";
  const df = searchParams.get("df") || "0/4";
  const g = searchParams.get("g") || "0/2";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <span style={{ fontSize: "48px", marginRight: "16px" }}>🏒</span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            Power Play
          </span>
        </div>

        {/* Rink Name */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "bold",
            color: "#ffffff",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          {rink || title}
        </div>

        {/* Date & Time */}
        {date && (
          <div
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              marginBottom: "40px",
            }}
          >
            {date} · {time}
          </div>
        )}

        {/* Roster Info */}
        <div
          style={{
            display: "flex",
            gap: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 40px",
              backgroundColor: "#27272a",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "20px", color: "#3b82f6", marginBottom: "8px" }}>
              FW
            </span>
            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff" }}>
              {fw}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 40px",
              backgroundColor: "#27272a",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "20px", color: "#f97316", marginBottom: "8px" }}>
              DF
            </span>
            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff" }}>
              {df}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 40px",
              backgroundColor: "#27272a",
              borderRadius: "16px",
            }}
          >
            <span style={{ fontSize: "20px", color: "#a855f7", marginBottom: "8px" }}>
              G
            </span>
            <span style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff" }}>
              {g}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
