// InputRange.tsx
import React from "react";

type Props = {
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  tooltip?: string; // ツールチップ追加
};

const InputRange: React.FC<Props> = ({
  name,
  min,
  max,
  step,
  value,
  unit,
  setValue,
  tooltip,
}) => {
  return (
    <div className="flex flex-col mt-2 mx-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{name}</label>
        <div className="flex items-center">
          <span className="text-sm mr-1">
            {value}
            {unit}
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          onChange={(e) => setValue(Number(e.target.value))}
        />
        {tooltip && (
          <div className="opacity-0 hover:opacity-100 absolute bottom-full left-0 text-xs bg-gray-700 text-white p-1 rounded mb-1 transition-opacity">
            {tooltip}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputRange;
