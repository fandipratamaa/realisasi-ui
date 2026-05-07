'use client'

import React, { useEffect, useState } from "react";
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { FormModal } from "@/components/Global/Modal";
import { LoadingBeat } from "@/components/Global/Loading";
import { useFilterContext } from "@/context/FilterContext";
import { useUserContext } from "@/context/UserContext";
import { useFetchData } from "@/hooks/useFetchData";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { getMonthKey, getMonthName } from "@/lib/months";
import { formatPercentageText } from "@/lib/formatPercentageText";
import { RenjaTargetIndividuResponse, RenjaTarget, RenjaPaguIndividuResponse } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import FormRealisasiRenjaTarget from "./_components/FormRealisasiRenjaTarget";
import FormRealisasiRenjaPagu from "./_components/FormRealisasiRenjaPagu";
import { getHeaderColor } from "@/lib/userLevelStyle";
import { ROLES } from "@/constants/roles";

interface RenjaRow {
    id: number;
    renja: string;
    nama_pegawai: string;
    nip: string;
    kodeRenja: string;
    jenisRenja: string;
    indikator: string;
    targets: RenjaTarget[];
}

const Table = () => {
    const [rows, setRows] = useState<RenjaRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<RenjaRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string>("renja-individu.pdf");
    const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);
    const [modalType, setModalType] = useState<'target' | 'pagu'>('target');

    const { tahun: selectedTahun, activatedTahun, activatedBulan, namaDinas } = useFilterContext();
    const { user } = useUserContext();
    const { url } = useApiUrlContext();
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

    const bulanKey = getMonthKey(activatedBulan);
    const bulanName = getMonthName(activatedBulan);

    const apiUrlTarget = url && user?.nip && activatedTahun && bulanKey
        ? `${url}/api/v1/realisasi/renja_target_individu/by-nip/${encodeURIComponent(user.nip)}/by-tahun/${encodeURIComponent(activatedTahun)}/by-bulan/${encodeURIComponent(bulanKey)}`
        : null;

    const apiUrlPagu = url && user?.nip && activatedTahun && bulanKey
        ? `${url}/api/v1/realisasi/renja_pagu_individu/by-nip/${encodeURIComponent(user.nip)}/by-tahun/${encodeURIComponent(activatedTahun)}/by-bulan/${encodeURIComponent(bulanKey)}`
        : null;

    const { data, loading, error } = useFetchData<RenjaTargetIndividuResponse[]>({
        url: apiUrlTarget,
    });

    const { data: paguResponse, loading: loadingPagu, error: errorPagu } = useFetchData<RenjaPaguIndividuResponse[]>({
        url: apiUrlPagu,
    });

    useEffect(() => {
        if (!activatedTahun || !bulanKey) {
            setRows([]);
            return;
        }

        if (!data || !paguResponse) {
            setRows([]);
            return;
        }

        const namaPegawaiParts = [user?.firstName, user?.lastName].filter(Boolean);
        const namaPegawai = namaPegawaiParts.join(" ").trim() || "Pengguna";

        const paguMap = new Map(paguResponse.map(p => [p.idIndikator, p]));

        setRows(
            data.map((item) => {
                const paguItem = paguMap.get(item.idIndikator);
                return {
                    id: item.id,
                    renja: item.renja ?? "-",
                    nama_pegawai: namaPegawai,
                    nip: item.nip ?? user?.nip ?? "-",
                    kodeRenja: item.kodeRenja ?? "-",
                    jenisRenja: item.jenisRenja ?? "-",
                    indikator: item.indikator ?? "-",
                    targets: [{
                        targetRealisasiId: item.id ?? null,
                        renjaId: item.renjaId,
                        renja: item.renja ?? "-",
                        kodeRenja: item.kodeRenja ?? "-",
                        jenisRenja: item.jenisRenja ?? "-",
                        nip: item.nip ?? user?.nip ?? "-",
                        idIndikator: item.idIndikator,
                        indikator: item.indikator ?? "-",
                        targetId: item.targetId,
                        target: item.target,
                        realisasi: item.realisasi,
                        satuan: item.satuan,
                        tahun: item.tahun,
                        bulan: item.bulan ?? bulanName ?? undefined,
                        jenisRealisasi: item.jenisRealisasi,
                        capaian: item.capaian ?? "-",
                        keteranganCapaian: item.keteranganCapaian ?? "-",
                        pagu: paguItem?.pagu ?? null,
                        realisasiPagu: paguItem?.realisasi ?? null,
                        satuanPagu: paguItem?.satuan ?? "-",
                        capaianPagu: paguItem?.capaian ?? "-",
                        keteranganCapaianPagu: paguItem?.keteranganCapaian ?? "-",
                    }],
                };
            })
        );
    }, [data, paguResponse, user, activatedTahun, bulanKey]);

    const openModal = (row: RenjaRow, type: 'target' | 'pagu' = 'target') => {
        setSelectedRow(row);
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRow(null);
        setModalType('target');
    };

    const handleRealisasiSuccess = (updatedTargets: RenjaTarget[]) => {
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
            format: "a3",
        });

        const periodLabel = `${activatedTahun} - ${bulanName}`;
        const opdTitle = namaDinas ? ` - ${namaDinas}` : "";

        doc.setFontSize(14);
        doc.text(`Renja Individu${opdTitle}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, 40, 58);

        const tableHead: any[] = [
            [
                { content: "No", rowSpan: 2 },
                { content: "Rencana Kerja", rowSpan: 2 },
                { content: "Nama Pemilik", rowSpan: 2 },
                { content: "Bidang Urusan/Program/Kegiatan/Subkegiatan", rowSpan: 2 },
                { content: "Indikator", rowSpan: 2 },
                { content: `Renja Target ${activatedTahun} - ${bulanName}`, colSpan: 5 },
                { content: `Renja Pagu ${activatedTahun} - ${bulanName}`, colSpan: 5 },
            ],
            [
                "Target",
                "Realisasi",
                "Satuan",
                "Capaian",
                "Keterangan Capaian",
                "Pagu",
                "Realisasi",
                "Satuan",
                "Capaian",
                "Keterangan Capaian",
            ],
        ];

        const tableBody: any[] = [];

        rows.forEach((row, index) => {
            const targets = row.targets.length ? row.targets : [null];

            targets.forEach((target, targetIndex) => {
                const detailRow = [
                    target?.target || "-",
                    target?.realisasi ?? "-",
                    target?.satuan || "-",
                    formatPercentageText(target?.capaian || "-"),
                    formatPercentageText(target?.keteranganCapaian || "-"),
                    target?.pagu != null ? target.pagu.toLocaleString() : "-",
                    target?.realisasiPagu != null ? target.realisasiPagu.toLocaleString() : "-",
                    target?.satuanPagu || "-",
                    formatPercentageText(target?.capaianPagu || "-"),
                    formatPercentageText(target?.keteranganCapaianPagu || "-"),
                ];

                if (targetIndex === 0) {
                    tableBody.push([
                        { content: index + 1, rowSpan: targets.length },
                        { content: row.renja || "-", rowSpan: targets.length },
                        { content: `${row.nama_pegawai || "-"} (${row.nip || "-"})`, rowSpan: targets.length },
                        { content: `${row.jenisRenja || "-"} (${row.kodeRenja || "-"})`, rowSpan: targets.length },
                        { content: row.indikator || "-", rowSpan: targets.length },
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
                cellPadding: 3,
                lineColor: [16, 185, 129],
                lineWidth: 0.5,
                textColor: [31, 41, 55],
                valign: "top",
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: headerFillColor,
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
                valign: "middle",
                lineColor: [255, 255, 255],
                lineWidth: 0.5,
            },
            columnStyles: {
                0: { cellWidth: 26, halign: "center" },
                1: { cellWidth: 140 },
                2: { cellWidth: 100 },
                3: { cellWidth: 118 },
                4: { cellWidth: 128 },
                5: { cellWidth: 48, halign: "center" },
                6: { cellWidth: 52, halign: "center" },
                7: { cellWidth: 46, halign: "center" },
                8: { cellWidth: 50, halign: "center" },
                9: { cellWidth: 100 },
                10: { cellWidth: 58, halign: "center" },
                11: { cellWidth: 62, halign: "center" },
                12: { cellWidth: 52, halign: "center" },
                13: { cellWidth: 54, halign: "center" },
                14: { cellWidth: 110 },
            },
            tableWidth: "wrap",
            margin: { top: 72, right: 40, bottom: 40, left: 40 },
            theme: "grid",
        });

        const safeMonthLabel = String(bulanName || "bulan").replace(/\s+/g, "-").toLowerCase();
        const safeYearLabel = String(activatedTahun || "tahun").replace(/\s+/g, "-").toLowerCase();
        const fileName = `renja-individu-${safeYearLabel}-${safeMonthLabel}.pdf`;
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
        ? "Silakan login terlebih dahulu untuk melihat data renja individu."
        : !activatedTahun || !bulanName
            ? "Pilih dan aktifkan tahun dan bulan agar data renja individu muncul."
            : undefined;

    if (infoMessage) {
        return (
            <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
                {infoMessage}
            </div>
        );
    }

    if (loading || loadingPagu) {
        return (
            <div className="rounded border border-emerald-200 px-4 py-6 text-center">
                <LoadingBeat loading={true} />
                <p className="text-sm text-gray-600 mt-2">
                    Memuat data renja individu...
                </p>
            </div>
        );
    }

    if (error || errorPagu) {
        return (
            <div className="rounded border border-red-300 px-4 py-6 text-center text-sm text-red-700">
                Gagal memuat data renja: {error || errorPagu}
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="rounded border border-red-200 px-4 py-6 text-center text-sm text-gray-600">
                Data renja individu tidak ada.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-auto m-2 rounded-t-xl">
                <table id="print-area-renja" className="w-full">
                    <thead>
                        <tr className={`text-xm ${headerColor}`}>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 max-w-[100px] text-center">No</td>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[400px] text-center">Rencana Kerja</td>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[200px]">Nama Pemilik</td>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[150px]">Bidang Urusan/Program/Kegitan/Subkegitan</td>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[300px]">Indikator</td>
                            <th colSpan={5} className="border-l border-b px-6 py-3 min-w-[100px]">{`Renja Target ${activatedTahun} - ${bulanName}`}</th>
                            <th colSpan={5} className="border-l border-b px-6 py-3 min-w-[100px]">{`Renja Pagu ${activatedTahun} - ${bulanName}`}</th>
                            <td rowSpan={2} className="border-l border-b px-6 py-3 min-w-[120px] text-center">Aksi</td>
                        </tr>
                        <tr className={headerColor}>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Target</th>
                            <th className="border-l border-b px-6 py-3 min-w-[100px]">Realisasi</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Satuan</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Pagu</th>
                            <th className="border-l border-b px-6 py-3 min-w-[100px]">Realisasi</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Satuan</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Capaian</th>
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
                                        {row.renja || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {row.nama_pegawai || "-"} ({row.nip || "-"})
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        <div className="flex flex-col">
                                            <span>{row.jenisRenja || "-"}</span>
                                            <span className="text-sm text-gray-500">({row.kodeRenja || "-"})</span>
                                        </div>
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {row.indikator || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {target?.target || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>{target?.realisasi ?? "-"}</span>
                                            <ButtonGreenBorder
                                                className="w-full"
                                                onClick={() => openModal(row, 'target')}
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
                                        {target?.pagu != null ? target.pagu.toLocaleString() : "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>{target?.realisasiPagu != null ? target.realisasiPagu.toLocaleString() : "-"}</span>
                                            <ButtonGreenBorder
                                                className="w-full"
                                                onClick={() => openModal(row, 'pagu')}
                                            >
                                                Realisasi
                                            </ButtonGreenBorder>
                                        </div>
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {target?.satuanPagu || "-"}
                                    </td>
                                    <td className="border-r border-b border-emerald-500 px-6 py-4">
                                        {formatPercentageText(target?.capaianPagu || "-")}
                                    </td>
                                    <td className="border-x border-b border-emerald-500 px-6 py-4">
                                        {formatPercentageText(target?.keteranganCapaianPagu || "-")}
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
                title={`Realisasi Renja ${modalType === 'pagu' ? 'Pagu' : 'Target'} - ${selectedRow?.nama_pegawai ?? selectedRow?.renja ?? ""}`}
            >
                {modalType === 'pagu' ? (
                    <FormRealisasiRenjaPagu
                        requestValues={selectedRow?.targets ?? []}
                        onClose={closeModal}
                        onSuccess={handleRealisasiSuccess}
                    />
                ) : (
                    <FormRealisasiRenjaTarget
                        requestValues={selectedRow?.targets ?? []}
                        onClose={closeModal}
                        onSuccess={handleRealisasiSuccess}
                    />
                )}
            </FormModal>
            {isPrintPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/40"
                        onClick={handleClosePrintPreview}
                    ></div>
                    <div className="relative z-10 w-[95vw] max-w-6xl rounded-lg bg-white p-4 shadow-lg">
                        <div className="mb-3 border-b pb-2">
                            <h2 className="text-lg font-semibold uppercase">Preview Cetak Renja Individu</h2>
                            <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
                        </div>

                        <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
                            {pdfPreviewUrl ? (
                                <iframe
                                    title="Preview PDF Renja Individu"
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
