'use client'

import React, { useEffect, useMemo, useState } from "react";
import { ButtonGreenBorder } from "@/components/Global/Button/button";
import { FormModal } from "@/components/Global/Modal";
import { LoadingBeat } from "@/components/Global/Loading";
import { useFilterContext } from "@/context/FilterContext";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { useFetchData } from "@/hooks/useFetchData";
import { getMonthKey, getMonthName } from "@/lib/months";
import { formatPercentageText } from "@/lib/formatPercentageText";
import { RenjaTargetOpdResponse } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import FormRealisasiRenjaTargetOpd from "./_components/FormRealisasiRenjaTargetOpd";
import FormRealisasiRenjaPaguOpd from "./_components/FormRealisasiRenjaPaguOpd";

interface ApiListResponse<T> {
    data?: T[];
}

interface RenjaNodeTargetValue {
    targetRealisasiId?: number | null;
    id_target: string;
    target: string;
    realisasi?: string | number | null;
    satuan?: string | null;
    capaian?: string | null;
    jenisRealisasi?: string | null;
    status?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
    keteranganCapaian?: string | null;
}

interface RenjaNodePaguValue {
    paguRealisasiId?: number | null;
    realisasi?: string | number | null;
    pagu?: number | null;
    status?: string | null;
    createdBy?: string | null;
    lastModifiedBy?: string | null;
    capaian?: string | null;
    keteranganCapaian?: string | null;
}

interface RenjaNodeIndikatorValue {
    id_indikator: string;
    indikator: string;
}

interface RenjaHierarchyNode {
    kode_renja: string;
    nama_renja: string | null;
    jenis_renja: string;
    target?: RenjaNodeTargetValue[];
    pagu?: RenjaNodePaguValue[];
    indikator?: RenjaNodeIndikatorValue[];
    bidang_urusan?: RenjaHierarchyNode[];
    program?: RenjaHierarchyNode[];
    kegiatan?: RenjaHierarchyNode[];
    subkegiatan?: RenjaHierarchyNode[];
}

interface RenjaOpdHierarchyResponse {
    kode_opd: string;
    tahun: string;
    bulan: string;
    pagu_total_realisasi: number;
    id_renja: string;
    urusan?: RenjaHierarchyNode[];
}

interface FlattenedRenjaRow {
    id: string;
    kodeOpd: string;
    tahun: string;
    bulan: string;
    urusanKey: string;
    urusanNumber: number;
    hierarchyLevel: number;
    kodeRenja: string;
    namaRenja: string;
    jenisRenja: string;
    indikator: string;
    targets: Array<{
        targetRealisasiId: number | null;
        renjaId: string;
        renja: string;
        kodeRenja: string;
        jenisRenja: string;
        indikatorId: string;
        indikator: string;
        targetId: string;
        target: string;
        realisasi: number | null;
        satuan: string;
        tahun: string;
        jenisRealisasi: string;
        capaian: string;
        keteranganCapaian: string;
        pagu: number | null;
        realistasiPagu: number | null;
        satuanPagu: string;
        capaianPagu: string;
        keteranganCapaianPagu: string;
    }>;
    targetRequest: RenjaTargetOpdResponse | null;
    paguRequest: Array<{
        targetRealisasiId: number | null;
        renjaId: string;
        renja: string;
        kodeRenja: string;
        jenisRenja: string;
        indikator: string;
        pagu: number | null;
        realistasiPagu: number | null;
        satuanPagu: string;
        tahun: string;
        jenisRealisasi: string;
        capaianPagu: string;
        keteranganCapaianPagu: string;
    }>;
}

const toJenisRenjaPayload = (jenisRenja: string | undefined): "URUSAN" | "BIDANGURUSAN" | "PROGRAM" | "KEGIATAN" | "SUBKEGIATAN" => {
    const normalized = (jenisRenja || "").toUpperCase();

    switch (normalized) {
        case "URUSAN":
            return "URUSAN";
        case "BIDANGURUSAN":
        case "BIDANG URUSAN":
            return "BIDANGURUSAN";
        case "PROGRAM":
            return "PROGRAM";
        case "KEGIATAN":
            return "KEGIATAN";
        case "SUBKEGIATAN":
        case "SUB KEGIATAN":
            return "SUBKEGIATAN";
        default:
            return "PROGRAM";
    }
};

