import React, { useMemo } from 'react';
import { useFetchData } from "@/hooks/useFetchData";
import { useFilterContext } from "@/context/FilterContext";
import { useUserContext } from "@/context/UserContext";
import { ROLES } from "@/constants/roles";
import RenjaChartDashboard from '../_components/RenjaChartDashboard';
import { normalizeRenjaReportData } from '../chart-utils';

export default function TableLaporanRenjaKegiatan({ laporanType }: { laporanType?: string }) {
    const isBulanan = laporanType === 'Bulanan';
    const { activatedTahun, activatedDinas, activatedBulan, activatedLevelRole, activatedNamaPegawai } = useFilterContext();
    const { user } = useUserContext();

    const nip = user?.nip ?? "";
    const kodeOpd = activatedDinas ?? user?.kode_opd ?? "";

    const isAdmin = user?.roles?.includes(ROLES.SUPER_ADMIN) || user?.roles?.includes(ROLES.ADMIN_OPD);

    let fetchUrl: string | null = null;
    if (laporanType && activatedTahun && kodeOpd) {
        const tahun = activatedTahun;
        const jenisLaporan = laporanType.toUpperCase();

        let url = "";

        if (isAdmin) {
            if (activatedLevelRole && activatedNamaPegawai) {
                const safeNip = activatedNamaPegawai.replace(/-$/, "");
                url = `/api/v1/realisasi/renja_individu/kegiatan/laporan/kodeOpd/${kodeOpd}/tahun/${tahun}/jenisLaporan/${jenisLaporan}/levelRole/${activatedLevelRole}/nip/${safeNip}`;
            }
        } else if (nip) {
            const safeNip = nip.replace(/-$/, "");
            url = `/api/v1/realisasi/renja_individu/kegiatan/laporan/nip/${safeNip}/kodeOpd/${kodeOpd}/tahun/${tahun}/jenisLaporan/${jenisLaporan}`;
        }

        if (url) {
            const params = new URLSearchParams();
            if (isBulanan) {
                params.append('bulan', activatedBulan ?? "1");
            }

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
            fetchUrl = url;
        }
    }

    const { data: reportData, loading, error } = useFetchData<any>({
        url: fetchUrl
    });

    const chartData = useMemo(
        () => normalizeRenjaReportData(reportData, laporanType, activatedBulan, 'kegiatan'),
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
                </div>
            ) : !fetchUrl ? (
                <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
                    Pilih laporan realisasi agar data laporan renja individu muncul.
                </div>
            ) : !Array.isArray(reportData) || reportData.length === 0 ? (
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Tidak ada data laporan.
                </div>
            ) : (
                <RenjaChartDashboard
                    data={chartData}
                    laporanType={laporanType}
                    groupLabel="Kegiatan"
                />
            )}
        </div>
    );
}
