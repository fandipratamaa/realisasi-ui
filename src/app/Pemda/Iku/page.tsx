"use client";

import { LoadingBeat } from "@/components/Global/Loading";
import { useFetchData } from "@/hooks/useFetchData";
import { useFilterContext } from "@/context/FilterContext";
import React, { useEffect, useState } from "react";
import { gabunganDataPerencanaanRealisasi } from "./_lib/gabunganDataSasaranRealisasi";
import TableIku from "./_components/TableIku";
import {
  IkuPemdaPerencanaanResponse,
  IkuPemdaRealisasiResponse,
  IkuPemda,
  IkuPemdaTargetRealisasiCapaian,
} from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPercentageText } from "@/lib/formatPercentageText";

const IkuPage = () => {
  const {
    periode: selectedPeriode,
    activatedTahun: selectedTahun,
    activatedBulan,
  } = useFilterContext();
  const periode: number[] = [];
  if (selectedPeriode) {
    const [awalStr, akhirStr] = selectedPeriode.split("-").map((t) => t.trim());
    const awal = parseInt(awalStr);
    const akhir = parseInt(akhirStr);

    for (let y = awal; y <= akhir; y++) {
      periode.push(y);
    }
  }

  const tahunAwal = periode[0];
  const tahunAkhir = periode[periode.length - 1];
  const jenisPeriode = "rpjmd";
  const selectedTahunValue = selectedTahun ? parseInt(selectedTahun) : 2025;
  const canFetchPerencanaan =
    typeof tahunAwal === "number" && typeof tahunAkhir === "number";
  const {
    data: ikuPerencanaan,
    loading: perencanaanLoading,
    error: perencanaanError,
  } = useFetchData<IkuPemdaPerencanaanResponse>({
    url: canFetchPerencanaan
      ? `/api/perencanaan/indikator_utama/periode/${tahunAwal}/${tahunAkhir}/${jenisPeriode}`
      : null,
  });
  const {
    data: ikuRealisasi,
    loading: realisasiLoading,
    error: realisasiError,
  } = useFetchData<IkuPemdaRealisasiResponse>({
    url: selectedTahun ? `/api/realisasi/ikus/by-tahun/${selectedTahunValue}` : null,
  });
  const [PerencanaanIku, setPerencanaanIku] = useState<IkuPemda[]>([]);
  const [TargetRealisasiCapaian, setTargetRealisasiCapaian] = useState<
    IkuPemdaTargetRealisasiCapaian[]
  >([]);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("iku-pemda.pdf");
  const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);

  useEffect(() => {
    if (ikuPerencanaan?.data && ikuRealisasi) {
      const perencanaan = ikuPerencanaan.data;
      setPerencanaanIku(perencanaan);

      const combinedData = gabunganDataPerencanaanRealisasi(
        perencanaan,
        ikuRealisasi,
      );
      setTargetRealisasiCapaian(combinedData);
    }
  }, [ikuPerencanaan, ikuRealisasi]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  if (!selectedPeriode || !selectedTahun || !activatedBulan || periode.length === 0) {
    return (
      <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
        Pilih dan aktifkan periode, tahun, dan bulan agar data IKU pemda muncul.
      </div>
    );
  }

  if (perencanaanLoading || realisasiLoading)
    return <LoadingBeat loading={perencanaanLoading} />;
  if (perencanaanError)
    return <div>Error fetching perencanaan: {perencanaanError}</div>;
  if (realisasiError)
    return <div>Error fetching realisasi: {realisasiError}</div>;

  const sanitizeForPdf = (value: unknown) => {
    if (value == null) return "-";
    let text = String(value);

    try {
      text = text.normalize("NFKC");
    } catch {
      // ignore if environment doesn't support normalize
    }

    text = text
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/\u00b1/g, "+/-");

    text = text.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "");
    text = text.replace(/\s+/g, " ").trim();

    return text.length ? text : "-";
  };

  const createPdfDocument = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text("IKU Pemda", 40, 40);
    doc.setFontSize(10);
    doc.text(`Periode: ${selectedTahunValue}`, 40, 58);

    const tableHead = [[
      "No",
      "IKU",
      "Asal IKU",
      "Rumus Perhitungan",
      "Sumber Data",
      "Target",
      "Realisasi",
      "Satuan",
      "Capaian",
    ]];

    const tableBody: any[] = [];

    PerencanaanIku.forEach((iku, index) => {
        const targets = TargetRealisasiCapaian.filter(
        (item) => item.indikatorId === iku.indikator_id && item.tahun === String(selectedTahunValue),
      );

      if (targets.length === 0) {
        tableBody.push([
          index + 1,
          sanitizeForPdf(iku.indikator),
          sanitizeForPdf(iku.asal_iku),
          sanitizeForPdf(iku.rumus_perhitungan),
          sanitizeForPdf(iku.sumber_data),
          "-",
          "-",
          "-",
          "-",
        ]);
        return;
      }

      targets.forEach((target, targetIndex) => {
        tableBody.push([
          targetIndex === 0 ? index + 1 : "",
          targetIndex === 0 ? sanitizeForPdf(iku.indikator) : "",
          targetIndex === 0 ? sanitizeForPdf(iku.asal_iku) : "",
          targetIndex === 0 ? sanitizeForPdf(iku.rumus_perhitungan) : "",
          targetIndex === 0 ? sanitizeForPdf(iku.sumber_data) : "",
          sanitizeForPdf(target.target),
          sanitizeForPdf(target.realisasi ?? 0),
          sanitizeForPdf(target.satuan),
          sanitizeForPdf(formatPercentageText(target.capaian)),
        ]);
      });
    });

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 72,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [14, 165, 233],
        lineWidth: 0.5,
        textColor: [31, 41, 55],
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 26, halign: "center" },
        1: { cellWidth: 220 },
        2: { cellWidth: 100 },
        3: { cellWidth: 140 },
        4: { cellWidth: 100 },
        5: { cellWidth: 45, halign: "center" },
        6: { cellWidth: 45, halign: "center" },
        7: { cellWidth: 45, halign: "center" },
        8: { cellWidth: 45, halign: "center" },
      },
      tableWidth: "wrap",
      margin: { top: 72, right: 40, bottom: 40, left: 40 },
      theme: "grid",
    });

    const safeYearLabel = String(selectedTahunValue || "tahun").replace(/\s+/g, "-").toLowerCase();
    const fileName = `iku-pemda-${safeYearLabel}.pdf`;
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

  return (
    <div className="overflow-auto grid gap-2">
      <h2 className="text-lg font-semibold mb-2">Realisasi IKU Pemda</h2>
      <div className="mt-2 rounded-t-lg border border-red-400">
        <TableIku
          tahun={selectedTahunValue}
          ikuPemda={PerencanaanIku}
          targetRealisasiCapaian={TargetRealisasiCapaian}
          handleOpenPrintPreview={handleOpenPrintPreview}
        />
      </div>
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={handleClosePrintPreview}
          ></div>
          <div className="relative z-10 w-[95vw] max-w-6xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 border-b pb-2">
              <h2 className="text-lg font-semibold uppercase">Preview Cetak IKU Pemda</h2>
              <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
            </div>

            <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
              {pdfPreviewUrl ? (
                <iframe
                  title="Preview PDF IKU Pemda"
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
};

export default IkuPage;