const Table = () => {
    const [selectedRow, setSelectedRow] = useState<FlattenedRenjaRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string>("renja-opd.pdf");
    const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);
    const [modalType, setModalType] = useState<'target' | 'pagu'>('target');
    const { url } = useApiUrlContext();

    const { activatedDinas: kodeOpd, activatedTahun, activatedBulan, namaDinas } = useFilterContext();

    const bulanKey = getMonthKey(activatedBulan);
    const bulanName = getMonthName(activatedBulan);

    const getHeaderColorByJenisRenja = (jenisRenja: string | undefined) => {
        const normalizedJenisRenja = (jenisRenja || "").toLowerCase();

        if (normalizedJenisRenja.includes("bidang urusan")) return "bg-red-600 text-white";
        if (normalizedJenisRenja.includes("program")) return "bg-blue-600 text-white";
        if (normalizedJenisRenja.includes("subkegiatan") || normalizedJenisRenja.includes("sub kegiatan")) return "bg-lime-500 text-white";
        if (normalizedJenisRenja.includes("kegiatan")) return "bg-green-700 text-white";

        return "bg-sky-600 text-white";
    };

    const getHeaderFillColorByJenisRenja = (jenisRenja: string | undefined): [number, number, number] => {
        const normalizedJenisRenja = (jenisRenja || "").toLowerCase();

        if (normalizedJenisRenja.includes("bidang urusan")) return [220, 38, 38];
        if (normalizedJenisRenja.includes("program")) return [37, 99, 235];
        if (normalizedJenisRenja.includes("subkegiatan") || normalizedJenisRenja.includes("sub kegiatan")) return [132, 204, 22];
        if (normalizedJenisRenja.includes("kegiatan")) return [21, 128, 61];

        return [2, 132, 199];
    };

    const apiUrlTarget = kodeOpd && activatedTahun && bulanKey
        ? `${url}/api/v1/realisasi/renja_target/kodeOpd/${kodeOpd}/tahun/${activatedTahun}/bulan/${encodeURIComponent(bulanKey)}`
        : null;

    const apiUrlPagu = kodeOpd && activatedTahun && bulanKey
        ? `${url}/api/v1/realisasi/renja_pagu/kodeOpd/${kodeOpd}/tahun/${activatedTahun}/bulan/${encodeURIComponent(bulanKey)}`
        : null;

    const { data, loading, error, refetch } = useFetchData<ApiListResponse<RenjaOpdHierarchyResponse>>({ url: apiUrlTarget });
    const { data: paguResponse, loading: loadingPagu, error: errorPagu, refetch: refetchPagu } = useFetchData<ApiListResponse<RenjaOpdHierarchyResponse>>({ url: apiUrlPagu });

    const parseNumericValue = (value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;

        const normalized = value.replace(/,/g, "").trim();
        if (!normalized) return null;

        const parsed = Number.parseFloat(normalized);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const normalizeJenisRealisasi = (value: string | null | undefined): "NAIK" | "TURUN" => {
        return value === "TURUN" ? "TURUN" : "NAIK";
    };

    const normalizeJenisRenja = (jenisRenja: string | undefined) => {
        switch ((jenisRenja || "").toUpperCase()) {
            case "URUSAN":
                return "Urusan";
            case "BIDANGURUSAN":
                return "Bidang Urusan";
            case "PROGRAM":
                return "Program";
            case "KEGIATAN":
                return "Kegiatan";
            case "SUBKEGIATAN":
                return "Subkegiatan";
            default:
                return jenisRenja || "-";
        }
    };

    const formatRenjaName = (node: RenjaHierarchyNode) => {
        const label = normalizeJenisRenja(node.jenis_renja);
        const name = node.nama_renja?.trim();

        if (name) {
            return `${label} - ${name}`;
        }

        return label;
    };

    const joinIndikator = (indikator: RenjaNodeIndikatorValue[] | undefined) => {
        if (!indikator?.length) return "-";
        return indikator
            .map((item) => item.indikator?.trim())
            .filter(Boolean)
            .join("\n");
    };

    const joinTarget = (target: RenjaNodeTargetValue[] | undefined) => {
        if (!target?.length) return "-";
        return target
            .map((item) => item.target?.trim())
            .filter(Boolean)
            .join("\n");
    };

    const getTargetRequest = (
        targetItem: RenjaNodeTargetValue | undefined,
        node: RenjaHierarchyNode,
        root: RenjaOpdHierarchyResponse,
    ): RenjaTargetOpdResponse | null => {
        if (!targetItem) return null;

        const indikator = node.indikator?.[0];

        return {
            id: targetItem.targetRealisasiId ?? null,
            jenisRenjaId: node.kode_renja,
            jenisRenjaTarget: toJenisRenjaPayload(node.jenis_renja),
            indikatorId: indikator?.id_indikator ?? "",
            indikator: joinIndikator(node.indikator),
            targetId: targetItem.id_target,
            target: targetItem.target ?? "-",
            realisasi: parseNumericValue(targetItem.realisasi),
            satuan: targetItem.satuan ?? "-",
            tahun: root.tahun ?? activatedTahun ?? "",
            bulan: root.bulan ?? bulanKey ?? "",
            jenisRealisasi: normalizeJenisRealisasi(targetItem.jenisRealisasi),
            kodeOpd: root.kode_opd ?? kodeOpd ?? "",
            kodeRenja: node.kode_renja ?? "",
            status: targetItem.status ?? "UNCHECKED",
            createdBy: targetItem.createdBy ?? "",
            createdDate: "",
            lastModifiedDate: "",
            lastModifiedBy: targetItem.lastModifiedBy ?? "",
            version: 0,
            capaian: targetItem.capaian ?? "-",
            keteranganCapaian: targetItem.keteranganCapaian ?? "-",
        };
    };

    const getPaguRequest = (
        node: RenjaHierarchyNode,
        root: RenjaOpdHierarchyResponse,
    ) => {
        const paguItem = node.pagu?.[0];

        return [{
        targetRealisasiId: paguItem?.paguRealisasiId ?? null,
        renjaId: node.kode_renja,
        renja: formatRenjaName(node),
        kodeRenja: node.kode_renja,
        jenisRenja: toJenisRenjaPayload(node.jenis_renja),
        indikator: joinIndikator(node.indikator),
        pagu: paguItem?.pagu ?? null,
        realistasiPagu: parseNumericValue(paguItem?.realisasi),
        satuanPagu: "Rupiah",
        tahun: root.tahun ?? activatedTahun ?? "",
        jenisRealisasi: "NAIK",
        capaianPagu: paguItem?.capaian ?? "-",
        keteranganCapaianPagu: paguItem?.keteranganCapaian ?? "-",
    }];
    };

    const buildPaguNodeMap = (
        roots: RenjaOpdHierarchyResponse[] | undefined,
    ) => {
        const map = new Map<string, RenjaHierarchyNode>();

        const visitNode = (node: RenjaHierarchyNode) => {
            map.set(node.kode_renja, node);
            node.bidang_urusan?.forEach(visitNode);
            node.program?.forEach(visitNode);
            node.kegiatan?.forEach(visitNode);
            node.subkegiatan?.forEach(visitNode);
        };

        roots?.forEach((root) => root.urusan?.forEach(visitNode));

        return map;
    };

    const rows = useMemo(() => {
        const targetRoots = data?.data || [];
        if (!targetRoots.length) return [] as FlattenedRenjaRow[];

        const paguMap = buildPaguNodeMap(paguResponse?.data);
        const flattenedRows: FlattenedRenjaRow[] = [];

        const pushRows = (
            node: RenjaHierarchyNode,
            root: RenjaOpdHierarchyResponse,
            urusanNode: RenjaHierarchyNode,
            urusanNumber: number,
            hierarchyLevel: number,
        ) => {
            const matchedPaguNode = paguMap.get(node.kode_renja);
            const targetItems = node.target?.length ? node.target : [undefined];

            targetItems.forEach((targetItem, index) => {
                const indikatorId = node.indikator?.[0]?.id_indikator ?? "";
                const indikatorText = joinIndikator(node.indikator);
                const targetText = targetItem?.target ?? (index === 0 ? joinTarget(node.target) : "-");
                const paguNode = matchedPaguNode ?? node;
                const paguItem = paguNode.pagu?.[0];

                flattenedRows.push({
                    id: `${root.id_renja || 'renja'}-${node.kode_renja}-${targetItem?.id_target ?? 'row'}-${index}`,
                    kodeOpd: root.kode_opd ?? kodeOpd ?? "-",
                    tahun: root.tahun ?? activatedTahun ?? "",
                    bulan: root.bulan ?? bulanKey ?? "",
                    urusanKey: urusanNode.kode_renja,
                    urusanNumber,
                    hierarchyLevel,
                    kodeRenja: node.kode_renja ?? "-",
                    namaRenja: node.nama_renja?.trim() || "-",
                    jenisRenja: normalizeJenisRenja(node.jenis_renja),
                    indikator: indikatorText,
                    targets: [{
                        targetRealisasiId: null,
                        renjaId: node.kode_renja ?? "",
                        renja: formatRenjaName(node),
                        kodeRenja: node.kode_renja ?? "",
                        jenisRenja: formatRenjaName(node),
                        indikatorId,
                        indikator: indikatorText,
                        targetId: targetItem?.id_target ?? "",
                        target: targetText,
                        realisasi: parseNumericValue(targetItem?.realisasi),
                        satuan: targetItem?.satuan ?? "-",
                        tahun: root.tahun ?? activatedTahun ?? "",
                        jenisRealisasi: normalizeJenisRealisasi(targetItem?.jenisRealisasi),
                        capaian: targetItem?.capaian ?? "-",
                        keteranganCapaian: targetItem?.keteranganCapaian ?? "-",
                        pagu: paguItem?.pagu ?? null,
                        realistasiPagu: parseNumericValue(paguItem?.realisasi),
                        satuanPagu: "Rupiah",
                        capaianPagu: paguItem?.capaian ?? "-",
                        keteranganCapaianPagu: paguItem?.keteranganCapaian ?? "-",
                    }],
                    targetRequest: getTargetRequest(targetItem, node, root),
                    paguRequest: getPaguRequest(paguNode, root),
                });
            });

            node.bidang_urusan?.forEach((child) => pushRows(child, root, urusanNode, urusanNumber, hierarchyLevel + 1));
            node.program?.forEach((child) => pushRows(child, root, urusanNode, urusanNumber, hierarchyLevel + 1));
            node.kegiatan?.forEach((child) => pushRows(child, root, urusanNode, urusanNumber, hierarchyLevel + 1));
            node.subkegiatan?.forEach((child) => pushRows(child, root, urusanNode, urusanNumber, hierarchyLevel + 1));
        };

        let urusanNumber = 0;

        targetRoots.forEach((root) => root.urusan?.forEach((node) => {
            urusanNumber += 1;
            pushRows(node, root, node, urusanNumber, 0);
        }));

        return flattenedRows;
    }, [activatedTahun, bulanKey, data?.data, kodeOpd, paguResponse?.data]);

    const urusanRowSpans = useMemo(() => {
        const rowSpanMap = new Map<string, number>();

        rows.forEach((row) => {
            rowSpanMap.set(row.urusanKey, (rowSpanMap.get(row.urusanKey) ?? 0) + 1);
        });

        return rowSpanMap;
    }, [rows]);

    const firstRowIdByUrusan = useMemo(() => {
        const firstRowMap = new Map<string, string>();

        rows.forEach((row) => {
            if (!firstRowMap.has(row.urusanKey)) {
                firstRowMap.set(row.urusanKey, row.id);
            }
        });

        return firstRowMap;
    }, [rows]);

    const getHierarchyIndentClass = (hierarchyLevel: number) => {
        switch (hierarchyLevel) {
            case 0:
                return "pl-0";
            case 1:
                return "pl-4";
            case 2:
                return "pl-8";
            case 3:
                return "pl-12";
            default:
                return "pl-16";
        }
    };

    const getHierarchyCellColorClass = (jenisRenja: string) => {
        switch ((jenisRenja || "").toLowerCase()) {
            case "bidang urusan":
                return "bg-red-600 text-white";
            case "program":
                return "bg-blue-600 text-white";
            case "kegiatan":
                return "bg-green-700 text-white";
            case "subkegiatan":
                return "bg-lime-400 text-slate-900";
            default:
                return "bg-white text-slate-900";
        }
    };

    const getHierarchyCellColorForPdf = (jenisRenja: string): { fillColor?: [number, number, number]; textColor?: [number, number, number] } => {
        switch ((jenisRenja || "").toLowerCase()) {
            case "bidang urusan":
                return { fillColor: [220, 38, 38], textColor: [255, 255, 255] };
            case "program":
                return { fillColor: [37, 99, 235], textColor: [255, 255, 255] };
            case "kegiatan":
                return { fillColor: [21, 128, 61], textColor: [255, 255, 255] };
            case "subkegiatan":
                return { fillColor: [163, 230, 53], textColor: [15, 23, 42] };
            default:
                return { fillColor: [255, 255, 255], textColor: [31, 41, 55] };
        }
    };

    const handleSuccess = () => {
        refetch();
        refetchPagu();
        setIsModalOpen(false);
        setSelectedRow(null);
    };

    const openModal = (row: FlattenedRenjaRow, type: 'target' | 'pagu' = 'target') => {
        setSelectedRow(row);
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRow(null);
        setModalType('target');
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
        doc.text(`Renja OPD${opdTitle}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, 40, 58);

        const tableHead: any[] = [
            [
                { content: "No", rowSpan: 2 },
                { content: "Bidang Urusan/Program/Kegiatan/Subkegiatan", rowSpan: 2 },
                { content: "Indikator", rowSpan: 2 },
                { content: `Renja Target ${activatedTahun} - ${bulanName}`, colSpan: 4 },
                { content: `Renja Pagu ${activatedTahun} - ${bulanName}`, colSpan: 4 },
            ],
            [
                "Target",
                "Realisasi\n(%)",
                "Capaian",
                "Keterangan Capaian",
                "Pagu",
                "Realisasi\n(Rp.)",
                "Capaian",
                "Keterangan Capaian",
            ],
        ];

        const tableBody: any[] = [];

        const renderedUrusan = new Set<string>();

        rows.forEach((row) => {
            const target = row.targets[0];
            const isFirstRowInUrusan = !renderedUrusan.has(row.urusanKey);

            if (isFirstRowInUrusan) {
                renderedUrusan.add(row.urusanKey);
            }

            tableBody.push([
                ...(isFirstRowInUrusan ? [{ content: row.urusanNumber, rowSpan: urusanRowSpans.get(row.urusanKey) ?? 1 }] : []),
                `${"    ".repeat(row.hierarchyLevel)}${row.jenisRenja}\n${row.namaRenja !== "-" ? row.namaRenja : "-"}\n(${row.kodeRenja || "-"})`,
                row.indikator || "-",
                target?.target || "-",
                target?.realisasi ?? "-",
                formatPercentageText(target?.capaian || "-"),
                formatPercentageText(target?.keteranganCapaian || "-"),
                target?.pagu != null ? target.pagu.toLocaleString() : "-",
                target?.realistasiPagu != null ? target.realistasiPagu.toLocaleString() : "-",
                formatPercentageText(target?.capaianPagu || "-"),
                formatPercentageText(target?.keteranganCapaianPagu || "-"),
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
                0: { cellWidth: 26, halign: "center", valign: "middle" },
                1: { cellWidth: 130 },
                2: { cellWidth: 128 },
                3: { cellWidth: 56, halign: "center" },
                4: { cellWidth: 52, halign: "center" },
                5: { cellWidth: 50, halign: "center" },
                6: { cellWidth: 150, halign: "center" },
                7: { cellWidth: 62, halign: "center" },
                8: { cellWidth: 68, halign: "center" },
                9: { cellWidth: 54, halign: "center" },
                10: { cellWidth: 150, halign: "center" },
            },
            tableWidth: "wrap",
            margin: { top: 72, right: 40, bottom: 40, left: 40 },
            theme: "grid",
            didParseCell: (data) => {
                if (data.section !== "body" || data.column.index !== 1) return;

                const row = rows[data.row.index];
                if (!row) return;

                const { fillColor, textColor } = getHierarchyCellColorForPdf(row.jenisRenja);
                if (fillColor) {
                    data.cell.styles.fillColor = fillColor;
                }
                if (textColor) {
                    data.cell.styles.textColor = textColor;
                }
            },
        });

        const safeMonthLabel = String(bulanName || "bulan").replace(/\s+/g, "-").toLowerCase();
        const safeYearLabel = String(activatedTahun || "tahun").replace(/\s+/g, "-").toLowerCase();
        const fileName = `renja-opd-${safeYearLabel}-${safeMonthLabel}.pdf`;
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

    const jenisRenjaHeader = rows.find((row) => row.jenisRenja && row.jenisRenja !== "-")?.jenisRenja;
    const headerColor = getHeaderColorByJenisRenja(jenisRenjaHeader);
    const headerFillColor = getHeaderFillColorByJenisRenja(jenisRenjaHeader);

    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    if (loading || loadingPagu) {
        return (
            <div className="rounded border border-sky-200 px-4 py-6 text-center">
                <LoadingBeat loading={true} />
                <p className="text-sm text-gray-600 mt-2">
                    Memuat data renja OPD...
                </p>
            </div>
        );
    }

    if (error || errorPagu) {
        return (
            <div className="rounded border border-red-200 px-4 py-6 text-center text-sm text-red-600">
                Error: {error || errorPagu}
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="rounded border border-sky-200 px-4 py-6 text-center text-sm text-gray-600">
                Data renja target OPD dan renja pagu OPD tidak ada.
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
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[180px]">Bidang Urusan/Program/Kegiatan/Subkegiatan</td>
                            <td rowSpan={2} className="border-r border-b px-6 py-3 min-w-[300px]">Indikator</td>
                            <th colSpan={4} className="border-l border-b px-6 py-3 min-w-[100px]">{`Renja Target ${activatedTahun || "2025"} - ${bulanName || ""}`}</th>
                            <th colSpan={4} className="border-l border-b px-6 py-3 min-w-[100px]">{`Renja Pagu ${activatedTahun || "2025"} - ${bulanName || ""}`}</th>
                            <td rowSpan={2} className="border-l border-b px-6 py-3 min-w-[160px] text-center">Aksi</td>
                        </tr>
                        <tr className={headerColor}>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Target</th>
                            <th className="border-l border-b px-6 py-3 min-w-[100px]">Realisasi (%)</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Pagu</th>
                            <th className="border-l border-b px-6 py-3 min-w-[100px]">Realisasi (Rp.)</th>
                            <th className="border-l border-b px-6 py-3 min-w-[80px]">Capaian</th>
                            <th className="border-l border-b px-6 py-3 min-w-[150px]">Keterangan Capaian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {(() => {
                                    const target = row.targets[0];
                                    const isFirstRowInUrusan = firstRowIdByUrusan.get(row.urusanKey) === row.id;

                                    return (
                                        <>
                                            {isFirstRowInUrusan && (
                                                <td rowSpan={urusanRowSpans.get(row.urusanKey) ?? 1} className="border-x border-b border-sky-600 py-4 px-3 text-center align-middle font-semibold">
                                                    {row.urusanNumber}
                                                </td>
                                            )}
                                            <td className={`border-r border-b border-sky-600 px-6 py-4 align-top ${getHierarchyCellColorClass(row.jenisRenja)}`}>
                                                <div className={`flex flex-col gap-1 ${getHierarchyIndentClass(row.hierarchyLevel)}`}>
                                                    <span className="font-semibold">{row.jenisRenja || "-"}</span>
                                                    {/*<span>{row.namaRenja !== "-" ? row.namaRenja : "-"}</span>*/}
                                                    <span className={`text-sm ${row.jenisRenja === "Subkegiatan" || row.jenisRenja === "Urusan" ? "text-slate-700" : "text-white/90"}`}>({row.kodeRenja || "-"})</span>
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 whitespace-pre-line align-top">
                                                {row.indikator || "-"}
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                {target?.target || "-"}
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>{target?.realisasi ?? "-"}</span>
                                                    <ButtonGreenBorder
                                                        className="w-full"
                                                        onClick={() => openModal(row, 'target')}
                                                        disabled={!row.targetRequest}
                                                    >
                                                        Realisasi
                                                    </ButtonGreenBorder>
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                {formatPercentageText(target?.capaian || "-")}
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                {formatPercentageText(target?.keteranganCapaian || "-")}
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                {target?.pagu != null ? target.pagu.toLocaleString() : "-"}
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span>{target?.realistasiPagu != null ? target.realistasiPagu.toLocaleString() : "-"}</span>
                                                    <ButtonGreenBorder
                                                        className="w-full"
                                                        onClick={() => openModal(row, 'pagu')}
                                                        disabled={target?.pagu == null}
                                                    >
                                                        Realisasi
                                                    </ButtonGreenBorder>
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-sky-600 px-6 py-4 align-top">
                                                {formatPercentageText(target?.capaianPagu || "-")}
                                            </td>
                                            <td className="border-x border-b border-sky-600 px-6 py-4 align-top">
                                                {formatPercentageText(target?.keteranganCapaianPagu || "-")}
                                            </td>
                                            {isFirstRowInUrusan && (
                                                <td rowSpan={urusanRowSpans.get(row.urusanKey) ?? 1} className="border-r border-b border-sky-600 px-6 py-4 text-center align-middle">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ButtonGreenBorder
                                                            className="w-full"
                                                            onClick={handleOpenPrintPreview}
                                                        >
                                                            Cetak
                                                        </ButtonGreenBorder>
                                                    </div>
                                                </td>
                                            )}
                                        </>
                                    );
                                })()}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <FormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={`Realisasi Renja ${modalType === 'pagu' ? 'Pagu' : 'Target'} - ${selectedRow?.jenisRenja ?? "-"} (${selectedRow?.kodeRenja ?? "-"})`}
            >
                {modalType === 'pagu' ? (
                    <FormRealisasiRenjaPaguOpd
                        requestValues={selectedRow?.paguRequest ?? []}
                        onClose={closeModal}
                        onSuccess={handleSuccess}
                    />
                ) : (
                    <FormRealisasiRenjaTargetOpd
                        requestValues={selectedRow?.targetRequest ?? null}
                        onClose={closeModal}
                        onSuccess={handleSuccess}
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
                            <h2 className="text-lg font-semibold uppercase">Preview Cetak Renja OPD</h2>
                            <p className="text-sm text-gray-600">Periksa tampilan sebelum mengunduh PDF.</p>
                        </div>

                        <div className="h-[70vh] overflow-hidden rounded border border-gray-300">
                            {pdfPreviewUrl ? (
                                <iframe
                                    title="Preview PDF Renja OPD"
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
