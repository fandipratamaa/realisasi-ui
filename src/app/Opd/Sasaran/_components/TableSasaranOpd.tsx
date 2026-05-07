import React from 'react'
import RowSasaranComponent from './RowSasaranComponent';
import { SasaranOpdRealisasiGrouped } from '@/types'


interface TableSasaranOpdProps {
    tahun: number;
    bulanLabel?: string;
    sasaranOpd: SasaranOpdRealisasiGrouped[];
    canEdit: boolean;
    handleOpenPrintPreview: () => void;
    handleOpenModal: (dataTargetRealisasi: SasaranOpdRealisasiGrouped["indikator"][number]["targets"]) => void;
}

export default function TableSasaranOpd({ tahun, bulanLabel, sasaranOpd, canEdit, handleOpenPrintPreview, handleOpenModal }: TableSasaranOpdProps) {

    return (
        <table className="w-full">
            <thead>
                <tr className="text-xm bg-emerald-500 text-white">
                    <td rowSpan={2} className="border-r border-b px-6 py-3 max-w-[100px] text-center">No</td>
                    <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[400px] text-center">Rencana Kerja</td>
                    <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[400px]">Indikator</td>
                    <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[300px]">Rumus Perhitungan</td>
                    <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[300px]">Sumber Data</td>
                    <th colSpan={5} className="border-l border-b px-6 py-3 min-w-[100px]">{tahun} - {bulanLabel}</th>
                    <th rowSpan={2} className="border-l border-b px-6 py-3 min-w-[120px] text-center">Aksi</th>
                </tr>
                <tr className="bg-emerald-500 text-white">
                    <th className="border-l border-b px-6 py-3 min-w-[50px]">Target</th>
                    <th className="border-l border-b px-6 py-3 min-w-[50px]">Realisasi</th>
                    <th className="border-l border-b px-6 py-3 min-w-[50px]">Satuan</th>
                    <th className="border-l border-b px-6 py-3 min-w-[50px]">Capaian</th>
                    <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
                </tr>
            </thead>
            <tbody>
                {sasaranOpd.map((sasOpd, index) => (
                    <RowSasaranComponent
                        key={sasOpd.renjaId}
                        no={index + 1}
                        sasaranOpd={sasOpd}
                        tahun={tahun}
                        canEdit={canEdit}
                        handleOpenPrintPreview={handleOpenPrintPreview}
                        handleOpenModal={handleOpenModal}
                    />
                ))}
            </tbody>
        </table>
    )
}
