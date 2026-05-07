import React from 'react';
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { formatPercentageText } from "@/lib/formatPercentageText";

type TargetColProps = {
  target: string;
  realisasi: string;
  satuan: string;
  capaian: string;
  keteranganCapaian: string;
  handleClick?: () => void;
};

const convertToDisplayString = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\./g, ',');
};

const ColTargetTujuanComponent: React.FC<TargetColProps> = ({ target, realisasi, satuan, capaian, keteranganCapaian, handleClick }) => {

  return (
    <React.Fragment>
      <td className="border border-red-400 px-6 py-4 text-center">{convertToDisplayString(target)}</td>
      <td className="border border-red-400 px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <span>{convertToDisplayString(realisasi)}</span>
          {handleClick && (
            <ButtonGreenBorder
              className="w-full"
              onClick={handleClick}
            >
              Realisasi
            </ButtonGreenBorder>
          )}
        </div>
      </td>
      <td className="border border-red-400 px-6 py-4 text-center">{satuan}</td>
      <td className="border border-red-400 px-6 py-4 text-center">{formatPercentageText(capaian)}</td>
      <td className="border border-red-400 px-6 py-4">{formatPercentageText(keteranganCapaian || '-')}</td>
    </React.Fragment>
  );
}

export default ColTargetTujuanComponent;
