'use client'

import React, { useMemo, useState, useEffect } from "react";
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { FormModal } from "@/components/Global/Modal";
import { LoadingBeat } from "@/components/Global/Loading";
import FormRealisasiRekinIndividu from "./_components/FormRealisasiRekinIndividu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useFilterContext } from "@/context/FilterContext";
import { useUserContext } from "@/context/UserContext";
import { useFetchData } from "@/hooks/useFetchData";
import { getMonthKey, getMonthName } from "@/lib/months";
import { formatPercentageText } from "@/lib/formatPercentageText";
import { RekinIndividuResponse, RekinTarget } from "@/types";
import { getHeaderColor } from "@/lib/userLevelStyle";
import { ROLES } from "@/constants/roles";

interface TableRow {
    id: number;
    rekin: string;
    nama_pegawai: string;
    nip: string;
    indikator: string;
    sasaran: string;
    targets: RekinTarget[];
}

const Table = () => {
    const { user } = useUserContext();
    const { tahun: selectedTahun, activatedTahun, activatedBulan, namaDinas } = useFilterContext();
    const canBypassNip = user?.roles.includes(ROLES.SUPER_ADMIN) || user?.roles.includes(ROLES.ADMIN_OPD);
    const [rows, setRows] = useState<TableRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string>("rekin-individu.pdf");
    const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);

    const userLevel = user?.roles.find(r => r.startsWith('level_'));

