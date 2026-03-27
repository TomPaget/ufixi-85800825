export default function LavaLampBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Orange */}
      <div style={{
        position: 'absolute', width: 400, height: 400, top: '5%', left: '-10%',
        background: "radial-gradient(circle, rgba(232,83,10,0.22) 0%, transparent 70%)",
        filter: "blur(80px)",
        animation: "blob1 20s ease-in-out infinite",
        borderRadius: '50%',
      }} />
      {/* Pink */}
      <div style={{
        position: 'absolute', width: 350, height: 350, bottom: '10%', right: '-5%',
        background: "radial-gradient(circle, rgba(217,56,112,0.18) 0%, transparent 70%)",
        filter: "blur(80px)",
        animation: "blob2 24s ease-in-out infinite",
        borderRadius: '50%',
      }} />
      {/* Amber */}
      <div style={{
        position: 'absolute', width: 300, height: 300, top: '40%', left: '30%',
        background: "radial-gradient(circle, rgba(240,144,10,0.16) 0%, transparent 70%)",
        filter: "blur(70px)",
        animation: "blob3 18s ease-in-out infinite",
        borderRadius: '50%',
      }} />
    </div>
  );
}
