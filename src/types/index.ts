export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  nip?: string;
  kode_opd?: string;
};

export interface Tematik {
  tematik_id: number;
  nama_tematik: string;
  subtematik: SubTematik[];
}

export interface SubTematik {
  subtematik_id: number;
  nama_subtematk: string;
  jenis_pohon: string;
  level_pohon: number;
  is_active: true;
  sasaran_pemda: SasaranPemda[];
}

export interface Indikator {
  id: string;
  indikator: string;
  rumus_perhitungan: string;
  sumber_data: string;
  target: Target[];
}

export interface Target {
  id: string;
  tahun: string;
  target: string;
  satuan: string;
}

export interface Periode {
  tahun_awal: string;
  tahun_akhir: string;
  jenis_periode: string;
}

export interface TujuanPemda {
  id: number;
  id_misi: number;
  misi: string;
  tujuan_pemda: string;
  periode: Periode;
  indikator: Indikator[];
}

export interface PerencanaanTujuanPemda {
  pokin_id: number;
  nama_tematik: string;
  jenis_pohon: string;
  level_pohon: number;
  is_active: boolean;
  keterangan: string;
  tahun_pokin: string;
  tujuan_pemda: TujuanPemda[];
}

export interface PerencanaanTujuanPemdaResponse {
  code: number;
  status: string;
  data: PerencanaanTujuanPemda[];
}

export interface RealisasiTujuan {
  id: number;
  tujuanId: string;
  tujuan: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status: "UNCHECKED" | "CHECKED";
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  capaian: string;
  keteranganCapaian?: string | null;
}

export type RealisasiTujuanResponse = RealisasiTujuan[];

export interface TargetRealisasiCapaian {
  targetRealisasiId: number | null;
  tujuanPemda: string;
  tujuanId: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  capaian: string;
  keteranganCapaian: string;
  satuan: string;
  tahun: string;
}

export interface TujuanRequest {
  targetRealisasiId: number | null;
  tujuanId: string;
  indikatorId: string;
  targetId: string;
  target: string;
  realisasi: number | '';
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
}

export interface SasaranRequest {
  targetRealisasiId: number | null;
  sasaranId: string;
  indikatorId: string;
  targetId: string;
  target: string;
  realisasi: number | '';
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
}

export interface SasaranRequest {
  targetRealisasiId: number | null;
  sasaranId: string;
  indikatorId: string;
  targetId: string;
  target: string;
  realisasi: number | '';
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
}

