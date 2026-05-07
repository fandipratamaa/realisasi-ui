'use client'

import React, { useEffect, useState } from 'react'
import { LoadingBeat } from '@/components/Global/Loading'
import { useFilterContext } from '@/context/FilterContext'
import { useFetchData } from '@/hooks/useFetchData'
import { getMonthKey, getMonthName } from '@/lib/months'
import { formatPercentageText } from '@/lib/formatPercentageText'
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { RenaksiOpdMonthlyResponse, RenaksiOpdTriwulanResponse, RenaksiTriwulanCell } from '@/types'
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RenaksiRow {
  id: string | number
  renaksiId: string
  renaksi: string
  rekinId: string
  rekin: string
  targetId: string
  target: number | string
  realisasi: number
  satuan: string
  capaian: string
  keteranganCapaian: string | null
}

const EMPTY_TRIWULAN_CELL: RenaksiTriwulanCell = {
  target: '-',
  realisasi: 0,
  satuan: '-',
  capaian: '-',
  keteranganCapaian: '-',
}

const normalizeTriwulanCell = (
  cell: Partial<RenaksiTriwulanCell> | null | undefined,
): RenaksiTriwulanCell => ({
  target: cell?.target ?? '-',
  realisasi: cell?.realisasi ?? 0,
  satuan: cell?.satuan ?? '-',
  capaian: cell?.capaian ?? '-',
  keteranganCapaian: cell?.keteranganCapaian ?? '-',
})

