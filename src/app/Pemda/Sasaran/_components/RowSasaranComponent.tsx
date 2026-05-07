import React from "react";
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { SasaranPemda, TargetRealisasiCapaianSasaran } from "@/types";
import { formatPercentageText } from "@/lib/formatPercentageText";

interface RowSasaranComponentProps {
  no: number;
  sasaran: SasaranPemda;
  dataTargetRealisasi: TargetRealisasiCapaianSasaran[];
  tahun: number;
  handleOpenPrintPreview: () => void;
  handleOpenModal: (
    sasaran: SasaranPemda,
    dataTargetRealisasi: TargetRealisasiCapaianSasaran[],
  ) => void;
}

export default function RowSasaranComponent({
  no,
  sasaran,
  dataTargetRealisasi,
  tahun,
  handleOpenPrintPreview,
  handleOpenModal,
}: RowSasaranComponentProps) {
  const indikatorList = sasaran.indikator ?? [];

  if (indikatorList.length === 0) {
    return <EmptyIndikatorRow no={no} sasaran={sasaran} tahun={tahun} handleOpenPrintPreview={handleOpenPrintPreview} />;
  }

  return (
    <>
      {indikatorList.map((ind, index) => {
        const targetList = dataTargetRealisasi.filter(
          (r) =>
            r.indikatorId === ind.id.toString() && r.tahun === tahun.toString(),
        );

        return (
          <tr key={ind.id || index}>
            {index === 0 && (
              <>
                <td
                  rowSpan={indikatorList.length}
                  className="border border-red-400 px-6 py-4 text-center"
                >
                  {no}
                </td>
                <td
                  rowSpan={indikatorList.length}
                  className="border border-red-400 px-6 py-4 text-center"
                >
                  {sasaran.sasaran_pemda}
                </td>
              </>
            )}
            <td className="border border-red-400 px-6 py-4 text-center">
              {ind?.indikator ?? "-"}
            </td>
            <td className="border border-red-400 px-6 py-4 text-center">
              {ind?.rumus_perhitungan ?? "-"}
            </td>
            <td className="border border-red-400 px-6 py-4 text-center">
              {ind?.sumber_data ?? "-"}
            </td>
            {targetList.length > 0 ? (
              <>
                {targetList.map((target, idx) => (
                  <ColTargetSasaran
                    key={target.targetRealisasiId || idx}
                    target={target.target}
                    realisasi={target.realisasi}
                    satuan={target.satuan}
                    capaian={target.capaian}
                    keteranganCapaian={target.keteranganCapaian}
                    handleClick={() => {
                      handleOpenModal(sasaran, dataTargetRealisasi);
                    }}
                  />
                ))}
              </>
            ) : (
              <td
                colSpan={5}
                className="border border-red-400 px-6 py-4 text-center text-gray-400 italic"
              >
                Tidak ada target
              </td>
            )}
            <td className="border border-red-400 px-6 py-4 text-center">
              <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
                Cetak
              </ButtonGreenBorder>
            </td>
          </tr>
        );
      })}
    </>
  );
}

const EmptyIndikatorRow: React.FC<{
  sasaran: SasaranPemda;
  no: number;
  tahun: number;
  handleOpenPrintPreview: () => void;
}> = ({ sasaran, no, tahun, handleOpenPrintPreview }) => {
  return (
    <tr key={sasaran.id_sasaran_pemda} className="bg-red-300">
      <td className="border border-red-400 px-6 py-4 text-center">{no}</td>
      <td className="border border-red-400 px-6 py-4 text-center">
        {sasaran.sasaran_pemda}
      </td>
      <td
        colSpan={8}
        className="border border-red-400 px-6 py-4 text-center text-gray-500 italic"
      >
        Tidak ada indikator dan target tahun {tahun}
      </td>
      <td className="border border-red-400 px-6 py-4 text-center">
        <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
          Cetak
        </ButtonGreenBorder>
      </td>
    </tr>
  );
};

const ColTargetSasaran: React.FC<{
  target: string;
  realisasi: number;
  satuan: string;
  capaian: string;
  keteranganCapaian: string;
  handleClick?: () => void;
}> = ({ target, realisasi, satuan, capaian, keteranganCapaian, handleClick }) => {
  return (
    <>
      <td className="border border-red-400 px-6 py-4 text-center">{target}</td>
      <td className="border border-red-400 px-6 py-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <span>{realisasi}</span>
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
      <td className="border border-red-400 px-6 py-4">{formatPercentageText(keteranganCapaian || "-")}</td>
    </>
  );
};
