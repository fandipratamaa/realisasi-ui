"use client";

import { LoadingBeat } from "@/components/Global/Loading";
import { useFetchData } from "@/hooks/useFetchData";
import { getMonthName } from "@/lib/months";
import { useFilterContext } from "@/context/FilterContext";
import {
    PerencanaanTujuanPemda,
    PerencanaanTujuanPemdaResponse,
    RealisasiTujuanResponse,
    TargetRealisasiCapaian,
    TujuanPemda,
} from "@/types";
import React, { useEffect, useState, useMemo } from "react";
import { ModalTujuanPemda } from "./_components/ModalTujuan";
import TableTujuan from "./_components/TableTujuan";
import { gabunganDataPerencanaanRealisasi } from "./_lib/gabunganDataPerencanaanRealisasi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPercentageText } from "@/lib/formatPercentageText";

export default function Tujuan() {
    const {
        periode: selectedPeriode,
        activatedTahun: selectedTahun,
        activatedBulan,
    } = useFilterContext();
    const selectedTahunValue = selectedTahun ? parseInt(selectedTahun) : 2025;
    const bulanName = getMonthName(activatedBulan ?? null);
    const periode = useMemo<number[]>(() => {
        if (!selectedPeriode) return [];

        const [awalStr, akhirStr] = selectedPeriode.split("-").map(t => t.trim());
        const awal = Number(awalStr);
        const akhir = Number(akhirStr);

        if (Number.isNaN(awal) || Number.isNaN(akhir)) return [];

        return Array.from({ length: akhir - awal + 1 }, (_, i) => awal + i);
    }, [selectedPeriode]);

    const years: number[] = [];
    if (selectedPeriode) {
        const [awalStr, akhirStr] = selectedPeriode.split("-").map((t) => t.trim());
        const awal = parseInt(awalStr);
        const akhir = parseInt(akhirStr);

        for (let y = awal; y <= akhir; y++) {
            years.push(y);
        }
    }

    const tahunAwal = periode[0];
    const tahunAkhir = periode[periode.length - 1];
    const jenisPeriode = "rpjmd";

    const canFetchPerencanaan =
        typeof tahunAwal === "number" && typeof tahunAkhir === "number";


    // FETCH DATA
    const {
        data: perencanaanData,
        loading: perencanaanLoading,
        error: perencanaanError,
    } = useFetchData<PerencanaanTujuanPemdaResponse>({
        url: canFetchPerencanaan
            ? `/api/perencanaan/tujuan_pemda/findall_with_pokin/${tahunAwal}/${tahunAkhir}/${jenisPeriode}`
            : null,
    });

    const {
        data: realisasiData,
        loading: realisasiLoading,
        error: realisasiError,
        refetch: refetchRealisasi,
    } = useFetchData<RealisasiTujuanResponse>({
        url: selectedTahun && bulanName
            ? `/api/v1/realisasi/tujuans/by-tahun/${selectedTahunValue}/by-bulan/${encodeURIComponent(bulanName)}`
            : null,
    });


    // state
    const [dataTargetRealisasi, setDataTargetRealisasi] =
        useState<TargetRealisasiCapaian[]>([]);
    const [tujuansPemda, setTujuansPemda] = useState<TujuanPemda[]>([]);
    const [OpenModal, setOpenModal] = useState<boolean>(false);
    const [selectedTujuan, setSelectedTujuan] = useState<
        TargetRealisasiCapaian[]
    >([]);
    const [perencanaanTujuan, setPerencanaanTujuan] = useState<
        PerencanaanTujuanPemda[]
    >([]);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState("tujuan-pemda.pdf");
    const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);

    // Effect
    useEffect(() => {
        if (!perencanaanData?.data || !realisasiData) return;

        const perencanaan = perencanaanData.data;
        setPerencanaanTujuan(perencanaan);

        setDataTargetRealisasi(
            gabunganDataPerencanaanRealisasi(perencanaan, realisasiData),
        );

        setTujuansPemda(
            perencanaan.flatMap(pokin => pokin.tujuan_pemda),
        );
    }, [perencanaanData, realisasiData]);

    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    if (selectedTahun === null || activatedBulan === null || !bulanName || periode.length === 0)
        return (
            <div className="p-5 bg-red-100 border-red-400 rounded text-red-700 my-5">
                Pilih dan aktifkan periode, tahun, dan bulan agar data tujuan pemda muncul.
            </div>
        );
    /* if (!perencanaanData || !realisasiData) return <LoadingBeat loading={perencanaanLoading} />; */
    if (perencanaanLoading || realisasiLoading)
        return <LoadingBeat loading={perencanaanLoading} />;
    if (perencanaanError)
        return <div>Error fetching perencanaan: {perencanaanError}</div>;
    if (realisasiError)
        return <div>Error fetching realisasi: {realisasiError}</div>;

    if (tujuansPemda.length === 0)
        return (
            <div className="rounded border border-red-200 px-4 py-6 text-center text-sm text-gray-600">
                Data tujuan pemda tidak ada.
            </div>
        );

    const handleOpenModal = (
        tujuan: TujuanPemda,
        data: TargetRealisasiCapaian[],
    ) => {
        // tujuan -> buat text diatas sama filter
        const targetCapaian = data.filter(
            (tc) => tc.tujuanId === tujuan.id.toString(),
        );

        if (targetCapaian) {
            setSelectedTujuan(targetCapaian); // Set the selected purpose to the found target capaian
        } else {
            console.warn("No matching target capaian found for the selected tujuan");
            setSelectedTujuan([]); // Optionally reset if nothing is found to avoid stale data
        }
        setOpenModal(true);
    };

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

        const periodLabel = `${selectedTahunValue} - ${bulanName}`;

        doc.setFontSize(14);
        doc.text("Tujuan Pemda", 40, 40);
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, 40, 58);

        const tableHead = [[
            "No",
            "Tujuan",
            "Visi/Misi",
            "Indikator",
            "Rumus Perhitungan",
            "Sumber Data",
            "Target",
            "Realisasi",
            "Satuan",
            "Capaian",
            "Keterangan Capaian",
        ]];

        const tableBody: any[] = [];

        tujuansPemda.forEach((tujuan, tujuanIndex) => {
            const indikatorList = tujuan.indikator ?? [];

            if (indikatorList.length === 0) {
                tableBody.push([
                    tujuanIndex + 1,
                    sanitizeForPdf(tujuan.tujuan_pemda),
                    sanitizeForPdf(tujuan.misi),
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                ]);
                return;
            }

            indikatorList.forEach((indikator: any, indikatorIndex: number) => {
                const targetData = dataTargetRealisasi.find(
                    (r) =>
                        r.indikatorId === indikator.id.toString() &&
                        r.tahun === selectedTahunValue.toString(),
                );

                tableBody.push([
                    indikatorIndex === 0 ? tujuanIndex + 1 : "",
                    indikatorIndex === 0 ? sanitizeForPdf(tujuan.tujuan_pemda) : "",
                    indikatorIndex === 0 ? sanitizeForPdf(tujuan.misi) : "",
                    sanitizeForPdf(indikator.indikator),
                    sanitizeForPdf(indikator.rumus_perhitungan),
                    sanitizeForPdf(indikator.sumber_data),
                    sanitizeForPdf(targetData?.target),
                    sanitizeForPdf(targetData?.realisasi ?? 0),
                    sanitizeForPdf(targetData?.satuan),
                    sanitizeForPdf(formatPercentageText(targetData?.capaian)),
                    sanitizeForPdf(formatPercentageText(targetData?.keteranganCapaian)),
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
                lineColor: [248, 113, 113],
                lineWidth: 0.5,
                textColor: [31, 41, 55],
                valign: "top",
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: [239, 68, 68],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
                valign: "middle",
            },
            columnStyles: {
                0: { cellWidth: 26, halign: "center" },
                1: { cellWidth: 150 },
                2: { cellWidth: 120 },
                3: { cellWidth: 70 },
                4: { cellWidth: 100, halign: "center" },
                5: { cellWidth: 50, halign: "center" },
                6: { cellWidth: 50, halign: "center" },
                7: { cellWidth: 50, halign: "center" },
                8: { cellWidth: 50, halign: "center" },
                9: { cellWidth: 50, halign: "center" },
                10: { cellWidth: 70 },
            },
            tableWidth: "wrap",
            margin: { top: 72, right: 40, bottom: 40, left: 40 },
            theme: "grid",
        });

        const safeMonthLabel = String(bulanName ?? "bulan").replace(/\s+/g, "-").toLowerCase();
        const safeYearLabel = String(selectedTahunValue || "tahun").replace(/\s+/g, "-").toLowerCase();
        const fileName = `tujuan-pemda-${safeYearLabel}-${safeMonthLabel}.pdf`;
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

    // here's the magic
    // filter the fkin periode
    const periodeTampil = years.filter((p) => p === parseInt(selectedTahun));

    return (
        <div className="overflow-auto grid gap-2">
            <h2 className="text-lg font-semibold mb-2">Realisasi Tujuan Pemda</h2>
            <div className="mt-2 rounded-t-lg border border-red-400">
                <TableTujuan
                    tahun={parseInt(selectedTahun)}
                    bulanLabel={bulanName}
                    tujuansPemda={tujuansPemda}
                    targetRealisasiCapaians={dataTargetRealisasi}
                    handleOpenPrintPreview={handleOpenPrintPreview}
                    handleOpenModal={handleOpenModal}
                />
                <ModalTujuanPemda
                    item={selectedTujuan}
                    tahun={parseInt(selectedTahun)}
                    bulanLabel={bulanName}
                    isOpen={OpenModal}
                    onClose={() => {
                        setOpenModal(false);
                    }}
                    onSuccess={() => {
                        setOpenModal(false);
                        refetchRealisasi();
                    }}
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
                            <h2 className="text-lg font-semibold uppercase">Preview Cetak Tujuan Pemda</h2>
                            <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
                        </div>

                        <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
                            {pdfPreviewUrl ? (
                                <iframe
                                    title="Preview PDF Tujuan Pemda"
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
