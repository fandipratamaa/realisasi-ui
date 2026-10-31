import React from 'react';
import RenjaSectionTable from '../_components/RenjaSectionTable';

export default function TableLaporanRenjaKegiatan({ laporanType }: { laporanType?: string }) {
    return (
        <RenjaSectionTable
            laporanType={laporanType}
            jenis="kegiatan"
            groupField="kegiatan"
            groupLabel="Kegiatan"
        />
    );
}
