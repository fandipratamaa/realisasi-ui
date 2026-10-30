import React, { useMemo } from 'react';
import { useFetchData } from "@/hooks/useFetchData";
import { useFilterContext } from "@/context/FilterContext";
import ChartDashboard from './_components/ChartDashboard';
import { normalizeReportData } from './chart-utils';

export default function TableLaporanTujuan({
    laporanType,
}: {
    laporanType?: string;
}) {
    const isBulanan = laporanType === 'Bulanan';
    const { activatedTahun, activatedDinas, activatedBulan } = useFilterContext();

    let fetchUrl: string | null = null;
    if (laporanType && activatedTahun) {
        const tahun = activatedTahun;
        const jenisLaporan = laporanType.toUpperCase();

        const params = new URLSearchParams();
        if (activatedDinas) {
            params.append('kode_opd', activatedDinas);
        }
        if (isBulanan) {
            params.append('bulan', activatedBulan ?? "1");
        }

        const queryString = params.toString();
        fetchUrl = `/api/v1/realisasi/tujuans/laporan/tahun/${tahun}/jenisLaporan/${jenisLaporan}${queryString ? `?${queryString}` : ''}`;
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[...Array(4)].map((_, index) => (
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
                    d
                </div>
            ) : !fetchUrl ? (
                <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                    Pilih laporan realisasi agar data laporan tujuan pemda muncul.
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
