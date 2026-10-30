'use client'

import { formatNumber } from '../chart-utils'

interface TooltipPayloadItem {
    name?: string | number
    value?: number | string
    color?: string
    dataKey?: string | number
    payload?: Record<string, unknown>
}

interface ChartTooltipProps {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string | number
    labelPrefix?: string
}

function getPayloadName(entry: TooltipPayloadItem): string {
    if (entry.name !== undefined && entry.name !== null) return String(entry.name)
    const payloadName = entry.payload?.name
    if (payloadName !== undefined && payloadName !== null) return String(payloadName)
    return 'Nilai'
}

export default function ChartTooltip({
    active,
    payload,
    label,
    labelPrefix,
}: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) return null

    const sasaran =
        payload[0]?.payload?.sasaran ?? payload[0]?.payload?.namaSasaran

    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            {label !== undefined && label !== null && String(label) !== '' ? (
                <p className="mb-1 font-semibold text-slate-700">
                    {labelPrefix ? `${labelPrefix} ${label}` : label}
                </p>
            ) : null}
            {sasaran !== undefined &&
            sasaran !== null &&
            String(sasaran) !== '' &&
            String(sasaran) !== String(label ?? '') ? (
                <p className="mb-2 max-w-[260px] text-[11px] leading-snug text-slate-500">
                    {String(sasaran)}
                </p>
            ) : null}
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div
                        key={`${getPayloadName(entry)}-${index}`}
                        className="flex items-center justify-between gap-4"
                    >
                        <span className="flex items-center gap-1.5 text-slate-500">
                            <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color ?? '#10B981' }}
                            />
                            {getPayloadName(entry)}
                        </span>
                        <span className="font-semibold text-slate-700">
                            {typeof entry.value === 'number'
                                ? formatNumber(entry.value)
                                : entry.value ?? '-'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
