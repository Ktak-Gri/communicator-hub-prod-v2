type Props = {
  level: number;
};

export const MicLevelMeter = ({ level }: Props) => {
  return (
    <div className="w-full h-3 bg-gray-700 rounded overflow-hidden">
      <div
        className="h-full bg-green-400 transition-all duration-75"
        style={{
          width: `${Math.min(level * 100, 100)}%`,
        }}
      />
    </div>
  );
};