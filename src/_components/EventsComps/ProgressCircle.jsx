"use client";

// Same fill/track colours as the rings on the Event Checklist page
const COLORS = {
  red: "#F13C3F",
  yellow: "#FFAE3C",
  green: "#43AE34",
};

const TRACK_COLORS = {
  red: "#F2BFC5",
  yellow: "#F6E1C5",
  green: "#A0C59C",
};

export default function ProgressCircle({ value, color = "green" }) {
  const [completed, total] = value.split("/").map(Number);

  const size = 55;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const percentage =
    total > 0 && completed >= 0
      ? Math.min(completed / total, 1)
      : 0;

  const dashOffset = circumference * (1 - percentage);

  return (
    <div className="relative w-[55px] h-[55px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TRACK_COLORS[color]}
          strokeWidth={stroke}
        />

        {/* Progress arc */}
        {percentage > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={COLORS[color]}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center text-[15px] font-[700] text-[#333] whitespace-nowrap">
        {value}
      </div>
    </div>
  );
}
