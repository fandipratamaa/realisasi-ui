'use client'

import React, { useEffect, useState } from "react";
import { ButtonSky } from "@/components/Global/Button/button";
import { LoadingButtonClip } from "@/components/Global/Loading";
import { FormProps, RenjaTargetOpdResponse, RenjaTargetOpdRequest } from "@/types";
import { useApiUrlContext } from "@/context/ApiUrlContext";
import { useSubmitData } from "@/hooks/useSubmitData";
import { getMonthKey, getMonthName } from "@/lib/months";

const FormRealisasiRenjaTargetOpd: React.FC<FormProps<RenjaTargetOpdResponse, RenjaTargetOpdResponse[]>> = ({
    requestValues,
    onClose,
    onSuccess
}) => {
    const { url } = useApiUrlContext();
    const { submit, loading, error } = useSubmitData<RenjaTargetOpdResponse[]>({ url: `${url}/api/v1/realisasi/renja_target/batch` });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<RenjaTargetOpdRequest | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (requestValues) {
            setFormData({
                targetRealisasiId: requestValues.id,
                jenisRenjaId: requestValues.jenisRenjaId,
                jenisRenja: requestValues.jenisRenjaTarget,
                indikatorId: requestValues.indikatorId,
                indikator: requestValues.indikator,
                targetId: requestValues.targetId,
                target: requestValues.target,
                realisasi: requestValues.realisasi,
                satuan: requestValues.satuan,
                tahun: requestValues.tahun,
                bulan: getMonthKey(requestValues.bulan) ?? "",
                jenisRealisasi: requestValues.jenisRealisasi,
                kodeOpd: requestValues.kodeOpd,
                kodeRenja: requestValues.kodeRenja
            });
        }
    }, [requestValues]);

    const convertToDisplayString = (value: number | null): string => {
        if (value === null || value === undefined) return '';
        return value.toString().replace('.', '.');
    };

    const handleChange = (value: string) => {
        const numericValue = value === '' ? null : parseFloat(value);
        setFormData((prev) => prev ? {
            ...prev,
            realisasi: numericValue === null || isNaN(numericValue) ? null : numericValue
        } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!formData) {
            setValidationError("Data realisasi belum tersedia.");
            return;
        }

        if (!getMonthKey(formData.bulan)) {
            setValidationError("Bulan tidak valid. Silakan pilih bulan aktif terlebih dahulu.");
            return;
        }

        const payload: RenjaTargetOpdRequest = {
            ...formData,
            targetRealisasiId: formData.targetRealisasiId ?? 0,
        };

        setIsSubmitting(true);
        const result = await submit([payload]);
        setIsSubmitting(false);

        if (result) {
            onSuccess?.(result);
            onClose();
        } else {
            setValidationError(error ?? "Terjadi kesalahan saat menyimpan.");
            console.error("Submission failed:", error);
        }
    };

    if (!formData) return null;

    const currentRenja = formData.jenisRenja ?? "-";
    const currentIndikator = formData.indikator ?? "-";
    const monthLabel = getMonthName(formData.bulan) ?? formData.bulan ?? "-";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            <div className="mb-4">
                <h3 className="font-bold">Rencana Kerja: {currentRenja}</h3>
                <p className="text-sm text-gray-600 mt-1">Indikator: {currentIndikator}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="border p-2 rounded bg-gray-50 shadow-sm flex flex-col col-span-2">
                        <div className="text-center text-xs font-semibold bg-red-500 text-white rounded py-0.5 mb-1">
                            {formData.tahun} - {monthLabel}
                        </div>
                        <p className="uppercase text-xs font-bold text-gray-700 mb-2">Target</p>
                        <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                            {formData.target}
                        </p>
                        <label className="uppercase text-xs font-bold text-gray-700 mb-2" htmlFor="realisasi">
                            Realisasi
                        </label>
                        <input
                            type="number"
                            className="w-full border rounded px-2 py-1 text-sm mb-1"
                            step="0.01"
                            name="realisasi"
                            id="realisasi"
                            value={convertToDisplayString(formData.realisasi)}
                            onChange={(e) => handleChange(e.target.value)}
                        />
                        <p className="uppercase text-xs font-bold text-gray-700 mb-2">Satuan</p>
                        <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">
                            {formData.satuan}
                        </p>
                    </div>
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

export default FormRealisasiRenjaTargetOpd;
