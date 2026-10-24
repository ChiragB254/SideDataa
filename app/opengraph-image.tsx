import { ImageResponse } from "next/og";

export const alt = "SideData Technologies, Toronto, Ontario, Canada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#faf9f6",
        color: "#1b1f23",
        padding: 80,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{ width: 56, height: 56, border: "4px solid #1b1f23", display: "flex" }}
        >
          <div style={{ width: 20, height: "100%", background: "#2f5d62" }} />
        </div>
        <div style={{ fontSize: 40 }}>SideData Technologies</div>
      </div>
      <div style={{ fontSize: 76, lineHeight: 1.1, maxWidth: 960 }}>
        AI, web, servers, cloud and IT, built and looked after in Toronto.
      </div>
      <div
        style={{
          display: "flex",
          borderTop: "2px solid #d8d4ca",
          paddingTop: 24,
          fontSize: 28,
          color: "#5a6168",
          fontFamily: "sans-serif",
        }}
      >
        sidedataa.com
      </div>
    </div>,
    size,
  );
}
