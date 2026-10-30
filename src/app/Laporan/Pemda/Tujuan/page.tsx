'use client'

import React, { useState, useEffect } from 'react'
import Select from "react-select"
import TableLaporanTujuan from './table'

const laporanOptions = [
  { value: 'Bulanan', label: 'Bulanan' },
  { value: 'Triwulan', label: 'Triwulan' },
  { value: 'Tahunan', label: 'Tahunan' },
]

export default function LaporanTujuanPemda() {
  const [selectedLaporanOption, setSelectedLaporanOption] = useState<{ label: string; value: string } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('selectedLaporanPemdaTujuan')
    if (saved) {
      try {
        setSelectedLaporanOption(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }

    setIsLoaded(true)
  }, [])

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Laporan Realisasi Tujuan Pemda</h2>
          {selectedLaporanOption ? (
            <p className="mt-1 text-sm text-slate-500">
              Laporan {selectedLaporanOption.label}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px]">
            <Select
              value={selectedLaporanOption}
              options={laporanOptions}
              placeholder="Laporan Realisasi"
              isSearchable={false}
              onChange={(opt) => {
                setSelectedLaporanOption(opt)
                if (opt) {
                  localStorage.setItem('selectedLaporanPemdaTujuan', JSON.stringify(opt))
                } else {
                  localStorage.removeItem('selectedLaporanPemdaTujuan')
                }
              }}
              formatOptionLabel={(option, { context }) =>
                context === 'value' ? `Laporan Realisasi : ${option.label}` : option.label
              }
              styles={{
                control: (base) => ({
                  ...base,
                  background: "linear-gradient(to right, #08C2FF, #006BFF)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  minHeight: 38,
                  cursor: "pointer",
                  boxShadow: "none",
                }),
                singleValue: (base) => ({ ...base, color: "#fff" }),
                placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.8)" }),
                dropdownIndicator: (base) => ({ ...base, color: "#fff" }),
                indicatorSeparator: () => ({ display: "none" }),
                menu: (base) => ({ ...base, zIndex: 20, minWidth: 180 }),
              }}
            />
          </div>
        </div>
      </div>
      {!isLoaded ? null : !selectedLaporanOption ? (
        <div className="p-5 bg-red-100 border border-red-400 rounded text-red-700 my-5">
          Pilih laporan realisasi agar data laporan tujuan pemda muncul.
        </div>
      ) : (
        <TableLaporanTujuan laporanType={selectedLaporanOption?.value} />
      )}
    </div>
  )
}
