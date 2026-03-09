/**
 * MobileControls — on-screen touch buttons for mobile play.
 *
 * Left flipper button (left side), Launch button (center), Right flipper (right).
 * Uses pointer events (supports both touch and mouse).
 */

'use client';

interface Props {
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
  onLaunchDown: () => void;
  onLaunchUp: () => void;
  launchCharge: number;  // 0–1, for the charge indicator
  isLaunching: boolean;
}

interface FlipperBtnProps {
  label: string;
  onDown: () => void;
  onUp: () => void;
  side: 'left' | 'right';
}

function FlipperBtn({ label, onDown, onUp, side }: FlipperBtnProps) {
  return (
    <button
      className="flex items-center justify-center rounded-xl select-none active:scale-95 transition-transform"
      style={{
        width: '120px',
        height: '56px',
        background: 'linear-gradient(135deg, #0a0a2a, #141444)',
        border: '2px solid #00e5ff55',
        color: '#00e5ff',
        fontSize: '11px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: '2px',
        boxShadow: '0 0 10px #00e5ff33',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={e => e.preventDefault()}
    >
      {side === 'left' ? '◄ ' : ' ►'}{label}
    </button>
  );
}

export default function MobileControls({
  onLeftDown, onLeftUp,
  onRightDown, onRightUp,
  onLaunchDown, onLaunchUp,
  launchCharge,
  isLaunching,
}: Props) {
  const chargePercent = Math.round(launchCharge * 100);
  const chargeColor = launchCharge < 0.5 ? '#00ff88' : launchCharge < 0.8 ? '#ffcc00' : '#ff3300';

  return (
    <div
      className="flex items-center justify-between px-4 py-2 select-none"
      style={{ height: '60px', background: '#04001088', borderTop: '1px solid #220044' }}
    >
      {/* Left flipper */}
      <FlipperBtn label="FLIP" side="left" onDown={onLeftDown} onUp={onLeftUp} />

      {/* Launch button */}
      <button
        className="flex flex-col items-center justify-center rounded-xl select-none transition-transform active:scale-95"
        style={{
          width: '100px',
          height: '52px',
          background: isLaunching
            ? `linear-gradient(135deg, #110033, #220055)`
            : 'linear-gradient(135deg, #0d0d2a, #1a1a44)',
          border: `2px solid ${isLaunching ? chargeColor : '#7700ff55'}`,
          color: isLaunching ? chargeColor : '#aa66ff',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          letterSpacing: '1px',
          fontSize: '11px',
          boxShadow: isLaunching ? `0 0 12px ${chargeColor}55` : '0 0 8px #7700ff33',
          touchAction: 'none',
          WebkitUserSelect: 'none',
        }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); onLaunchDown(); }}
        onPointerUp={onLaunchUp}
        onPointerCancel={onLaunchUp}
        onContextMenu={e => e.preventDefault()}
      >
        {isLaunching ? (
          <>
            <span style={{ fontSize: '10px' }}>HOLD</span>
            <div
              style={{
                width: '70px', height: '4px', background: '#111133',
                borderRadius: '2px', overflow: 'hidden', marginTop: '3px',
              }}
            >
              <div
                style={{
                  width: `${chargePercent}%`, height: '100%',
                  background: chargeColor, borderRadius: '2px',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </>
        ) : (
          <span>LAUNCH</span>
        )}
      </button>

      {/* Right flipper */}
      <FlipperBtn label="FLIP" side="right" onDown={onRightDown} onUp={onRightUp} />
    </div>
  );
}
