import React from 'react'
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { SasaranOpdRealisasiGrouped } from '@/types'
import { formatPercentageText } from '@/lib/formatPercentageText'

interface RowSasaranOpdComponentProps {
    no: number;
    sasaranOpd: SasaranOpdRealisasiGrouped;
    tahun: number;
    canEdit: boolean;
    handleOpenPrintPreview: () => void;
    handleOpenModal: (dataTargetRealisasi: SasaranOpdRealisasiGrouped["indikator"][number]["targets"]) => void;
}

export default function RowSasaranComponent({ no, sasaranOpd, tahun, canEdit, handleOpenPrintPreview, handleOpenModal }: RowSasaranOpdComponentProps) {
    const indikatorList = sasaranOpd.indikator ?? [];

    if (indikatorList.length === 0) {
        return <EmptyIndikatorRow no={no} sasaranOpd={sasaranOpd} tahun={tahun} handleOpenPrintPreview={handleOpenPrintPreview} />
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
                const rowSpan = targetsForRows.length;
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
                                <td rowSpan={totalRows} className="border-x border-b border-emerald-500 py-4 px-3 text-center">{no}</td>
                                <td rowSpan={totalRows} className="border-x border-b border-emerald-500 py-4 px-3 text-left">{sasaranOpd.renja}</td>
                            </>
                        )}

                        {targetIndex === 0 && (
                            <>
                                <td rowSpan={rowSpan} className="border-r border-b border-emerald-500 px-6 py-4">{ind.indikator || '-'}</td>
                                <td rowSpan={rowSpan} className="border-r border-b border-emerald-500 px-6 py-4">{ind.rumusPerhitungan || '-'}</td>
                                <td rowSpan={rowSpan} className="border-l border-b border-emerald-500 px-6 py-4">{ind.sumberData || '-'}</td>
                            </>
                        )}

                        {target ? (
                            <ColTargetSasaranComponent
                                target={target.target}
                                realisasi={target.realisasi}
                                satuan={target.satuan}
                                capaian={target.capaian}
                                keteranganCapaian={target.keteranganCapaian}
                                canEdit={canEdit}
                                handleClick={canEdit ? () => handleClick(targetIndex) : undefined}
                            />
                        ) : (
                            <td className="border border-red-400 px-6 py-4 text-center bg-red-300" colSpan={5}>
                                Tidak ada target di tahun {tahun}
                            </td>
                        )}

                        {targetIndex === 0 && (
                            <td rowSpan={rowSpan} className="border border-emerald-500 px-6 py-4 text-center">
                                <ButtonGreenBorder className="w-full" onClick={handleOpenPrintPreview}>
                                    Cetak
                                </ButtonGreenBorder>
                            </td>
                        )}
                    </tr>
                ));
            })}
        </>
    )
}


interface EmptyIndikatorSasaran {
    sasaranOpd: SasaranOpdRealisasiGrouped;
    no: number;
    tahun: number;
    handleOpenPrintPreview: () => void;
}

const EmptyIndikatorRow: React.FC<EmptyIndikatorSasaran> = ({ sasaranOpd, no, tahun, handleOpenPrintPreview }) => {
    return (
        <tr key={sasaranOpd.renjaId}>
            <td className="border border-red-400 px-6 py-4 text-center">{no}</td>
            <td className="border border-red-400 px-6 py-4 text-center">{sasaranOpd.renja}</td>
            <td colSpan={8} className="border border-red-400 px-6 py-4 text-center text-gray-500 italic bg-red-300">
                Tidak ada indikator dan target tahun {tahun}
            </td>
            <td className="border border-emerald-500 px-6 py-4 text-center">
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

const formatWithComma = (value: number | string): string => {
        if (value === null || value === undefined || value === 0) return '-';
        return value.toString().replace('.', ',');
    };

const ColTargetSasaranComponent: React.FC<TargetColProps> = ({ target, realisasi, satuan, capaian, keteranganCapaian, canEdit, handleClick }) => {

    return (
        <>
            <td className="border border-emerald-500 px-6 py-4 text-center">{target}</td>
            <td className="border border-emerald-500 px-6 py-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <span>{formatWithComma(realisasi)}</span>
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
            <td className="border border-emerald-500 px-6 py-4 text-center">{satuan}</td>
            <td className="border border-emerald-500 px-6 py-4 text-center">{formatPercentageText(capaian)}</td>
            <td className="border border-emerald-500 px-6 py-4">{formatPercentageText(keteranganCapaian || '-')}</td>
        </>
    );
}
