import {
  InfoOpd,
  TujuanOpdRealisasiResponse,
  TujuanOpdTargetRealisasiCapaian,
  TujuanOpdPerencanaan,
} from "@/types";

export function gabunganDataPerencanaanRealisasi(
  perencanaan: TujuanOpdPerencanaan[],
  realisasi: TujuanOpdRealisasiResponse,
  kodeOpd: string,
): TujuanOpdTargetRealisasiCapaian[] {
  const hasil: TujuanOpdTargetRealisasiCapaian[] = [];

  // Safety check
  if (perencanaan.length === 0) {
    return hasil;
  }

  // --- OPTIMASI ---
  // Buat map untuk lookup realisasi O(1)
  const realisasiMap = new Map<string, (typeof realisasi)[number]>();

  realisasi.forEach((r) => {
    const key = `${r.tahun}-${r.tujuanId}-${r.indikatorId}-${r.targetId}`;
    realisasiMap.set(key, r);
  });

  // --- PROSES GABUNGAN ---
  perencanaan.forEach((tujuan) => {
    tujuan.indikator?.forEach((indikator) => {
      indikator.target?.forEach((target) => {
        const key = `${target.tahun}-${tujuan.id_tujuan_opd}-${indikator.id}-${target.id}`;
        const real = realisasiMap.get(key);

        hasil.push({
          targetRealisasiId: real?.id ?? null,
          tujuanOpd: tujuan.tujuan,
          tujuanId: tujuan.id_tujuan_opd,
          indikatorId: indikator.id.toString(),
          indikator: indikator.indikator,
          targetId: target.id,
          target: target.target,
          realisasi: real?.realisasi ?? 0,
          capaian: real?.capaian ?? "-",
          keteranganCapaian: real?.keteranganCapaian ?? "-",
          satuan: target.satuan,
          tahun: target.tahun,
          kodeOpd: kodeOpd,
          rumusPerhitungan: indikator.rumus_perhitungan ?? "-",
          sumberData: indikator.sumber_data ?? "-",
        });
      });
    });
  });

  return hasil;
}
