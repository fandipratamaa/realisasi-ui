import React, { useMemo } from 'react';
import { useFetchData } from "@/hooks/useFetchData";
import { useFilterContext } from "@/context/FilterContext";
import ChartDashboard from './_components/ChartDashboard';
import { normalizeReportData } from './chart-utils';

export default function TableLaporanSasaranOpd({
    laporanType,
}: {
    laporanType?: string;
}) {
    const isBulanan = laporanType === 'Bulanan';
    const { activatedTahun, activatedDinas, activatedBulan } = useFilterContext();

    let fetchUrl: string | null = null;
    if (laporanType && activatedTahun && activatedDinas) {
        const tahun = activatedTahun;
        const jenisLaporan = laporanType.toUpperCase();
        const kodeOpd = activatedDinas;

        const params = new URLSearchParams();
        if (isBulanan) {
            params.append('bulan', activatedBulan ?? "1");
        }

        const queryString = params.toString();
        fetchUrl = `/api/v1/realisasi/sasaran_opd/laporan/kodeOpd/${kodeOpd}/tahun/${tahun}/jenisLaporan/${jenisLaporan}${queryString ? `?${queryString}` : ''}`;
    }

    const { data: reportData, loading, error } = useFetchData<any>({
        url: fetchUrl
    });

    const chartData = useMemo(
        () => normalizeReportData(reportData, laporanType, activatedBulan),
        [reportData, laporanType, activatedBulan]
    );

    return (
        <div className="mt-4">
            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[...Array(5)].map((_, index) => (
                            <div
                                key={index}
                                className="h-24 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))}
                    </div>
                    <div className="h-[360px] animate-pulse rounded-xl bg-slate-100" />
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                    Error: {error}
                </div>
            ) : !fetchUrl ? (
                <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                    Pilih laporan realisasi agar data laporan sasaran opd muncul.
                </div>
            ) : !Array.isArray(reportData) || reportData.length === 0 ? (
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Tidak ada data laporan.
                </div>
            ) : (
                <ChartDashboard
                    data={chartData}
                    laporanType={laporanType}
                />
            )}
        </div>
    );
}
