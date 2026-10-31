import React from 'react';
import RenjaSectionTable from '../_components/RenjaSectionTable';

export default function TableLaporanRenjaProgram({ laporanType }: { laporanType?: string }) {
    return (
        <RenjaSectionTable
            laporanType={laporanType}
            jenis="program"
            groupField="program"
            groupLabel="Program"
        />
    );
}