const getHeaderColor = (level: string | undefined) => {
        switch(level) {
            case ROLES.LEVEL_1: return 'bg-red-600 text-white';
            case ROLES.LEVEL_2: return 'bg-blue-600 text-white';
            case ROLES.LEVEL_3: return 'bg-green-600 text-white';
            case ROLES.LEVEL_4: return 'bg-orange-600 text-white';
            default: return 'bg-emerald-500 text-white';
        }
    };

    const getHeaderFillColor = (level: string | undefined): [number, number, number] => {
        switch(level) {
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

    const apiUrl = useMemo(() => {
        if (!user?.nip || !yearLabel || !monthKey) return null;
        return `/api/v1/realisasi/rekin/by-nip/${encodeURIComponent(
            user.nip,
        )}/by-tahun/${encodeURIComponent(yearLabel)}/by-bulan/${encodeURIComponent(monthKey)}`;
    }, [user?.nip, yearLabel, monthKey]);

    const { data, loading, error } = useFetchData<RekinIndividuResponse[]>({
        url: apiUrl,
    });

    useEffect(() => {
        if (!yearLabel) {
            setRows([]);
            setIsModalOpen(false);
            setSelectedRow(null);
            return;
        }

        if (!data || !user) {
            setRows([]);
            return;
        }

        const namaPegawaiParts = [user.firstName, user.lastName].filter(Boolean);
        const namaPegawai = namaPegawaiParts.join(" ").trim() || "Pengguna";

        setRows(
            data.map((item) => {
                const target: RekinTarget = {
                    targetRealisasiId: item.id ?? null,
                    rekinId: item.rekinId,
                    rekin: item.rekin ?? "-",
                    nip: item.nip ?? user.nip ?? "-",
                    indikatorId: item.indikatorId ?? "",
                    indikator: item.indikator ?? "-",
                    targetId: item.targetId,
                    target: item.target ?? "-",
                    realisasi: item.realisasi ?? 0,
                    satuan: item.satuan ?? "-",
                    tahun: item.tahun ?? yearLabel,
                    bulan: item.bulan ?? monthLabel ?? undefined,
                    jenisRealisasi: item.jenisRealisasi ?? "NAIK",
                    capaian: item.capaian ?? "-",
                    keteranganCapaian: item.keteranganCapaian ?? "-",
                    idSasaran: item.idSasaran,
                    sasaran: item.sasaran,
                };

                return {
                    id: item.id,
                    rekin: item.rekin ?? "-",
                    nama_pegawai: namaPegawai,
                    nip: item.nip ?? user.nip ?? "-",
                    indikator: item.indikator ?? "-",
                    sasaran: item.sasaran ?? "-",
                    targets: [target],
                };
            }),
        );
    }, [data, user, yearLabel]);

    const handleOpenModal = (row: TableRow) => {
        setSelectedRow(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRow(null);
    };

    const handleRealisasiSuccess = (updatedTargets: RekinTarget[]) => {
        const rowId = selectedRow?.id;
        setRows((current) =>
            current.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        targets: updatedTargets,
                    }
                    : row,
            ),
        );
        handleCloseModal();
    };

    const modalValues = useMemo(
        () => selectedRow?.targets ?? [],
        [selectedRow],
    );

    const createPdfDocument = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
        });

        const periodLabel = `${yearLabel} - ${monthLabel}`;
        const opdTitle = namaDinas ? ` - ${namaDinas}` : "";

        doc.setFontSize(14);
        doc.text(`Rekin Individu${opdTitle}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, 40, 58);

        const tableHead = [[
            "No",
            "Rencana Kinerja",
            "Nama Pemilik",
            "Indikator",
            "Sasaran",
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
                        { content: item.indikator || "-", rowSpan: targets.length },
                        { content: item.sasaran || "-", rowSpan: targets.length },
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
        const fileName = `rekin-individu-${safeYearLabel}-${safeMonthLabel}.pdf`;
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
        ? "Silakan login terlebih dahulu untuk melihat data rekin individu."
        : !yearLabel || !monthLabel
            ? "Pilih dan aktifkan tahun dan bulan agar data rekin individu muncul."
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
                    Memuat data rekin individu...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded border border-red-300 px-4 py-6 text-center text-sm text-red-700">
                Gagal memuat data rekin individu: {error}
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="rounded border border-red-200 px-4 py-6 text-center text-sm text-gray-600">
                Data rekin individu tidak ada.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-auto m-2 rounded-t-xl">
                <table id="print-area-rekin" className="w-full">
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
                                className="border-r border-b px-6 py-3 min-w-[400px] text-center"
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
                                className="border-r border-b px-6 py-3 min-w-[300px]"
                            >
                                Indikator
                            </td>
                            <td
                                rowSpan={2}
                                className="border-r border-b px-6 py-3 min-w-[250px]"
                            >
                                Sasaran
                            </td>
<th colSpan={5} className="border-l border-b px-6 py-3 min-w-[100px]">
                                {yearLabel} - {monthLabel}
                            </th>
                            <td
                                rowSpan={2}
                                className="border-l border-b px-6 py-3 min-w-[120px] text-center"
                            >
                                Aksi
                            </td>
                        </tr>
                        <tr className={headerColor}>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Target</th>
                            <th className="border-l border-b px-6 py-3 min-w-[100px]">Realisasi</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Satuan</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((item, index) => {
                            const target = item.targets[0];
                            return (
                                <tr key={item.id}>
                                    <td className="border-x border-b border-emerald-500 py-4 px-3 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {item.rekin || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        <div className="flex flex-col items-center gap-2 ">
                                            <p>{item.nama_pegawai || "-"}</p>
                                            <p>({item.nip || "-"})</p>
                                        </div>
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        <div className="flex gap-2 items-center">
                                            <p>{item.indikator || "-"}</p>
                                        </div>
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {item.sasaran || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {target?.target || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4 align-top">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>{target?.realisasi ?? "-"}</span>
                                            <ButtonGreenBorder
                                                className="w-full"
                                                onClick={() => handleOpenModal(item)}
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
                onClose={handleCloseModal}
                title={`Realisasi ${selectedRow?.rekin ?? ""}`}
            >
                <FormRealisasiRekinIndividu
                    requestValues={modalValues}
                    onClose={handleCloseModal}
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
                            <h2 className="text-lg font-semibold uppercase">Preview Cetak Rekin Individu</h2>
                            <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
                        </div>

                        <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
                            {pdfPreviewUrl ? (
                                <iframe
                                    title="Preview PDF Rekin Individu"
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
