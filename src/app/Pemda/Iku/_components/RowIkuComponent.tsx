import React from 'react'
import { IkuPemda, IkuPemdaTargetRealisasiCapaian } from '@/types'
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { formatPercentageText } from '@/lib/formatPercentageText';

interface RowIkuComponentProps {
    no: number;
    ikuPemda: IkuPemda;
    tahun: number;
    dataTargetRealisasi: IkuPemdaTargetRealisasiCapaian[];
    handleOpenPrintPreview: () => void;
}

export default function RowIkuComponent({
    no,
    ikuPemda,
    tahun,
    dataTargetRealisasi,
    handleOpenPrintPreview
}: RowIkuComponentProps) {
    const targetList = dataTargetRealisasi.filter(r => r.indikatorId === ikuPemda.indikator_id && r.tahun === tahun.toString());

    return (
        <>
            <tr key={ikuPemda.indikator_id}>
                <td className="border-x border-b border-sky-500 py-4 px-3 text-center">{no}</td>
                <td className="border-r border-b border-sky-500 px-6 py-4">{ikuPemda.indikator}</td>
                <td className="border-r border-b border-sky-500 px-6 py-4 text-center">{ikuPemda.asal_iku}</td>
                <td className="border-r border-b border-sky-500 px-6 py-4">{ikuPemda.rumus_perhitungan}</td>
                <td className="border-r border-b border-sky-500 px-6 py-4">{ikuPemda.sumber_data}</td>
                {targetList.length > 0 ? (
                    targetList.map((target, idx) => (
                        <ColTargetIku
                            key={target.targetRealisasiId || idx}
                            target={target.target}
                            realisasi={target.realisasi}
                            satuan={target.satuan}
                            capaian={target.capaian}
                        />
                    ))
                ) : (
                    <td colSpan={4} className="border border-sky-500 px-6 py-4 text-center text-gray-400 italic">
                        Tidak ada target
                    </td>
                )}
                <td className="border border-sky-500 px-6 py-4 text-center">
                    <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
                        Cetak
                    </ButtonGreenBorder>
                </td>
            </tr>
        </>
    )
}

const ColTargetIku: React.FC<{
    target: string;
    realisasi: number;
    satuan: string;
    capaian: string;
}> = ({
    target,
    realisasi,
    satuan,
    capaian
}) => {
        return (
            <>
                <td className="border border-sky-500 px-6 py-4 text-center">{target}</td>
                <td className="border border-sky-500 px-6 py-4 text-center">{realisasi}</td>
                <td className="border border-sky-500 px-6 py-4 text-center">{satuan}</td>
                <td className="border border-sky-500 px-6 py-4 text-center">{formatPercentageText(capaian)}</td>
            </>
        );
    }
