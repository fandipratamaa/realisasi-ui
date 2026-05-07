'use client'

import React, { useEffect, useState } from "react";
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { FormModal } from "@/components/Global/Modal";
import { LoadingBeat } from "@/components/Global/Loading";
import FormRealisasiRenaksiIndividu from "./_components/FormRealisasiRenaksiIndividu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useFilterContext } from "@/context/FilterContext";
import { useUserContext } from "@/context/UserContext";
import { useFetchData } from "@/hooks/useFetchData";
import { getMonthKey, getMonthName } from "@/lib/months";
import { formatPercentageText } from "@/lib/formatPercentageText";
import { RenaksiIndividuResponse, RenaksiTarget } from "@/types";
import { getHeaderColor } from "@/lib/userLevelStyle";
import { ROLES } from "@/constants/roles";

interface RenaksiRow {
  id: number;
  renaksi: string;
  nama_pegawai: string;
  nip: string;
  rekin: string;
  targets: RenaksiTarget[];
}

const Table = () => {
  const [rows, setRows] = useState<RenaksiRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<RenaksiRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("renaksi-individu.pdf");
  const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);

  const { activatedTahun, activatedBulan, namaDinas } = useFilterContext();
  const { user } = useUserContext();
  const canBypassNip = user?.roles.includes(ROLES.SUPER_ADMIN) || user?.roles.includes(ROLES.ADMIN_OPD);

  const userLevel = user?.roles.find(r => r.startsWith('level_'));

