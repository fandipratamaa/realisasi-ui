import React from 'react'
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { TujuanOpdRealisasiGrouped } from '@/types';
import { formatPercentageText } from '@/lib/formatPercentageText';

interface RowTujuanComponentProps {
    no: number;
    tujuan: TujuanOpdRealisasiGrouped;
    tahun: number;
    canEdit: boolean;
    handleOpenPrintPreview: () => void;
    handleOpenModal: (dataTargetRealisasi: TujuanOpdRealisasiGrouped["indikator"][number]["targets"]) => void;
}

const RowTujuanComponent: React.FC<RowTujuanComponentProps> = ({
    no,
    tujuan,
    tahun,
    canEdit,
    handleOpenPrintPreview,
    handleOpenModal
}) => {
    const indikatorList = tujuan.indikator ?? [];

    if (indikatorList.length === 0) {
        return <EmptyIndikatorRow no={no} tujuan={tujuan} tahun={tahun} handleOpenPrintPreview={handleOpenPrintPreview} />
    }

    const totalRows = indikatorList.reduce((sum, ind) => {
        const targetCount = ind.targets?.length ?? 0;
        return sum + (targetCount > 0 ? targetCount : 1);
    }, 0);

    return (
        <>
            {indikatorList.map((ind, indikatorIndex) => {
                const sortedTargets = [...(ind.targets ?? [])].sort((a, b) => {
                    const aId = Number(a.targetId);
                    const bId = Number(b.targetId);
                    if (!Number.isNaN(aId) && !Number.isNaN(bId)) return aId - bId;
                    return String(a.targetId).localeCompare(String(b.targetId));
                });

                const targetsForRows = sortedTargets.length > 0 ? sortedTargets : [null];
                const handleClick = (targetIndex: number) => {
                    const selectedTarget = targetsForRows[targetIndex];
                    if (selectedTarget) {
                        handleOpenModal([selectedTarget]);
                    }
                };

                return targetsForRows.map((target, targetIndex) => (
                    <tr key={`${ind.id || indikatorIndex}-${target?.targetId ?? `empty-${targetIndex}`}-${tahun}`}>
                        {indikatorIndex === 0 && targetIndex === 0 && (
                            <>
                                <td rowSpan={totalRows} className="border border-red-400 px-6 py-4 text-center">{no}</td>
                                <td rowSpan={totalRows} className="border border-red-400 px-6 py-4 text-center">{tujuan.tujuanOpd}</td>
                            </>
                        )}

                        {targetIndex === 0 && (
                            <>
                                <td rowSpan={targetsForRows.length} className="border border-red-400 px-6 py-4 text-center">{ind?.indikator || '-'}</td>
                                <td rowSpan={targetsForRows.length} className="border border-red-400 px-6 py-4 text-center">{ind?.rumusPerhitungan || '-'}</td>
                                <td rowSpan={targetsForRows.length} className="border border-red-400 px-6 py-4 text-center">{ind?.sumberData || '-'}</td>
                            </>
                        )}

                        {target ? (
                            <ColTargetTujuanComponent
                                target={target.target}
                                realisasi={target.realisasi}
                                satuan={target.satuan}
                                capaian={target.capaian}
                                keteranganCapaian={target.keteranganCapaian}
                                canEdit={canEdit}
                                handleClick={canEdit ? () => handleClick(targetIndex) : undefined}
                            />
                        ) : (
                            <td className="border border-red-400 px-6 py-4 text-center" colSpan={5}>
                                Tidak ada target
                            </td>
                        )}

                        <td className="border border-red-400 px-6 py-4 text-center">
                            <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
                                Cetak
                            </ButtonGreenBorder>
                        </td>
                    </tr>
                ));
            })}
        </>
    );
}

export default RowTujuanComponent;

const EmptyIndikatorRow: React.FC<{
    tujuan: TujuanOpdRealisasiGrouped;
    no: number;
    tahun: number;
    handleOpenPrintPreview: () => void;
}> = ({
    tujuan,
    no,
    tahun,
    handleOpenPrintPreview,
}) => {
        return (
            <tr key={tujuan.tujuanId}>
                <td className="border border-red-400 px-6 py-4 text-center">{no}</td>
                <td className="border border-red-400 px-6 py-4 text-center">{tujuan.tujuanOpd}</td>
                <td colSpan={8} className="border border-red-400 px-6 py-4 text-center text-gray-500 italic bg-red-300">
                    Tidak ada indikator dan target tahun {tahun}
                </td>
                <td className="border border-red-400 px-6 py-4 text-center">
                    <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
                        Cetak
                    </ButtonGreenBorder>
                </td>
            </tr>
        )
    }


type TargetColProps = {
    target: string;
    realisasi: number;
    satuan: string;
    capaian: string;
    keteranganCapaian: string;
    canEdit: boolean;
    handleClick?: () => void;
};

const ColTargetTujuanComponent: React.FC<TargetColProps> = ({ target, realisasi, satuan, capaian, keteranganCapaian, canEdit, handleClick }) => {

    return (
        <>
            <td className="border border-red-400 px-6 py-4 text-center">{target}</td>
            <td className="border border-red-400 px-6 py-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <span>{realisasi}</span>
                    {canEdit && handleClick && (
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
        </>
    );
}
