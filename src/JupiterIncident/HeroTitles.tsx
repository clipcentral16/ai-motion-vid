import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { HERO_BADGE, SCENE_STARTS } from "./constants";

const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/LilitaOne-Regular.ttf") });

const GOLD = "linear-gradient(180deg, #fff3b0 0%, #ffd166 45%, #c98a1b 100%)";

/** "TRUE HERO" badge while he lies there, then the end title card. */
export const HeroTitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeAt = SCENE_STARTS[5] + Math.round(HERO_BADGE * fps);
  const endAt = SCENE_STARTS[6];

  const badge = spring({ frame: frame - badgeAt, fps, config: { damping: 10, stiffness: 120 } });
  const end = spring({ frame: frame - endAt - 4, fps, config: { damping: 12, stiffness: 110 } });
  const sub = interpolate(frame, [endAt + 18, endAt + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const showBadge = frame >= badgeAt && frame < endAt;
  const showEnd = frame >= endAt;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", alignItems: "center" }}>
      {showBadge ? (
        <div style={{ position: "absolute", top: 330, transform: `scale(${badge}) rotate(${(1 - badge) * -12}deg)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: FONT, fontSize: 64, letterSpacing: "0.3em", color: "#ffd166", textShadow: "0 0 24px rgba(255,190,80,0.7)" }}>★ ★ ★</div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 150,
              lineHeight: 1,
              background: GOLD,
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "4px #3d2a00",
              filter: "drop-shadow(0 8px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,180,60,0.5))",
            }}
          >
            TRUE HERO
          </div>
        </div>
      ) : null}
      {showEnd ? (
        <div style={{ position: "absolute", top: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: `scale(${0.6 + 0.4 * end})`, opacity: Math.min(1, end * 1.5) }}>
          <div style={{ fontFamily: FONT, fontSize: 52, letterSpacing: "0.25em", color: "rgba(255,241,201,0.85)" }}>THE ONLY SURVIVOR</div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 210,
              lineHeight: 0.95,
              background: GOLD,
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "5px #3d2a00",
              filter: "drop-shadow(0 10px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 40px rgba(255,180,60,0.55))",
            }}
          >
            CASEOH
          </div>
          <div style={{ fontFamily: FONT, fontSize: 60, color: "#ffffff", opacity: sub, letterSpacing: "0.06em" }}>
            TRUE HERO <span style={{ fontFamily: "'Noto Color Emoji'" }}>🏅</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, color: "rgba(220,235,225,0.6)", opacity: sub, letterSpacing: "0.12em" }}>JUPITER I · 2011</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
