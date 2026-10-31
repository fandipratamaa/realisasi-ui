'use client'

import React, { useState, useEffect } from 'react'
import Select from "react-select"
import TableLaporanRekinIndividu from './table'
import { useFilterContext } from "@/context/FilterContext"
import { useUserContext } from "@/context/UserContext"
import { ROLES } from "@/constants/roles"

const laporanOptions = [
  { value: 'Bulanan', label: 'Bulanan' },
  { value: 'Triwulan', label: 'Triwulan' },
  { value: 'Tahunan', label: 'Tahunan' },
]

export default function LaporanRekinIndividu() {
  const [selectedLaporanOption, setSelectedLaporanOption] = useState<{ label: string; value: string } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { activatedLevelRole, activatedNamaPegawai } = useFilterContext()
  const { user } = useUserContext()

  const isAdmin = user?.roles?.includes(ROLES.SUPER_ADMIN) || user?.roles?.includes(ROLES.ADMIN_OPD)
  const needsPegawaiSelection = isAdmin && (!activatedLevelRole || !activatedNamaPegawai)

  useEffect(() => {
    const saved = localStorage.getItem('selectedLaporanIndividuRekin')
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
          <h2 className="text-xl font-bold">Laporan Realisasi Rekin Individu</h2>
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
                  localStorage.setItem('selectedLaporanIndividuRekin', JSON.stringify(opt))
                } else {
                  localStorage.removeItem('selectedLaporanIndividuRekin')
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
          Pilih laporan realisasi agar data laporan rekin individu muncul.
        </div>
      ) : needsPegawaiSelection ? (
        <div className="p-5 bg-red-100 border border-red-400 rounded text-red-700 my-5">
          Pilih dan aktifkan Level Role dan Nama Pegawai agar data laporan rekin individu muncul.
        </div>
      ) : (
        <TableLaporanRekinIndividu laporanType={selectedLaporanOption?.value} />
      )}
    </div>
  )
}
