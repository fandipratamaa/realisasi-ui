'use client'

import React, { useEffect, useMemo, useState } from "react";
import { ButtonSky } from "@/components/Global/Button/button";
import { LoadingButtonClip } from "@/components/Global/Loading";
import { FormProps, RekinTarget, RekinBatchRequest, RekinIndividuResponse } from "@/types";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { useFilterContext } from "@/context/FilterContext";
import { useSubmitData } from "@/hooks/useSubmitData";
import { getMonthKey, getMonthName } from "@/lib/months";

type FormRealisasiRekinIndividuProps = FormProps<RekinTarget[], RekinTarget[]>;

const FormRealisasiRekinIndividu: React.FC<FormRealisasiRekinIndividuProps> = ({ requestValues, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<RekinTarget[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { tahun: selectedTahun, activatedBulan } = useFilterContext();
    const monthKey = getMonthKey(activatedBulan);
    const monthLabel = getMonthName(activatedBulan);
    const activePeriodLabel = selectedTahun && monthLabel ? `${selectedTahun} - ${monthLabel}` : (selectedTahun ?? "Tahun");
    const { url } = useApiUrlContext();
    const submitUrl = useMemo(
        () => (url ? `${url}/api/v1/realisasi/rekin/batch` : "/api/v1/realisasi/rekin/batch"),
        [url],
    );
    const { submit, loading, error } = useSubmitData<RekinIndividuResponse[]>({ url: submitUrl });
    

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
                    ? { ...item, realisasi: isNaN(parsedValue) ? 0 : parsedValue }
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

        const [first] = formData;
        const baseRekinId = first.rekinId;
        const baseNip = first.nip;
        const baseTahun = first.tahun;
        const baseIndikatorId = first.indikatorId;

        const isBatchValid = formData.every((item) =>
            item.rekinId === baseRekinId &&
            item.nip === baseNip &&
            item.tahun === baseTahun &&
            item.indikatorId === baseIndikatorId
        );

        if (!isBatchValid) {
            setValidationError(
                "Batch harus memiliki rekin, nip, tahun, dan indikator yang sama.",
            );
            return;
        }

        if (!baseTahun) {
            setValidationError("Tahun belum dipilih atau belum aktif.");
            return;
        }

        if (!monthKey) {
            setValidationError("Bulan belum dipilih atau belum aktif.");
            return;
        }

const payload: RekinBatchRequest[] = formData.map((item) => ({
            targetRealisasiId: item.targetRealisasiId,
            rekinId: item.rekinId,
            rekin: item.rekin,
            nip: item.nip,
            indikatorId: item.indikatorId,
            indikator: item.indikator,
            targetId: item.targetId,
            target: item.target,
            realisasi: item.realisasi,
            satuan: item.satuan,
            tahun: item.tahun ?? baseTahun,
            bulan: getMonthKey(item.bulan) ?? monthKey,
            jenisRealisasi: item.jenisRealisasi,
            idSasaran: item.idSasaran,
            sasaran: item.sasaran,
        }));

        setIsSubmitting(true);
        const result = await submit(payload);
        setIsSubmitting(false);

if (result) {
            const updatedTargets: RekinTarget[] = result.map((item) => ({
                targetRealisasiId: item.id,
                rekinId: item.rekinId,
                rekin: item.rekin,
                nip: item.nip,
                indikatorId: item.indikatorId,
                indikator: item.indikator,
                targetId: item.targetId,
                target: item.target,
                realisasi: item.realisasi,
                satuan: item.satuan,
                tahun: item.tahun,
                bulan: item.bulan,
                jenisRealisasi: item.jenisRealisasi,
                capaian: item.capaian ?? undefined,
                keteranganCapaian: item.keteranganCapaian ?? undefined,
                idSasaran: item.idSasaran,
                sasaran: item.sasaran,
            }));
            onSuccess?.(updatedTargets);
            onClose();
        } else {
            setValidationError(error ?? "Terjadi kesalahan saat menyimpan.");
            console.error("Submission failed:", error);
        }
    };

    const currentPlan = formData[0]?.rekin ?? "-";

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto"
        >
            <div className="mb-4">
                <h3 className="font-bold">Rencana Kinerja: {currentPlan}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-sm">
                    {formData.map((target) => (
                        <div
                            key={`${target.targetId}-${target.tahun}`}
                            className="border p-2 rounded bg-gray-50 shadow-sm flex flex-col col-span-2"
                        >
                            <div className="text-center text-xs font-semibold bg-red-500 text-white rounded py-0.5 mb-1">
                                {activePeriodLabel}
                            </div>
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">Target</p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                                {target.target}
                            </p>
                            <label className="uppercase text-xs font-bold text-gray-700 mb-2" htmlFor="realisasi">
                                Realisasi
                            </label>
                            <input
                                type="number"
                                className="w-full border rounded px-2 py-1 text-sm mb-1"
                                step="0.01"
                                name={`realisasi[${target.targetId}][${target.tahun}]`}
                                value={target.realisasi || ''}
                                onChange={(event) =>
                                    handleChange(target.targetId, target.tahun, event.target.value)
                                }
                            />
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">Satuan</p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                                {target.satuan}
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

export default FormRealisasiRekinIndividu;
