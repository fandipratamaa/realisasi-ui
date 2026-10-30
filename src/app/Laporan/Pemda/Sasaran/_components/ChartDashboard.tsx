'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import {
    buildPeriodTrend,
    buildPieData,
    formatNumber,
    formatPercent,
    groupBySasaran,
    type ChartDatum,
    type PeriodTrendDatum,
} from '../chart-utils'

const PIE_COLORS = [
    '#10B981',
    '#0EA5E9',
    '#6366F1',
    '#F59E0B',
    '#EC4899',
    '#14B8A6',
    '#8B5CF6',
]

interface ChartDashboardProps {
    data: ChartDatum[]
    laporanType?: string
}

function truncateLabel(value: string, maxLength = 28): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function getCapaianColor(capaian: number): string {
    if (capaian >= 100) return 'bg-emerald-500'
    if (capaian >= 70) return 'bg-amber-400'
    return 'bg-red-400'
}

function ChartCard({
    title,
    subtitle,
    children,
}: {
    title: string
    subtitle?: string
    children: React.ReactNode
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                {subtitle ? (
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                ) : null}
            </div>
            {children}
        </section>
    )
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
            {message}
        </div>
    )
}

export default function ChartDashboard({
    data,
    laporanType,
}: ChartDashboardProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const trend: PeriodTrendDatum[] = useMemo(
        () => buildPeriodTrend(data),
        [data]
    )

    const pieData = useMemo(() => buildPieData(data), [data])

    const sasaranGroups = useMemo(() => groupBySasaran(data), [data])

    const barData = useMemo(
        () =>
            data.map((item) => ({
                name: item.indikator,
                sasaran: item.namaSasaran,
                Target: item.target,
                Realisasi: item.totalRealisasi,
            })),
        [data]
    )

    const totalTarget = data.reduce((total, item) => total + item.target, 0)
    const totalRealisasi = data.reduce(
        (total, item) => total + item.totalRealisasi,
        0
    )
    const capaianKeseluruhan =
        totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0

    const summaryItems = [
        {
            label: 'Jumlah Sasaran',
            value: formatNumber(sasaranGroups.length),
            accent: 'text-teal-700 bg-teal-50',
        },
        {
            label: 'Jumlah Indikator',
            value: formatNumber(data.length),
            accent: 'text-sky-700 bg-sky-50',
        },
        {
            label: 'Total Target',
            value: formatNumber(totalTarget),
            accent: 'text-slate-700 bg-slate-100',
        },
        {
            label: 'Total Realisasi',
            value: formatNumber(totalRealisasi),
            accent: 'text-emerald-700 bg-emerald-50',
        },
        {
            label: 'Capaian Keseluruhan',
            value: formatPercent(capaianKeseluruhan),
            accent: 'text-indigo-700 bg-indigo-50',
        },
    ]

    const showTrend = laporanType !== 'Bulanan' && trend.length > 1
    const barChartHeight = Math.max(320, data.length * 64)

    if (!mounted) {
        return (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[...Array(5)].map((_, index) => (
                    <div
                        key={index}
                        className="h-24 animate-pulse rounded-xl bg-slate-100"
                    />
                ))}
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Tidak ada data laporan untuk ditampilkan pada chart.
            </div>
        )
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {summaryItems.map((item) => (
                    <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-medium text-slate-500">
                            {item.label}
                        </p>
                        <p
                            className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xl font-bold ${item.accent}`}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <ChartCard
                title="Ringkasan per Sasaran"
                subtitle="Jumlah indikator dan capaian realisasi untuk setiap sasaran."
            >
                <div className="space-y-3">
                    {sasaranGroups.map((group, index) => {
                        const capaian = Number.isFinite(group.capaian)
                            ? group.capaian
                            : 0
                        const barWidth = Math.max(
                            0,
                            Math.min(capaian, 100)
                        )

                        return (
                            <div
                                key={`${group.namaSasaran}-${index}`}
                                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                            >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                    <p
                                        className="text-sm font-semibold text-slate-800"
                                        title={group.namaSasaran}
                                    >
                                        {group.namaSasaran}
                                    </p>
                                    <span className="shrink-0 self-start rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                        {formatNumber(group.indikatorCount)} indikator
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-600">
                                    <span>
                                        Realisasi {formatNumber(group.totalRealisasi)} /{' '}
                                        {formatNumber(group.totalTarget)}
                                    </span>
                                    <span className="font-semibold text-slate-700">
                                        {formatPercent(capaian)}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                                    <div
                                        className={`h-full rounded-full transition-all ${getCapaianColor(
                                            capaian
                                        )}`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ChartCard>

            <ChartCard
                title="Target vs Realisasi per Indikator"
                subtitle="Perbandingan target dengan total realisasi pada periode terpilih."
            >
                <div className="w-full">
                    <ResponsiveContainer width="100%" height={barChartHeight}>
                        <BarChart
                            data={barData}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke="#E2E8F0"
                            />
                            <XAxis
                                type="number"
                                tickFormatter={(value) =>
                                    formatNumber(Number(value))
                                }
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                axisLine={{ stroke: '#CBD5E1' }}
                                tickLine={{ stroke: '#CBD5E1' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={170}
                                tickFormatter={(value) =>
                                    truncateLabel(String(value))
                                }
                                tick={{ fontSize: 12, fill: '#334155' }}
                                axisLine={{ stroke: '#CBD5E1' }}
                                tickLine={{ stroke: '#CBD5E1' }}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                                dataKey="Target"
                                fill="#94A3B8"
                                radius={[0, 6, 6, 0]}
                                barSize={16}
                            />
                            <Bar
                                dataKey="Realisasi"
                                fill="#10B981"
                                radius={[0, 6, 6, 0]}
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {showTrend ? (
                    <ChartCard
                        title="Tren Realisasi per Periode"
                        subtitle="Akumulasi realisasi seluruh indikator tiap periode."
                    >
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={trend}
                                    margin={{
                                        top: 8,
                                        right: 16,
                                        left: 8,
                                        bottom: 8,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="realisasiGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#0EA5E9"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#0EA5E9"
                                                stopOpacity={0.02}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#E2E8F0"
                                    />
                                    <XAxis
                                        dataKey="periode"
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        axisLine={{ stroke: '#CBD5E1' }}
                                        tickLine={{ stroke: '#CBD5E1' }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) =>
                                            formatNumber(Number(value))
                                        }
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        axisLine={{ stroke: '#CBD5E1' }}
                                        tickLine={{ stroke: '#CBD5E1' }}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip labelPrefix="Periode" />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="realisasi"
                                        name="Realisasi"
                                        stroke="#0EA5E9"
                                        strokeWidth={2.5}
                                        fill="url(#realisasiGradient)"
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                ) : null}

                <ChartCard
                    title="Komposisi Realisasi"
                    subtitle="Kontribusi realisasi tiap indikator terhadap total."
                >
                    {pieData.length > 0 ? (
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={62}
                                        outerRadius={98}
                                        paddingAngle={2}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`${entry.name}-${index}`}
                                                fill={
                                                    PIE_COLORS[
                                                        index %
                                                            PIE_COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: 12,
                                            paddingTop: 8,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="Belum ada realisasi yang bisa ditampilkan pada komposisi." />
                    )}
                </ChartCard>
            </div>

            <ChartCard
                title="Capaian per Indikator"
                subtitle="Persentase realisasi tiap indikator, dikelompokkan berdasarkan sasaran."
            >
                <div className="space-y-6">
                    {sasaranGroups.map((group, groupIndex) => (
                        <div key={`${group.namaSasaran}-${groupIndex}`}>
                            <div className="mb-3 border-b border-slate-100 pb-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Sasaran
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {group.namaSasaran}
                                </p>
                            </div>
                            <div className="space-y-4">
                                {group.items.map((item, itemIndex) => {
                                    const capaian = Number.isFinite(item.capaian)
                                        ? item.capaian
                                        : 0
                                    const barWidth = Math.max(
                                        0,
                                        Math.min(capaian, 100)
                                    )

                                    return (
                                        <div
                                            key={`${item.namaSasaran}-${item.indikator}-${itemIndex}`}
                                        >
                                            <div className="mb-1 flex items-start justify-between gap-3 text-xs">
                                                <span
                                                    className="font-medium text-slate-700"
                                                    title={item.indikator}
                                                >
                                                    {truncateLabel(item.indikator, 70)}
                                                </span>
                                                <span className="shrink-0 font-semibold text-slate-700">
                                                    {formatNumber(item.totalRealisasi)} /{' '}
                                                    {formatNumber(item.target)} (
                                                    {formatPercent(capaian)})
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all ${getCapaianColor(
                                                        capaian
                                                    )}`}
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ChartCard>
        </div>
    )
}
