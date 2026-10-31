import { getMonthName } from "@/lib/months";

export interface RawReportItem {
    renaksi?: string | null;
    nama_renaksi?: string | null;
    namaRenaksi?: string | null;
    kode_renaksi?: string | null;
    kode_rencana_aksi_opd?: string | null;
    indikator?: string | null;
    target?: number | string | null;
    listData?: Record<string, unknown> | null;
    list_data?: Record<string, unknown> | null;
    totalRealisasi?: number | string | null;
    total_realisasi?: number | string | null;
}

export interface ChartValue {
    label: string;
    value: number;
}

export interface ChartDatum {
    namaRenaksi: string;
    indikator: string;
    target: number;
    totalRealisasi: number;
    capaian: number;
    values: ChartValue[];
}

export interface RenaksiGroup {
    namaRenaksi: string;
    indikatorCount: number;
    totalTarget: number;
    totalRealisasi: number;
    capaian: number;
    items: ChartDatum[];
}

export interface PeriodTrendDatum {
    periode: string;
    realisasi: number;
}

export interface PieDatum {
    name: string;
    value: number;
}

const MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
];

const numberFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
});

export function toNumber(value: unknown): number {
    if (value === null || value === undefined || value === "") return 0;

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const cleaned = String(value)
        .trim()
        .replace(/[^\d,.-]/g, "")
        .replace(/-/g, (match, offset) => (offset === 0 ? match : ""));

    if (!cleaned) return 0;

    let normalized = cleaned;

    if (cleaned.includes(",")) {
        // Format Indonesia: 1.234,56. Format Inggris: 1,234.56.
        if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
            normalized = cleaned.replace(/\./g, "").replace(",", ".");
        } else {
            normalized = cleaned.replace(/,/g, "");
        }
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        // Titik sebagai pemisah ribuan tanpa desimal.
        normalized = cleaned.replace(/\./g, "");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
    return `${percentFormatter.format(value)}%`;
}

function getPeriods(
    laporanType: string | undefined,
    activatedBulan: string | null
): { key: string; label: string }[] {
    if (laporanType === "Tahunan") {
        return MONTH_SHORT.map((label, index) => ({
            key: String(index + 1),
            label,
        }));
    }

    if (laporanType === "Triwulan") {
        return [1, 2, 3, 4].map((quarter) => ({
            key: String(quarter),
            label: `TW${quarter}`,
        }));
    }

    const monthKey = activatedBulan ?? "1";
    return [
        {
            key: monthKey,
            label: getMonthName(monthKey) ?? `Bulan ${monthKey}`,
        },
    ];
}

export function normalizeReportData(
    reportData: unknown,
    laporanType: string | undefined,
    activatedBulan: string | null
): ChartDatum[] {
    if (!Array.isArray(reportData)) return [];

    const periods = getPeriods(laporanType, activatedBulan);

    return reportData.map((rawItem) => {
        const item = (rawItem ?? {}) as RawReportItem;
        const listData = item.listData ?? item.list_data ?? {};
        const target = toNumber(item.target);

        const values = periods.map((period) => ({
            label: period.label,
            value: toNumber(listData[period.key]),
        }));

        const totalFromPeriods = values.reduce(
            (total, current) => total + current.value,
            0
        );

        const totalFromApi = toNumber(
            item.totalRealisasi ?? item.total_realisasi
        );

        const totalRealisasi =
            totalFromPeriods !== 0 ? totalFromPeriods : totalFromApi;

        const rawNamaRenaksi =
            item.renaksi ??
            item.nama_renaksi ??
            item.namaRenaksi ??
            item.kode_renaksi ??
            item.kode_rencana_aksi_opd;

        return {
            namaRenaksi:
                String(rawNamaRenaksi ?? "").trim() || "Tanpa Nama Renaksi",
            indikator: item.indikator?.trim() || "Tanpa Indikator",
            target,
            totalRealisasi,
            capaian: target > 0 ? (totalRealisasi / target) * 100 : 0,
            values,
        };
    });
}

export function groupByRenaksi(data: ChartDatum[]): RenaksiGroup[] {
    const groups = new Map<string, RenaksiGroup>();

    data.forEach((item) => {
        const existing = groups.get(item.namaRenaksi);

        if (existing) {
            existing.items.push(item);
            existing.indikatorCount += 1;
            existing.totalTarget += item.target;
            existing.totalRealisasi += item.totalRealisasi;
            existing.capaian =
                existing.totalTarget > 0
                    ? (existing.totalRealisasi / existing.totalTarget) * 100
                    : 0;
            return;
        }

        groups.set(item.namaRenaksi, {
            namaRenaksi: item.namaRenaksi,
            indikatorCount: 1,
            totalTarget: item.target,
            totalRealisasi: item.totalRealisasi,
            capaian:
                item.target > 0
                    ? (item.totalRealisasi / item.target) * 100
                    : 0,
            items: [item],
        });
    });

    return Array.from(groups.values());
}

export function buildPeriodTrend(data: ChartDatum[]): PeriodTrendDatum[] {
    if (data.length === 0) return [];

    return data[0].values.map((value, index) => ({
        periode: value.label,
        realisasi: data.reduce(
            (total, item) => total + (item.values[index]?.value ?? 0),
            0
        ),
    }));
}

export function buildPieData(data: ChartDatum[], maxItems = 6): PieDatum[] {
    const withRealisasi = data
        .filter((item) => item.totalRealisasi > 0)
        .sort((a, b) => b.totalRealisasi - a.totalRealisasi);

    if (withRealisasi.length === 0) return [];

    if (withRealisasi.length <= maxItems) {
        return withRealisasi.map((item) => ({
            name: item.namaRenaksi,
            value: item.totalRealisasi,
        }));
    }

    const topItems = withRealisasi.slice(0, maxItems - 1);
    const otherTotal = withRealisasi
        .slice(maxItems - 1)
        .reduce((total, item) => total + item.totalRealisasi, 0);

    return [
        ...topItems.map((item) => ({
            name: item.namaRenaksi,
            value: item.totalRealisasi,
        })),
        { name: "Lainnya", value: otherTotal },
    ];
}
