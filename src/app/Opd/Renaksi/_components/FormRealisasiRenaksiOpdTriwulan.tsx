'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ButtonSky } from '@/components/Global/Button/button'
import { LoadingButtonClip } from '@/components/Global/Loading'
import { useApiUrlContext } from '@/context/ApiUrlContext'
import { useFilterContext } from '@/context/FilterContext'
import { useSubmitData } from '@/hooks/useSubmitData'
import { getSessionId } from '@/lib/session'
import { RenaksiIndividuResponse, RenaksiOpdBatchMonthlyRequest, RenaksiTriwulanCell } from '@/types'

type TriwulanCode = 'TW1' | 'TW2' | 'TW3' | 'TW4'

const TRIWULAN_TO_NUMBER: Record<TriwulanCode, string> = {
  TW1: '1',
  TW2: '2',
  TW3: '3',
  TW4: '4',
}

interface RenaksiOpdFormRow {
  renaksiId: string
  renaksi: string
  rekinId: string
  rekin: string
  targetId: string
  tw1: RenaksiTriwulanCell
  tw2: RenaksiTriwulanCell
  tw3: RenaksiTriwulanCell
  tw4: RenaksiTriwulanCell
}

interface Props {
  requestValues: RenaksiOpdFormRow | null
  tahun: string
  triwulan: TriwulanCode
  onClose: () => void
  onSuccess?: () => void
}

interface MonthInput {
  bulan: string
  label: string
  realisasi: number | ''
}

interface DetailBulananResponse {
  nip?: string
  kodeOpd: string
  tahun: string
  data: Array<{
    renaksiId: string
    targetId: string
    bulan: string
    realisasi: number
  }>
}

const TRI_MONTH_MAP: Record<TriwulanCode, Array<{ bulan: string; label: string }>> = {
  TW1: [
    { bulan: '1', label: 'Januari' },
    { bulan: '2', label: 'Februari' },
    { bulan: '3', label: 'Maret' },
  ],
  TW2: [
    { bulan: '4', label: 'April' },
    { bulan: '5', label: 'Mei' },
    { bulan: '6', label: 'Juni' },
  ],
  TW3: [
    { bulan: '7', label: 'Juli' },
    { bulan: '8', label: 'Agustus' },
    { bulan: '9', label: 'September' },
  ],
  TW4: [
    { bulan: '10', label: 'Oktober' },
    { bulan: '11', label: 'November' },
    { bulan: '12', label: 'Desember' },
  ],
}