export interface Modal<T> {
  item: T | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface FormProps<T, L> {
  requestValues: T | null;
  onClose: () => void;
  onSuccess?: (updatedValue: L) => void;
}

export type FetchResponse<T> = {
  data?: T;
  loading: boolean;
  error?: string;
};

export type SubmitResponse<T> = {
  submit: (payload: any) => Promise<T | undefined>;
  loading: boolean;
  error?: string;
  data?: T;
};

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export type RealisasiSasaranResponse = RealisasiSasaran[];

export interface RealisasiSasaran {
  id: number;
  sasaranId: string;
  sasaran: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status: "UNCHECKED" | "CHECKED";
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  capaian: string;
  keteranganCapaian?: string | null;
}

export interface RenaksiIndividuResponse {
  id: number;
  renaksiId: string;
  renaksi: string;
  nip: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status: "UNCHECKED" | "CHECKED";
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  keteranganCapaian: string | null;
  capaian: string;
}

export interface RenaksiTarget {
  targetRealisasiId: number | null;
  renaksiId: string;
  renaksi: string;
  nip: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan?: string | null;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  capaian?: string;
  keteranganCapaian?: string | null;
  rencanaKinerja?: string;
}

export interface RenaksiBatchRequest {
  targetRealisasiId: number | null;
  renaksiId: string;
  renaksi: string;
  nip: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
}

export interface RenaksiTriwulanCell {
  target: number | string;
  realisasi: number;
  satuan: string;
  capaian: string;
  keteranganCapaian: string | null;
}

export interface RenaksiOpdTriwulanResponse {
  renaksiId: string;
  renaksi: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  tw1: RenaksiTriwulanCell;
  tw2: RenaksiTriwulanCell;
  tw3: RenaksiTriwulanCell;
  tw4: RenaksiTriwulanCell;
}

export interface RenaksiOpdBatchMonthlyRequest {
  renaksiId: string;
  renaksi: string;
  kodeOpd: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
}

export interface RenaksiOpdMonthlyResponse {
  id: number;
  renaksiId: string;
  renaksi: string;
  rekinId: string;
  rekin: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
  version?: number | null;
  capaian?: string | null;
  keteranganCapaian?: string | null;
}

export interface RekinIndividuResponse {
  id: number;
  rekinId: string;
  rekin: string;
  indikatorId: string;
  indikator: string;
  nip: string;
  idSasaran?: string | null;
  sasaran?: string | null;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status?: string | null;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
  version?: number | null;
  capaian?: string | null;
  keteranganCapaian?: string | null;
}

export interface RekinTarget {
  targetRealisasiId: number | null;
  rekinId: string;
  rekin: string;
  nip: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: "NAIK" | "TURUN";
  capaian?: string | null;
  keteranganCapaian?: string | null;
  idSasaran?: string | null;
  sasaran?: string | null;
}

export interface RekinBatchRequest {
  targetRealisasiId: number | null;
  rekinId: string;
  rekin: string;
  nip: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: "NAIK" | "TURUN";
  idSasaran?: string | null;
  sasaran?: string | null;
}

export interface RekinTarget {
  targetRealisasiId: number | null;
  rekinId: string;
  rekin: string;
  nip: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  bulan?: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  capaian?: string | null;
  idSasaran?: string | null;
  sasaran?: string | null;
}

export interface PerencanaanSasaranPemdaResponse {
  code: number;
  status: string;
  data: TematikSasaranPemda[];
}

export interface TematikSasaranPemda {
  tematik_id: number;
  nama_tematik: string;
  subtematik: SubTematikSasaranPemda[];
}

export interface SubTematikSasaranPemda {
  subtematik_id: number;
  nama_subtematik: string;
  jenis_pohon: string;
  level_pohon: number;
  is_active: boolean;
  sasaran_pemda: SasaranPemda[];
}

export interface SasaranPemda {
  id_sasaran_pemda: number;
  sasaran_pemda: string;
  periode: Periode;
  indikator: Indikator[];
}

export interface IkuPemdaTargetRealisasiCapaian {
  targetRealisasiId: string | null;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  capaian: string;
  satuan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN" | null;
  jenisIku: "TUJUAN" | "SASARAN" | null;
}

export interface IkuPemdaRealisasi {
  id: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  tahun: string;
  realisasi: number;
  satuan: string;
  capaian: string;
  jenisRealisasi: "NAIK" | "TURUN" | null;
  jenisIku: "TUJUAN" | "SASARAN" | null;
}

export type IkuPemdaRealisasiResponse = IkuPemdaRealisasi[];

export interface IkuPemda {
  indikator_id: string;
  asal_iku: string;
  indikator: string;
  is_active: boolean;
  rumus_perhitungan: string;
  sumber_data: string;
  target: Target[];
}

export interface IkuPemdaPerencanaanResponse {
  code: number;
  status: string;
  data: IkuPemda[];
}

export interface TargetRealisasiCapaianSasaran {
  targetRealisasiId: number | null;
  sasaranPemda: string;
  sasaranId: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  capaian: string;
  keteranganCapaian: string;
  satuan: string;
  tahun: string;
}

export interface TujuanOpdPerencanaan {
  id_tujuan_opd: string;
  tujuan: string;
  tahun_awal: string;
  tahun_akhir: string;
  jenis_periode: string;
  indikator: IndikatorTujuanOpd[];
}

export interface IndikatorTujuanOpd {
  id: string;
  id_tujuan_opd: number;
  indikator: string;
  rumus_perhitungan: string;
  sumber_data: string;
  target: TargetIndikatorTujuanOpd[];
}

export interface TargetIndikatorTujuanOpd {
  id: string;
  indikator_id: string;
  tahun: string;
  target: string;
  satuan: string;
}

export interface InfoOpd {
  kode_urusan: string;
  urusan: string;
  kode_bidang_urusan: string;
  nama_bidang_urusan: string;
  kode_opd: string;
  nama_opd: string;
  tujuan_opd: TujuanOpdPerencanaan[];
}

export interface TujuanOpdPerencanaanResponse {
  code: number;
  status: string;
  data: InfoOpd[];
}

export interface TujuanOpdTargetRealisasiCapaian {
  targetRealisasiId: number | null;
  tujuanOpd: string;
  tujuanId: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  capaian: string;
  keteranganCapaian: string;
  satuan: string;
  tahun: string;
  kodeOpd: string;
  rumusPerhitungan: string;
  sumberData: string;
}

export interface TujuanOpdRealisasi {
  id: number;
  tujuanId: string;
  tujuan: string;
  indikatorId: string;
  indikator: string;
  bulan: string;
  rumusPerhitungan?: string | null;
  sumberData?: string | null;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  kodeOpd: string;
  status: "UNCHECKED" | "CHECKED";
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  capaian: string;
  keteranganCapaian?: string | null;
}

export type TujuanOpdRealisasiResponse = TujuanOpdRealisasi[];

export interface TujuanOpdRealisasiGroupedIndikator {
  id: string;
  indikator: string;
  rumusPerhitungan: string;
  sumberData: string;
  targets: TujuanOpdTargetRealisasiCapaian[];
}

export interface TujuanOpdRealisasiGrouped {
  tujuanId: string;
  tujuanOpd: string;
  indikator: TujuanOpdRealisasiGroupedIndikator[];
}

export interface TujuanOpdRealisasiRequest {
  targetRealisasiId: number | null;
  tujuanId: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number | null;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
  kodeOpd: string;
  rumusPerhitungan: string;
  sumberData: string;
}

export interface SasaranOpdPerencanaanResponse {
  code: number;
  status: string;
  data: PohonSasaranOpd[];
}

interface PohonSasaranOpd {
  id_pohon: number;
  nama_pohon: string;
  jenis_pohon: string;
  tahun_pohon: string;
  level_pohon: number;
  sasaran_opd: SasaranOpdPerencanaan[];
}

export interface SasaranOpdPerencanaan {
  id: number;
  nama_sasaran_opd: string;
  id_tujuan_opd: number;
  nama_tujuan_opd: string;
  tahun_awal: string;
  tahun_akhir: string;
  jenis_periode: string;
  indikator: Indikator[];
}

export interface SasaranOpdRealisasi {
  id: number;
  renjaId: string;
  renja: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: "NAIK" | "TURUN";
  kodeOpd: string;
  rumusPerhitungan?: string | null;
  sumberData?: string | null;
  status: "UNCHECKED" | "CHECKED";
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  capaian: string;
  keteranganCapaian?: string | null;
}

export type SasaranOpdRealisasiResponse = SasaranOpdRealisasi[];

export interface SasaranOpdTargetRealisasiCapaian {
  targetRealisasiId: number | null;
  renja: string;
  renjaId: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  capaian: string;
  keteranganCapaian: string;
  satuan: string;
  tahun: string;
  kodeOpd: string;
  rumusPerhitungan: string;
  sumberData: string;
}

export interface SasaranOpdRealisasiGroupedIndikator {
  id: string;
  indikator: string;
  rumusPerhitungan: string;
  sumberData: string;
  targets: SasaranOpdTargetRealisasiCapaian[];
}

export interface SasaranOpdRealisasiGrouped {
  renjaId: string;
  renja: string;
  indikator: SasaranOpdRealisasiGroupedIndikator[];
}

export interface SasaranOpdRealisasiRequest {
  targetRealisasiId: number | null;
  renjaId: string;
  indikatorId: string;
  targetId: string;
  target: string;
  realisasi: number | null;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
  kodeOpd: string;
  rumusPerhitungan: string;
  sumberData: string;
}

export interface RenjaTargetIndividuResponse {
  id: number;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: "PROGRAM" | "KEGIATAN" | "SUB_KEGIATAN";
  nip: string;
  idIndikator: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status: "CHECKED" | "UNCHECKED";
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  capaian: string;
  keteranganCapaian: string;
}

export type RenjaTargetIndividuResponseList = RenjaTargetIndividuResponse[];

export interface RenjaTarget {
  targetRealisasiId: number | null;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: string;
  nip: string;
  idIndikator: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: "NAIK" | "TURUN";
  capaian?: string;
  keteranganCapaian?: string;
  pagu?: number | null;
  realisasiPagu?: number | null;
  satuanPagu?: string;
  capaianPagu?: string;
  keteranganCapaianPagu?: string;
}

export interface RenjaBatchRequest {
  targetRealisasiId: number | null;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: string;
  nip: string;
  idIndikator: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: string;
}

export interface RenjaPaguIndividuResponse {
  id: number;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: "PROGRAM" | "KEGIATAN" | "SUB_KEGIATAN";
  nip: string;
  idIndikator: string;
  indikator: string;
  pagu: number;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: "NAIK" | "TURUN";
  status: "CHECKED" | "UNCHECKED";
  createdBy: string;
  lastModifiedBy: string;
  createdDate: string;
  lastModifiedDate: string;
  version: number;
  capaian: string;
  keteranganCapaian: string;
}

export type RenjaPaguIndividuResponseList = RenjaPaguIndividuResponse[];

export interface RenjaPaguTarget {
  targetRealisasiId: number | null;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: string;
  nip: string;
  idIndikator: string;
  indikator: string;
  pagu: number;
  targetId: string;
  realisasi: number;
  satuan: string;
  tahun: string;
  jenisRealisasi: "NAIK" | "TURUN";
  capaian?: string;
  keteranganCapaian?: string;
}

export interface RenjaPaguBatchRequest {
  targetRealisasiId: number | null;
  renjaId: string;
  renja: string;
  kodeRenja: string;
  jenisRenja: string;
  nip: string;
  idIndikator: string;
  indikator: string;
  pagu: number;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan?: string;
  jenisRealisasi: string;
}

export interface RenjaTargetOpdResponse {
  id: number | null;
  jenisRenjaId: string;
  jenisRenjaTarget: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number | null;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: "NAIK" | "TURUN";
  kodeOpd: string;
  kodeRenja: string;
  status: string;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  version: number;
  capaian: string;
  keteranganCapaian: string;
}

export interface RenjaTargetOpdRequest {
  targetRealisasiId: number | null;
  jenisRenjaId: string;
  jenisRenja: string;
  indikatorId: string;
  indikator: string;
  targetId: string;
  target: string;
  realisasi: number | null;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
  kodeOpd: string;
  kodeRenja: string;
}

export interface RenjaPaguOpdResponse {
  id: number | null;
  jenisRenjaId: string;
  jenisRenjaPagu: "PROGRAM" | "KEGIATAN" | "SUB_KEGIATAN";
  pagu: number;
  realisasi: number | null;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: "NAIK" | "TURUN";
  kodeOpd: string;
  kodeRenja: string;
  status: "CHECKED" | "UNCHECKED";
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  version: number;
  capaian: string;
  keteranganCapaian: string;
}

export interface RenjaPaguOpdBatchRequest {
  targetRealisasiId: number | null;
  jenisRenjaId: string;
  jenisRenja: string;
  pagu: number;
  realisasi: number;
  satuan: string;
  tahun: string;
  bulan: string;
  jenisRealisasi: string;
  kodeOpd: string;
  kodeRenja: string;
}
