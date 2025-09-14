"use client";
import ReactPlayer from "react-player";

export default function TestPlayer() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test ReactPlayer</h1>
      <div style={{ position: "relative", paddingTop: "56.25%", maxWidth: 900 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
          <ReactPlayer
            url="https://www.youtube.com/watch?v=SqcY0GlETPk"
            controls
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
