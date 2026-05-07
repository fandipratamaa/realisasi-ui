import {
    SasaranOpdPerencanaan, SasaranOpdRealisasiResponse, SasaranOpdTargetRealisasiCapaian
} from '@/types';

export function gabunganDataPerencanaanRealisasi(perencanaan: SasaranOpdPerencanaan[], realismoasi: SasaranOpdRealisasiResponse, kodeOpd: string): SasaranOpdTargetRealisasiCapaian[] {
    const hasil: SasaranOpdTargetRealisasiCapaian[] = [];
    perencanaan.forEach(sasaran => {
        sasaran.indikator.forEach(indikator => {
            indikator.target?.forEach(target => {
                const realizationEntry = realismoasi.find(r =>
                    r.tahun === target.tahun &&
                    r.renjaId === sasaran.id.toString() &&
                    r.indikatorId === indikator.id &&
                    r.targetId === target.id
                );

                if (realizationEntry) {
                    hasil.push({
                        targetRealisasiId: realizationEntry.id,
                        renja: sasaran.nama_sasaran_opd,
                        renjaId: sasaran.id.toString(),
                        indikatorId: indikator.id.toString(),
                        indikator: indikator.indikator,
                        targetId: target.id,
                        target: target.target,
                        realisasi: realizationEntry.realisasi,
                        capaian: realizationEntry.capaian,
                        keteranganCapaian: realizationEntry.keteranganCapaian ?? "-",
                        satuan: target.satuan,
                        tahun: target.tahun,
                        kodeOpd: kodeOpd,
                        rumusPerhitungan: indikator.rumus_perhitungan ?? "-",
                        sumberData: indikator.sumber_data ?? "-",
                    });
                } else {
                    hasil.push({
                        targetRealisasiId: null,
                        renja: sasaran.nama_sasaran_opd,
                        renjaId: sasaran.id.toString(),
                        indikatorId: indikator.id.toString(),
                        indikator: indikator.indikator,
                        targetId: target.id,
                        target: target.target,
                        realisasi: 0,
                        capaian: "-",
                        keteranganCapaian: "-",
                        satuan: target.satuan,
                        tahun: target.tahun,
                        kodeOpd: kodeOpd,
                        rumusPerhitungan: indikator.rumus_perhitungan ?? "-",
                        sumberData: indikator.sumber_data ?? "-",
                    });
                }
            });
        });
    });

    return hasil;
}
