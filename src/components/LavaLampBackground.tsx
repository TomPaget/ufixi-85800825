export default function LavaLampBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Orange */}
      <div style={{
        position: 'absolute', width: 600, height: 600, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(232,83,10,0.28) 0%, rgba(232,83,10,0.08) 55%, transparent 100%)",
        filter: "blur(70px)",
        animation: "blob1 14s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Pink */}
      <div style={{
        position: 'absolute', width: 520, height: 520, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(217,56,112,0.22) 0%, rgba(217,56,112,0.06) 55%, transparent 100%)",
        filter: "blur(65px)",
        animation: "blob2 17s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Amber */}
      <div style={{
        position: 'absolute', width: 540, height: 540, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(240,144,10,0.25) 0%, rgba(240,144,10,0.07) 55%, transparent 100%)",
        filter: "blur(60px)",
        animation: "blob3 13s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Warm peach */}
      <div style={{
        position: 'absolute', width: 460, height: 460, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,180,80,0.18) 0%, rgba(255,140,40,0.05) 55%, transparent 100%)",
        filter: "blur(55px)",
        animation: "blob4 16s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
    </div>
  );
}
