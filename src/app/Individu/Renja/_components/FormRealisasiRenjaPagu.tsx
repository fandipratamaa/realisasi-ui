'use client'

import React, { useEffect, useMemo, useState } from "react";
import { ButtonSky } from "@/components/Global/Button/button";
import { LoadingButtonClip } from "@/components/Global/Loading";
import { FormProps, RenjaTarget, RenjaPaguBatchRequest, RenjaPaguIndividuResponse } from "@/types";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { useFilterContext } from "@/context/FilterContext";
import { useSubmitData } from "@/hooks/useSubmitData";
import { getMonthKey, getMonthName } from "@/lib/months";

type FormRealisasiRenjaPaguProps = FormProps<RenjaTarget[], RenjaTarget[]>;

const FormRealisasiRenjaPagu: React.FC<FormRealisasiRenjaPaguProps> = ({ requestValues, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<RenjaTarget[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { tahun: selectedTahun, activatedBulan } = useFilterContext();
    const monthKey = getMonthKey(activatedBulan);
    const monthLabel = getMonthName(activatedBulan);
    const activePeriodLabel = selectedTahun && monthLabel ? `${selectedTahun} - ${monthLabel}` : (selectedTahun ?? "Tahun");
    const { url } = useApiUrlContext();
    const submitUrl = useMemo(
        () => (url ? `${url}/api/v1/realisasi/renja_pagu_individu/batch` : "/api/v1/renja_pagu_individu/batch"),
        [url],
    );
    const { submit, loading, error } = useSubmitData<RenjaPaguIndividuResponse[]>({ url: submitUrl });

    useEffect(() => {
        if (!requestValues?.length) {
            setFormData([]);
            return;
        }

        setFormData(
            requestValues.map((item) => ({
                ...item,
                tahun: selectedTahun ?? item.tahun,
                bulan: monthKey ?? item.bulan,
            }))
        );
    }, [requestValues, selectedTahun, monthKey]);

    const handleChange = (targetId: string, tahun: string, value: string) => {
        const parsedValue = parseFloat(value);
        setFormData((previous) =>
            previous.map((item) =>
                item.targetId === targetId && item.tahun === tahun
                    ? { ...item, realisasiPagu: isNaN(parsedValue) ? 0 : parsedValue }
                    : item
            )
        );
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidationError(null);

        if (!formData.length) {
            setValidationError("Data realisasi belum tersedia.");
            return;
        }

        if (!monthKey) {
            setValidationError("Bulan belum dipilih atau belum aktif.");
            return;
        }

const payload: RenjaPaguBatchRequest[] = formData.map((item) => ({
            targetRealisasiId: item.targetRealisasiId,
            renjaId: item.renjaId,
            renja: item.renja,
            kodeRenja: item.kodeRenja,
            jenisRenja: item.jenisRenja,
            nip: item.nip,
            idIndikator: item.idIndikator,
            indikator: item.indikator,
            pagu: item.pagu ?? 0,
            realisasi: item.realisasiPagu ?? 0,
            satuan: item.satuanPagu ?? item.satuan ?? "",
            tahun: item.tahun,
            bulan: getMonthKey(item.bulan) ?? monthKey,
            jenisRealisasi: item.jenisRealisasi ?? "NAIK",
        }));

        setIsSubmitting(true);
        const result = await submit(payload);
        setIsSubmitting(false);

        if (result) {
            const updatedTargets: RenjaTarget[] = formData.map((item, index) => {
                const responseItem = result[index];
                return {
                    ...item,
                    targetRealisasiId: responseItem?.id ?? item.targetRealisasiId,
                    realisasiPagu: responseItem?.realisasi ?? item.realisasiPagu,
                    capaianPagu: responseItem?.capaian ?? item.capaianPagu,
                    keteranganCapaianPagu: responseItem?.keteranganCapaian ?? item.keteranganCapaianPagu,
                };
            });
            onSuccess?.(updatedTargets);
            onClose();
        } else {
            setValidationError(error ?? "Terjadi kesalahan saat menyimpan.");
            console.error("Submission failed:", error);
        }
    };

    const currentRenja = formData[0]?.renja ?? "-";
    const currentIndikator = formData[0]?.indikator ?? "-";

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto"
        >
            <div className="mb-4">
                <h3 className="font-bold">Rencana Kerja: {currentRenja}</h3>
                <p className="text-sm text-gray-600 mt-1">Indikator: {currentIndikator}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                    {formData.map((target) => (
                        <div
                            key={`${target.targetId}-${target.tahun}`}
                            className="border p-2 rounded bg-gray-50 shadow-sm flex flex-col col-span-2"
                        >
                            <div className="text-center text-xs font-semibold bg-red-600 text-white rounded py-0.5 mb-1">
                                {activePeriodLabel}
                            </div>
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">Pagu</p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                                {target.pagu != null ? target.pagu.toLocaleString() : "-"}
                            </p>
                            <label className="uppercase text-xs font-bold text-gray-700 mb-2" htmlFor="realisasi">
                                Realisasi
                            </label>
                            <input
                                type="number"
                                className="w-full border rounded px-2 py-1 text-sm mb-1"
                                step="0.01"
                                name={`realisasi[${target.targetId}][${target.tahun}]`}
                                value={target.realisasiPagu ?? ''}
                                onChange={(event) =>
                                    handleChange(target.targetId, target.tahun, event.target.value)
                                }
                            />
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">Satuan</p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                                {target.satuanPagu || target.satuan || "-"}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            {validationError ? (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {validationError}
                </div>
            ) : null}
            <ButtonSky className="w-full mt-3" type="submit" disabled={isSubmitting || loading}>
                {isSubmitting || loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <LoadingButtonClip />
                        Menyimpan...
                    </span>
                ) : (
                    "Simpan"
                )}
            </ButtonSky>
        </form>
    );
};

export default FormRealisasiRenjaPagu;
