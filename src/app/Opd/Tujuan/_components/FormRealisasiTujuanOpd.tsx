import { ButtonSky } from '@/components/Global/Button/button';
import { LoadingButtonClip } from '@/components/Global/Loading';
import { useApiUrlContext } from '@/context/ApiUrlContext';
import { useUserContext } from '@/context/UserContext';
import { useSubmitData } from '@/hooks/useSubmitData';
import { getMonthKey } from '@/lib/months';
import { canEditOpdRealisasi } from '@/lib/rbac';
import { FormProps, TujuanOpdTargetRealisasiCapaian, TujuanOpdRealisasi, TujuanOpdRealisasiRequest } from '@/types';
import React, { useEffect, useState } from 'react';

interface FormRealisasiTujuanOpdProps extends FormProps<TujuanOpdTargetRealisasiCapaian[], TujuanOpdRealisasi[]> {
    tahun: number;
    bulan: string;
    bulanLabel?: string;
}

const FormRealisasiTujuanOpd: React.FC<FormRealisasiTujuanOpdProps> = ({
    requestValues,
    onClose,
    onSuccess,
    tahun,
    bulan,
    bulanLabel
}) => {
    const { url } = useApiUrlContext();
    const { user } = useUserContext();
    const canEdit = canEditOpdRealisasi(user);
    const { submit, loading, error } = useSubmitData<TujuanOpdRealisasi[]>({ url: `${url}/api/v1/realisasi/tujuan_opd/batch` });
    const [Proses, setProses] = useState(false);
    const [formData, setFormData] = useState<TujuanOpdRealisasiRequest[]>([]);
    const normalizedBulan = getMonthKey(bulan);

    useEffect(() => {
        if (requestValues) {
            const filteredRequestValues = requestValues.filter((indikator) => indikator.tahun === tahun.toString());
            const generatedFormData: TujuanOpdRealisasiRequest[] = filteredRequestValues.map((indikator) => {
                return ({
                    targetRealisasiId: indikator.targetRealisasiId,
                    tujuanId: indikator.tujuanId,
                    indikatorId: indikator.indikatorId,
                    targetId: indikator.targetId,
                    target: typeof indikator.target === 'string' 
                        ? indikator.target.replace(',', '.') 
                        : indikator.target,
                    realisasi: indikator.realisasi,
                    satuan: indikator.satuan,
                    tahun: indikator.tahun,
                    bulan: normalizedBulan ?? '',
                    jenisRealisasi: 'NAIK',
                    kodeOpd: indikator.kodeOpd,
                    indikator: indikator.indikator,
                    rumusPerhitungan: indikator.rumusPerhitungan,
                    sumberData: indikator.sumberData,
                })
            }
            );
            setFormData(generatedFormData);
        }
    }, [requestValues, tahun, normalizedBulan, bulanLabel]);

    const convertToDisplayString = (value: number | null): string => {
        if (value === null || value === undefined) return '';
        return value.toString().replace('.', ',');
    };

    const handleChange = (rowKey: string, value: string) => {
        // Allow empty input (store as null) and accept comma decimals.
        const trimmed = value.trim();
        const normalizedValue = trimmed.replace(',', '.');

        let numericReal: number | null = null;
        if (trimmed !== '') {
            const parsed = parseFloat(normalizedValue);
            numericReal = Number.isNaN(parsed) ? null : parsed;
        }

        setFormData((prev) =>
            prev.map((item) =>
                String(item.targetRealisasiId ?? item.targetId) === rowKey
                    ? { ...item, realisasi: numericReal }
                    : item
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canEdit) {
            alert('Anda tidak memiliki akses untuk melakukan realisasi.');
            return;
        }

        if (!normalizedBulan) {
            alert('Bulan tidak valid. Silakan pilih bulan aktif terlebih dahulu.');
            return;
        }

        setProses(loading);

        const result = await submit(formData)

        if (result) {
            onClose();
            onSuccess?.(result)
        } else {
            alert("Terjadi kesalahan")
            console.error("Submission failed:", error);
        }
        setProses(loading);
    };

    const selectedForm = formData[0] ?? null;
    const indikator = selectedForm?.indikator ?? requestValues?.[0]?.indikator ?? '';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            <div className="mb-4">
                <h3 className="font-bold">Indikator: {indikator}</h3>
                <div className="mt-2 text-sm">
                    {selectedForm && (() => {
                        const rowKey = String(selectedForm.targetRealisasiId ?? selectedForm.targetId);
                        return (
                        <div key={rowKey} className="border p-3 rounded bg-gray-50 shadow-sm flex flex-col">
                            <div className="text-center text-xs font-semibold bg-red-500 text-white rounded py-0.5 mb-1">
                                {tahun} - {bulanLabel}
                            </div>
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">
                                Target:
                            </p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">{selectedForm.target ?? ''}</p>
                            <label className="uppercase text-xs font-bold text-gray-700 mb-2" htmlFor="realisasi" >
                                Realisasi:
                            </label>
                            <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm mb-1"
                                name={`realisasi[${selectedForm.targetRealisasiId}][${selectedForm.tahun}]`}
                                value={convertToDisplayString(selectedForm.realisasi ?? null)}
                                onChange={(e) => handleChange(rowKey, e.target.value)}
                            />
                            <p className="uppercase text-xs font-bold text-gray-700 mb-2">
                                Satuan:
                            </p>
                            <p className="w-full bg-gray-300 border rounded px-2 py-1 text-sm mb-1">{selectedForm.satuan ?? ''}</p>
                        </div>
                    )})()}
                </div>
            </div>
            <ButtonSky className="w-full mt-3" type="submit">
                {Proses ? (
                    <span className="flex items-center justify-center gap-2">
                        <LoadingButtonClip />
                        Menyimpan...
                    </span>
                ) : (
                    'Simpan'
                )}
            </ButtonSky>
        </form>
    );
};

export default FormRealisasiTujuanOpd;