const Table = () => {
  const [rows, setRows] = useState<RenaksiRow[]>([])
  const [triwulanRows, setTriwulanRows] = useState<RenaksiOpdTriwulanResponse[]>([])
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("renaksi-OPD.pdf");
  const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);

  const { activatedDinas: kodeOpd, activatedTahun, activatedBulan, namaDinas } = useFilterContext()

  const monthKey = getMonthKey(activatedBulan)
  const monthLabel = getMonthName(activatedBulan)

  const apiUrl =
    kodeOpd && activatedTahun && monthKey
      ? `/api/v1/realisasi/renaksi_opd/by-kode-opd/${encodeURIComponent(kodeOpd)}/by-tahun/${encodeURIComponent(activatedTahun)}/by-bulan/${encodeURIComponent(monthKey)}`
      : null

  const triwulanApiUrl =
    kodeOpd && activatedTahun
      ? `/api/v1/realisasi/renaksi_opd/by-kode-opd/${encodeURIComponent(kodeOpd)}/by-tahun/${encodeURIComponent(activatedTahun)}/rekap-triwulan`
      : null

  const { data, loading, error } = useFetchData<RenaksiOpdMonthlyResponse[]>({
    url: apiUrl,
  })

  const { data: triwulanData } = useFetchData<RenaksiOpdTriwulanResponse[]>({
    url: triwulanApiUrl,
  })

  useEffect(() => {
    if (!data) {
      setRows([])
      return
    }

    setRows(
      data.map((item) => ({
        id: item.id ?? `${item.renaksiId}-${item.targetId}`,
        renaksiId: item.renaksiId,
        renaksi: item.renaksi ?? '-',
        rekinId: item.rekinId,
        rekin: item.rekin ?? '-',
        targetId: item.targetId,
        target: item.target ?? '-',
        realisasi: item.realisasi ?? 0,
        satuan: item.satuan ?? '-',
        capaian: item.capaian ?? '-',
        keteranganCapaian: item.keteranganCapaian ?? '-',
      }))
    )
  }, [data])

  useEffect(() => {
    setTriwulanRows(triwulanData ?? [])
  }, [triwulanData])

  const createPdfDocument = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a3",
    });

    const periodLabel = `${activatedTahun || '-'}`;
    const opdTitle = namaDinas ? ` - ${namaDinas}` : "";

    doc.setFontSize(14);
    doc.text(`Renaksi OPD${opdTitle}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 40, 58);

    const tableHead = [[
      "No",
      "Rencana Aksi",
      "Rencana Kinerja",
      "TW1 Target",
      "TW1 Realisasi",
      "TW1 Satuan",
      "TW1 Capaian",
      "TW1 Ket. Capaian",
      "TW2 Target",
      "TW2 Realisasi",
      "TW2 Satuan",
      "TW2 Capaian",
      "TW2 Ket. Capaian",
      "TW3 Target",
      "TW3 Realisasi",
      "TW3 Satuan",
      "TW3 Capaian",
      "TW3 Ket. Capaian",
      "TW4 Target",
      "TW4 Realisasi",
      "TW4 Satuan",
      "TW4 Capaian",
      "TW4 Ket. Capaian",
    ]];

    const tableBody: any[] = [];

    triwulanRows.forEach((item, index) => {
      const tws = [item.tw1, item.tw2, item.tw3, item.tw4].map((tw) => normalizeTriwulanCell(tw ?? EMPTY_TRIWULAN_CELL));
      const detailRow = tws.flatMap((tw) => [
        tw?.target ?? "-",
        tw?.realisasi ?? "-",
        tw?.satuan ?? "-",
        formatPercentageText(tw?.capaian ?? "-"),
        formatPercentageText(tw?.keteranganCapaian ?? "-"),
      ]);

      tableBody.push([
        index + 1,
        item.renaksi || "-",
        item.rekin || "-",
        ...detailRow,
      ]);
    });

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 72,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: [16, 185, 129],
        lineWidth: 0.5,
        textColor: [31, 41, 55],
        valign: "top",
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        // Header uses green fill; make grid lines visible.
        lineColor: [255, 255, 255],
        lineWidth: 0.5,
      },
      tableWidth: "auto",
      margin: { top: 72, right: 40, bottom: 40, left: 40 },
      theme: "grid",
    });

    const safeYearLabel = String(activatedTahun || "tahun").replace(/\s+/g, "-").toLowerCase();
    const fileName = `renaksi-opd-${safeYearLabel}-triwulan.pdf`;
    return { doc, fileName };
  };

  const handleOpenPrintPreview = () => {
    const { doc, fileName } = createPdfDocument();
    const previewUrl = String(doc.output("bloburl"));

    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    setPreviewDoc(doc);
    setPdfFileName(fileName);
    setPdfPreviewUrl(previewUrl);
    setIsPrintPreviewOpen(true);
  };

  const handleClosePrintPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    setIsPrintPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPreviewDoc(null);
  };

  const handleDownloadPdf = () => {
    if (!previewDoc) return;
    previewDoc.save(pdfFileName);
  };

  const yearMonthColumnLabel = `${activatedTahun || 'Tahun'} - ${monthLabel || 'Bulan'}`

  if (loading) {
    return (
      <div className="rounded border border-emerald-200 px-4 py-6 text-center">
        <LoadingBeat loading={true} />
        <p className="text-sm text-gray-600 mt-2">Memuat data renaksi OPD...</p>
      </div>
    )
  }

  if (error) {
    const normalizedError = String(error).toLowerCase()
    const isOpdNotFoundError =
      normalizedError.includes('404') ||
      normalizedError.includes('not found') ||
      normalizedError.includes('tidak ditemukan')

    return (
      <div className="rounded border border-red-300 px-4 py-6 text-center text-sm text-red-700">
        {isOpdNotFoundError
          ? 'Data OPD yang anda pilih tidak ada'
          : `Gagal memuat data renaksi: ${error}`}
      </div>
    )
  }

  if (!monthKey) {
    return (
      <div className="rounded border border-emerald-200 px-4 py-6 text-center text-sm text-gray-600">
        Pilih dan aktifkan bulan agar data renaksi OPD muncul.
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="rounded border border-emerald-200 px-4 py-6 text-center text-sm text-gray-600">
        Data renaksi OPD tidak ada.
      </div>
    )
  }

  return (
    <div className="overflow-auto m-2 rounded-t-xl">
      <table id="print-area-renaksi" className="w-full">
        <thead>
          <tr className="text-xm bg-emerald-500 text-white">
            <td rowSpan={2} className="border-r border-b px-6 py-3 max-w-[100px] text-center">
              No
            </td>
            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[400px] text-center">
              Rencana Aksi
            </td>
            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[180px]">
              Rencana Kinerja
            </td>
            <th colSpan={4} className="border-l border-b px-6 py-3 min-w-[100px] text-center uppercase">
              {yearMonthColumnLabel}
            </th>
            <td
              rowSpan={2}
              className="border-l border-b px-6 py-3 min-w-[120px] text-center"
            >
              Aksi
            </td>
          </tr>
          <tr className="bg-emerald-500 text-white">
            <th className="border-l border-b px-3 py-2 min-w-[70px]">Target</th>
            <th className="border-l border-b px-3 py-2 min-w-[90px]">Realisasi (%)</th>
            <th className="border-l border-b px-3 py-2 min-w-[80px]">Capaian</th>
            <th className="border-l border-b px-3 py-2 min-w-[180px]">Keterangan Capaian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            return (
              <tr key={row.id}>
                <td className="border-x border-b border-emerald-500 py-4 px-3 text-center">
                  {index + 1}
                </td>
                <td className="border-r border-b border-emerald-500 px-6 py-4">
                  {row.renaksi || '-'}
                </td>
                <td className="border-r border-b border-emerald-500 px-6 py-4">
                  {row.rekin || '-'}
                </td>
                <td className="border-r border-b border-emerald-500 px-3 py-4 text-center align-middle">
                  {row.target ?? '-'}
                </td>
                <td className="border-r border-b border-emerald-500 px-3 py-4 text-center align-middle">
                  <div className="flex flex-col items-center leading-tight">
                    <span>{row.realisasi ?? '-'}</span>
                  </div>
                </td>
                <td className="border-r border-b border-emerald-500 px-3 py-4 text-center align-middle">
                  {formatPercentageText(row.capaian ?? '-')}
                </td>
                <td className="border-r border-b border-emerald-500 px-3 py-4 text-center align-middle">
                  {formatPercentageText(row.keteranganCapaian ?? '-')}
                </td>
                <td className="border-r border-b border-emerald-500 px-6 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <ButtonGreenBorder
                      className="w-full"
                      onClick={handleOpenPrintPreview}
                    >
                      Cetak
                    </ButtonGreenBorder>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={handleClosePrintPreview}
          ></div>
          <div className="relative z-10 w-[95vw] max-w-6xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 border-b pb-2">
              <h2 className="text-lg font-semibold uppercase">Preview Cetak Renaksi OPD</h2>
              <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
            </div>

            <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
              {pdfPreviewUrl ? (
                <iframe
                  title="Preview PDF Renaksi OPD"
                  src={pdfPreviewUrl}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Gagal memuat preview PDF.
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClosePrintPreview}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table
