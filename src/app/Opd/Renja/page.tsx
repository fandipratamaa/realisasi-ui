'use client'

import React from 'react'
import { useFilterContext } from '@/context/FilterContext'
import Table from './Table'

const RenjaTargetPage = () => {
  const { activatedDinas: kodeOpd, activatedTahun: selectedTahun, activatedBulan: selectedBulan } = useFilterContext()

  if (!kodeOpd) {
    return (
      <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
        Silakan pilih OPD terlebih dahulu untuk melihat data renja OPD.
      </div>
    )
  }

  if (!selectedTahun || !selectedBulan) {
    return (
      <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
        Pilih dan aktifkan tahun dan bulan agar data renja OPD muncul.
      </div>
    )
  }

  return (
    <div className="transition-all ease-in-out duration-500">
      <h2 className="text-lg font-semibold mb-2">Rencana Kerja OPD</h2>
      <Table />
    </div>
  )
}

export default RenjaTargetPage