const FormRealisasiRenaksiOpdTriwulan: React.FC<Props> = ({
  requestValues,
  tahun,
  triwulan,
  onClose,
  onSuccess,
}) => {
  const { url } = useApiUrlContext()
  const { activatedDinas: kodeOpd } = useFilterContext()
  const submitUrl = useMemo(
    () => (url ? `${url}/api/v1/realisasi/renaksi_opd/batch` : '/api/v1/realisasi/renaksi_opd/batch'),
    [url],
  )
  const { submit, loading, error } = useSubmitData<RenaksiIndividuResponse[]>({ url: submitUrl })
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loadingPrefill, setLoadingPrefill] = useState(false)
  const [prefillError, setPrefillError] = useState<string | null>(null)

  const months = TRI_MONTH_MAP[triwulan]
  const activeTw =
    triwulan === 'TW1' ? requestValues?.tw1 : triwulan === 'TW2' ? requestValues?.tw2 : triwulan === 'TW3' ? requestValues?.tw3 : requestValues?.tw4

  const [monthInputs, setMonthInputs] = useState<MonthInput[]>(
    months.map((month) => ({ bulan: month.bulan, label: month.label, realisasi: '' })),
  )

  useEffect(() => {
    setMonthInputs(months.map((month) => ({ bulan: month.bulan, label: month.label, realisasi: '' })))
  }, [triwulan])

  useEffect(() => {
    const fetchPrefill = async () => {
      if (!requestValues || !kodeOpd || !tahun) {
        return
      }

      const sessionId = getSessionId()
      if (!sessionId) {
        setPrefillError('Sesi login tidak ditemukan. Silakan login ulang.')
        return
      }

      setLoadingPrefill(true)
      setPrefillError(null)

      const endpoint = url
        ? `${url}/api/v1/realisasi/renaksi_opd/by-kode-opd/${encodeURIComponent(kodeOpd)}/by-tahun/${encodeURIComponent(tahun)}/by-triwulan/${encodeURIComponent(TRIWULAN_TO_NUMBER[triwulan])}/by-renaksi-id/${encodeURIComponent(requestValues.renaksiId)}/by-target-id/${encodeURIComponent(requestValues.targetId)}/detail-bulanan`
        : `/api/v1/realisasi/renaksi_opd/by-kode-opd/${encodeURIComponent(kodeOpd)}/by-tahun/${encodeURIComponent(tahun)}/by-triwulan/${encodeURIComponent(TRIWULAN_TO_NUMBER[triwulan])}/by-renaksi-id/${encodeURIComponent(requestValues.renaksiId)}/by-target-id/${encodeURIComponent(requestValues.targetId)}/detail-bulanan`

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Gagal memuat data realisasi bulanan.')
        }

        const detail: DetailBulananResponse = await response.json()
        const realisasiByBulan = new Map(detail.data.map((item) => [item.bulan, item.realisasi]))

        setMonthInputs(
          TRI_MONTH_MAP[triwulan].map((month) => ({
            bulan: month.bulan,
            label: month.label,
            realisasi: realisasiByBulan.has(month.bulan) ? (realisasiByBulan.get(month.bulan) ?? 0) : '',
          })),
        )
      } catch (prefillFetchError) {
        setPrefillError(prefillFetchError instanceof Error ? prefillFetchError.message : 'Gagal memuat data prefill.')
        setMonthInputs(
          TRI_MONTH_MAP[triwulan].map((month) => ({
            bulan: month.bulan,
            label: month.label,
            realisasi: '',
          })),
        )
      } finally {
        setLoadingPrefill(false)
      }
    }

    fetchPrefill()
  }, [requestValues, kodeOpd, tahun, triwulan, url])

  const handleChange = (bulan: string, value: string) => {
    if (value.trim() === '') {
      setMonthInputs((prev) => prev.map((item) => (item.bulan === bulan ? { ...item, realisasi: '' } : item)))
      return
    }

    const parsedValue = parseFloat(value)
    const safeValue = Number.isNaN(parsedValue) ? '' : parsedValue
    setMonthInputs((prev) => prev.map((item) => (item.bulan === bulan ? { ...item, realisasi: safeValue } : item)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidationError(null)

    if (!requestValues) {
      setValidationError('Data renaksi tidak ditemukan.')
      return
    }

    if (!kodeOpd) {
      setValidationError('Kode OPD tidak tersedia. Silakan pilih OPD terlebih dahulu.')
      return
    }

    const payload: RenaksiOpdBatchMonthlyRequest[] = monthInputs.map((monthItem) => ({
      renaksiId: requestValues.renaksiId,
      renaksi: requestValues.renaksi,
      kodeOpd,
      rekinId: requestValues.rekinId,
      rekin: requestValues.rekin,
      targetId: requestValues.targetId,
      target: String(activeTw?.target ?? '-'),
      realisasi: monthItem.realisasi === '' ? 0 : monthItem.realisasi,
      satuan: activeTw?.satuan ?? '-',
      bulan: monthItem.bulan,
      tahun,
      jenisRealisasi: 'NAIK',
    }))

    const result = await submit(payload)
    if (result) {
      onSuccess?.()
      onClose()
      return
    }

    setValidationError(error ?? 'Terjadi kesalahan saat menyimpan realisasi.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
      <div className="mb-2">
        <h3 className="font-bold">Rencana Aksi: {requestValues?.renaksi ?? '-'}</h3>
        <p className="text-sm text-gray-600">Rencana Kinerja: {requestValues?.rekin ?? '-'}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        {monthInputs.map((monthItem) => (
          <div key={monthItem.bulan} className="rounded border bg-gray-50 p-2 shadow-sm">
            <div className="mb-2 rounded bg-red-500 py-0.5 text-center text-xs font-semibold text-white">
              {tahun} - {triwulan} - {monthItem.label}
            </div>
            <p className="mb-1 text-xs font-bold uppercase text-gray-700">Target</p>
            <p className="mb-2 w-full rounded border bg-gray-300 px-2 py-1 text-sm">{activeTw?.target ?? '-'}</p>
            <label className="mb-1 text-xs font-bold uppercase text-gray-700" htmlFor={`realisasi-${monthItem.bulan}`}>
              Realisasi
            </label>
            <input
              id={`realisasi-${monthItem.bulan}`}
              type="number"
              step="0.01"
              className="mb-2 w-full rounded border px-2 py-1 text-sm"
              value={monthItem.realisasi}
              onChange={(event) => handleChange(monthItem.bulan, event.target.value)}
            />
            <p className="mb-1 text-xs font-bold uppercase text-gray-700">Satuan</p>
            <p className="w-full rounded border bg-gray-300 px-2 py-1 text-sm">{activeTw?.satuan ?? '-'}</p>
          </div>
        ))}
      </div>

      {validationError ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{validationError}</div>
      ) : null}

      {prefillError ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{prefillError}</div>
      ) : null}

      <ButtonSky className="mt-2 w-full" type="submit" disabled={loading || loadingPrefill}>
        {loading || loadingPrefill ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingButtonClip />
            {loadingPrefill ? 'Memuat data lama...' : 'Menyimpan...'}
          </span>
        ) : (
          'Simpan'
        )}
      </ButtonSky>
    </form>
  )
}

export default FormRealisasiRenaksiOpdTriwulan
