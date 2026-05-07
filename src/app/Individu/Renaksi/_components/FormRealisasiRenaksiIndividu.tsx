'use client'

import React, { useEffect, useMemo, useState } from "react";
import { ButtonSky } from "@/components/Global/Button/button";
import { LoadingButtonClip } from "@/components/Global/Loading";
import { FormProps, RenaksiTarget, RenaksiBatchRequest, RenaksiIndividuResponse } from "@/types";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { useFilterContext } from "@/context/FilterContext";
import { useSubmitData } from "@/hooks/useSubmitData";
import { getMonthKey, getMonthName } from "@/lib/months";

type FormRealisasiRenaksiIndividuProps = FormProps<RenaksiTarget[], RenaksiTarget[]>;

const FormRealisasiRenaksiIndividu: React.FC<FormRealisasiRenaksiIndividuProps> = ({ requestValues, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<RenaksiTarget[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { tahun: selectedTahun, bulan: selectedBulan, activatedTahun, activatedBulan } = useFilterContext();
    const { url } = useApiUrlContext();
    const submitUrl = useMemo(
        () => (url ? `${url}/api/v1/realisasi/renaksi/batch` : "/api/v1/realisasi/renaksi/batch"),
        [url],
    );
    const { submit, loading, error } = useSubmitData<RenaksiIndividuResponse[]>({ url: submitUrl });
    const activeMonthKey = getMonthKey(activatedBulan);
    const activeMonthLabel = activeMonthKey
        ? getMonthName(activatedBulan) ?? `Bulan ${activeMonthKey}`
        : "Belum diaktifkan";
    const selectedMonthKey = getMonthKey(activatedBulan ?? selectedBulan);

    useEffect(() => {
        if (!requestValues?.length) {
            setFormData([]);
            return;
        }

        setFormData(
            requestValues.map((item) => ({
                ...item,
                tahun: selectedTahun ?? item.tahun,
                bulan: selectedMonthKey ?? getMonthKey(item.bulan) ?? null,
            }))
        );
    }, [requestValues, selectedTahun, selectedBulan, activatedBulan, selectedMonthKey]);

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
        const baseRenaksiId = first.renaksiId;
        const baseNip = first.nip;
        const baseBulan = getMonthKey(first.bulan);
        const baseRekinId = first.rekinId;

        const isBatchValid = formData.every((item) =>
            item.renaksiId === baseRenaksiId &&
            item.nip === baseNip &&
            getMonthKey(item.bulan) === baseBulan &&
            item.rekinId === baseRekinId
        );

        if (!isBatchValid) {
            setValidationError(
                "Batch harus memiliki renaksi, nip, bulan, dan rencana kinerja yang sama.",
            );
            return;
        }

        if (!baseBulan) {
            setValidationError("Bulan belum dipilih atau belum aktif.");
            return;
        }

        const payload: RenaksiBatchRequest[] = formData.map((item) => ({
            targetRealisasiId: item.targetRealisasiId,
            renaksiId: item.renaksiId,
            renaksi: item.renaksi,
            nip: item.nip,
            rekinId: item.rekinId,
            rekin: item.rekin,
            targetId: item.targetId,
            target: item.target,
            realisasi: item.realisasi,
            satuan: item.satuan,
            bulan: getMonthKey(item.bulan) ?? baseBulan,
            tahun: item.tahun,
            jenisRealisasi: item.jenisRealisasi,
        }));

        setIsSubmitting(true);
        const result = await submit(payload);
        setIsSubmitting(false);

        if (result) {
            const updatedTargets: RenaksiTarget[] = result.map((item) => ({
                targetRealisasiId: item.id,
                renaksiId: item.renaksiId,
                renaksi: item.renaksi,
                nip: item.nip,
                rekinId: item.rekinId,
                rekin: item.rekin,
                targetId: item.targetId,
                target: item.target,
                realisasi: item.realisasi,
                satuan: item.satuan,
                bulan: item.bulan,
                tahun: item.tahun,
                jenisRealisasi: item.jenisRealisasi,
                capaian: item.capaian,
                keteranganCapaian: item.keteranganCapaian ?? undefined,
                rencanaKinerja: item.rekin,
            }));
            onSuccess?.(updatedTargets);
            onClose();
        } else {
            setValidationError(error ?? "Terjadi kesalahan saat menyimpan.");
            console.error("Submission failed:", error);
        }
    };

    const currentPlan = formData[0]?.rencanaKinerja ?? "-";

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
                                {activatedTahun} - {activeMonthLabel}
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

export default FormRealisasiRenaksiIndividu;