const getHeaderColor = (level: string | undefined) => {
    switch (level) {
      case ROLES.LEVEL_1: return 'bg-red-600 text-white';
      case ROLES.LEVEL_2: return 'bg-blue-600 text-white';
      case ROLES.LEVEL_3: return 'bg-green-600 text-white';
      case ROLES.LEVEL_4: return 'bg-orange-600 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const getHeaderFillColor = (level: string | undefined): [number, number, number] => {
    switch (level) {
      case ROLES.LEVEL_1: return [220, 38, 38];
      case ROLES.LEVEL_2: return [37, 99, 235];
      case ROLES.LEVEL_3: return [22, 163, 74];
      case ROLES.LEVEL_4: return [234, 88, 12];
      default: return [16, 185, 129];
    }
  };

  const headerColor = getHeaderColor(userLevel);
  const headerFillColor = getHeaderFillColor(userLevel);

  const yearLabel = activatedTahun;
  const monthKey = getMonthKey(activatedBulan);
  const monthLabel = getMonthName(activatedBulan);
  const apiUrl =
    activatedTahun && monthKey && user?.nip
      ? `/api/v1/realisasi/renaksi/by-nip/${encodeURIComponent(
        user.nip,
      )}/by-tahun/${encodeURIComponent(activatedTahun)}/by-bulan/${encodeURIComponent(monthKey)}`
      : null;

  const { data, loading, error } = useFetchData<RenaksiIndividuResponse[]>({
    url: apiUrl,
  });

  useEffect(() => {
    if (!data) {
      setRows([]);
      return;
    }

    const namaPegawaiParts = [user?.firstName, user?.lastName].filter(Boolean);
    const namaPegawai = namaPegawaiParts.join(" ").trim() || "Pengguna";

    setRows(
      data.map((item) => {
        const target: RenaksiTarget = {
          targetRealisasiId: item.id ?? null,
          renaksiId: item.renaksiId,
          renaksi: item.renaksi ?? "-",
          nip: item.nip ?? user?.nip ?? "-",
          rekinId: item.rekinId,
          rekin: item.rekin ?? "-",
          targetId: item.targetId,
          target: item.target,
          realisasi: item.realisasi,
          satuan: item.satuan,
          tahun: item.tahun,
          bulan: item.bulan,
          jenisRealisasi: item.jenisRealisasi,
          capaian: item.capaian ?? "-",
          keteranganCapaian: item.keteranganCapaian ?? "-",
          rencanaKinerja: item.rekin,
        };

        return {
          id: item.id,
          renaksi: item.renaksi ?? "-",
          nama_pegawai: namaPegawai,
          nip: item.nip ?? user?.nip ?? "-",
          rekin: item.rekin ?? "-",
          targets: [target],
        };
      }),
    );
  }, [data, user]);

  const monthColumnLabel = `${activatedTahun} - ${monthLabel}`;

  const openModal = (row: RenaksiRow) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const handleRealisasiSuccess = (updatedTargets: RenaksiTarget[]) => {
    if (!selectedRow) return;
    setRows((previous) =>
      previous.map((row) =>
        row.id === selectedRow.id ? { ...row, targets: updatedTargets } : row
      )
    );
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const createPdfDocument = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const periodLabel = `${monthColumnLabel}`;
    const opdTitle = namaDinas ? ` - ${namaDinas}` : "";

    doc.setFontSize(14);
    doc.text(`Renaksi Individu${opdTitle}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 40, 58);

    const tableHead = [[
      "No",
      "Rencana Kinerja",
      "Nama Pemilik",
      "Rencana Aksi",
      "Target",
      "Realisasi",
      "Satuan",
      "Capaian",
      "Keterangan Capaian",
    ]];

    const tableBody: any[] = [];

    rows.forEach((item, index) => {
      const targets = item.targets.length ? item.targets : [null];

      targets.forEach((target, targetIndex) => {
        const detailRow = [
          target?.target || "-",
          target?.realisasi ?? "-",
          target?.satuan || "-",
          formatPercentageText(target?.capaian || "-"),
          formatPercentageText(target?.keteranganCapaian || "-"),
        ];

        if (targetIndex === 0) {
          tableBody.push([
            { content: index + 1, rowSpan: targets.length },
            { content: item.rekin || "-", rowSpan: targets.length },
            { content: `${item.nama_pegawai || "-"} (${item.nip || "-"})`, rowSpan: targets.length },
            { content: item.renaksi || "-", rowSpan: targets.length },
            ...detailRow,
          ]);
          return;
        }

        tableBody.push(detailRow);
      });
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
        fillColor: headerFillColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineColor: [255, 255, 255],
        lineWidth: 0.5,
      },
      tableWidth: "auto",
      margin: { top: 72, right: 40, bottom: 40, left: 40 },
      theme: "grid",
    });

    const safeMonthLabel = String(monthLabel || "bulan").replace(/\s+/g, "-").toLowerCase();
    const safeYearLabel = String(yearLabel || "tahun").replace(/\s+/g, "-").toLowerCase();
    const fileName = `renaksi-individu-${safeYearLabel}-${safeMonthLabel}.pdf`;
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

  const infoMessage = !user || (!user?.nip && !canBypassNip)
    ? "Silakan login terlebih dahulu untuk melihat data renaksi individu."
    : !activatedTahun || !monthLabel
      ? "Pilih dan aktifkan tahun dan bulan agar data renaksi individu muncul."
      : undefined;

  if (infoMessage) {
    return (
      <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
        {infoMessage}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded border border-emerald-200 px-4 py-6 text-center">
        <LoadingBeat loading={true} />
        <p className="text-sm text-gray-600 mt-2">
          Memuat data renaksi individu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-300 px-4 py-6 text-center text-sm text-red-700">
        Gagal memuat data renaksi: {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded border border-red-200 px-4 py-6 text-center text-sm text-gray-600">
        Data renaksi individu tidak ada.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto m-2 rounded-t-xl">
        <table id="print-area-renaksi" className="w-full">
          <thead>
            <tr className={`text-xm ${headerColor}`}>
              <td
                rowSpan={2}
                className="border-r border-b px-6 py-3 max-w-[100px] text-center"
              >
                No
              </td>
              <td
                rowSpan={2}
                className="border-r border-b px-6 py-3 min-w-[180px]"
              >
                Rencana Kinerja
              </td>
              <td
                rowSpan={2}
                className="border-r border-b px-6 py-3 min-w-[200px]"
              >
                Nama Pemilik
              </td>
              <td
                rowSpan={2}
                className="border-r border-b px-6 py-3 min-w-[400px] text-center"
              >
                Rencana Aksi
              </td>
              <th
                colSpan={5}
                className="border-l border-b px-6 py-3 min-w-[100px]"
              >
                {monthColumnLabel}
              </th>
              <td
                rowSpan={2}
                className="border-l border-b px-6 py-3 min-w-[120px] text-center"
              >
                Aksi
              </td>
            </tr>
            <tr className={headerColor}>
              <th className="border-l border-b px-6 py-3 min-w-[50px]">Target</th>
              <th className="border-l border-b px-6 py-3 min-w-[50px]">
                Realisasi
              </th>
              <th className="border-l border-b px-6 py-3 min-w-[50px]">Satuan</th>
              <th className="border-l border-b px-6 py-3 min-w-[50px]">Capaian</th>
              <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const target = row.targets[0];
              return (
                <tr key={row.id}>
                  <td className="border-x border-b border-emerald-500 py-4 px-3 text-center">
                    {index + 1}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {row.rekin || "-"}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {row.nama_pegawai || "-"} ({row.nip || "-"})
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {row.renaksi || "-"}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {target?.target || "-"}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <span>{target?.realisasi ?? "-"}</span>
                      <ButtonGreenBorder
                        className="w-full"
                        onClick={() => openModal(row)}
                      >
                        Realisasi
                      </ButtonGreenBorder>
                    </div>
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {target?.satuan || "-"}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {formatPercentageText(target?.capaian || "-")}
                  </td>
                  <td className="border-r border-b border-emerald-500 px-6 py-4">
                    {formatPercentageText(target?.keteranganCapaian || "-")}
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
              );
            })}
          </tbody>
        </table>
      </div>
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`Realisasi Renaksi - ${selectedRow?.nama_pegawai ?? selectedRow?.renaksi ?? ""}`}
      >
        <FormRealisasiRenaksiIndividu
          requestValues={selectedRow?.targets ?? []}
          onClose={closeModal}
          onSuccess={handleRealisasiSuccess}
        />
      </FormModal>

      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={handleClosePrintPreview}
          ></div>
          <div className="relative z-10 w-[95vw] max-w-6xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 border-b pb-2">
              <h2 className="text-lg font-semibold uppercase">Preview Cetak Renaksi Individu</h2>
              <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
            </div>

            <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
              {pdfPreviewUrl ? (
                <iframe
                  title="Preview PDF Renaksi Individu"
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
    </>
  );
};

export default Table;
