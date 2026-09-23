'use client';

import React from 'react';

export function StorageGlossary() {
  return (
    <div className="mb-1.5 rounded-md border border-blue-100 bg-blue-50/60 px-2 py-1.5 text-[10px] leading-relaxed text-blue-900">
      <div className="mb-1 font-semibold">Istilah singkat</div>
      <dl className="space-y-1">
        <div>
          <dt className="inline font-semibold">D1: </dt>
          <dd className="inline">
            jumlah URL yang tercatat di database (apa yang admin pilih: cover, gallery,
            before/after, wallpaper).
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">R2: </dt>
          <dd className="inline">
            jumlah file fisik di bucket. Bisa lebih banyak dari D1 karena ada file pendamping
            (preview clip + poster) yang dibuat otomatis untuk tiap video.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Side-car: </dt>
          <dd className="inline">
            file pendamping yang dibuat otomatis:{' '}
            <code className="rounded bg-white/70 px-1">{'<nama>'}-preview.mp4</code> +{' '}
            <code className="rounded bg-white/70 px-1">{'<nama>'}.jpg</code>. Tidak dicatat di D1,
            tapi dipakai UI lewat naming convention.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Orphan: </dt>
          <dd className="inline">
            file di R2 yang tidak ada referensinya di D1. Biasanya sisa upload gagal atau project
            lama yang sudah dihapus tapi asset-nya ketinggalan.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Dangling: </dt>
          <dd className="inline">
            URL di D1 yang file-nya sudah tidak ada di R2. Biasanya akibat file dihapus manual dari
            bucket.
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Sync: </dt>
          <dd className="inline">
            tidak ada orphan dan tidak ada dangling. Jumlah D1 vs R2 boleh beda asal selisihnya bisa
            dijelaskan oleh side-car.
          </dd>
        </div>
      </dl>
    </div>
  );
}
