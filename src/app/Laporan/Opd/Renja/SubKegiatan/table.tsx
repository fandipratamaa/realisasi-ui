import React from 'react';
import RenjaSectionTable from '../_components/RenjaSectionTable';

export default function TableLaporanRenjaSubKegiatan({ laporanType }: { laporanType?: string }) {
    return (
        <RenjaSectionTable
            laporanType={laporanType}
            jenis="subkegiatan"
            groupField="sub_kegiatan"
            groupLabel="SubKegiatan"
        />
    );
}
