# Admin Mode & Layout Persistence Fix

## Ringkasan Perubahan

Sistem telah diubah untuk mendukung **Admin Template Mode** yang memungkinkan admin mengatur layout (posisi dan ukuran windows, icons, dan notes) yang akan menjadi template default untuk semua visitor.

## Cara Kerja

### Admin Flow
1. **Login sebagai Admin** → Homepage berubah ke mode admin
2. **Drag/Resize Windows, Icons, Notes** → Perubahan tersimpan di localStorage + auto-sync ke server
3. **Klik "Exit Admin"** → Semua posisi terakhir di-flush ke server sebagai template
4. **Logout** → Session visitor di-clear, admin melihat template yang baru di-save

### Visitor Flow
1. **Buka Website** → Load template dari server (posisi admin)
2. **Bisa Drag/Resize selama session** → Perubahan tersimpan di sessionStorage (temporary)
3. **Refresh Halaman** → Kembali ke template admin (sessionStorage di-clear)

## Detail Teknis

### File yang Diubah

1. **positionSync.ts**
   - Menambahkan `sessionStorage` untuk visitor (session-only)
   - `localStorage` hanya untuk admin
   - Fungsi `saveWindowPosition()`, `saveIconPosition()` sekarang menerima parameter `isAdmin`

2. **useWindowManager.ts**
   - Update `updateWindowPosition()` dan `handleWindowResizeEnd()` untuk passing `isAdmin`

3. **useDesktopLayout.ts**
   - Update loading logic: visitor load dari sessionStorage > Firebase
   - Update `handleIconPositionChange()` untuk passing `isAdmin`

4. **DesktopEnvironment.tsx**
   - Tambah `clearVisitorPositions()` saat logout

5. **windowFactory.tsx**
   - Sudah mendukung `isAdmin` parameter

## Storage Strategy

| User | Storage | Persistence |
|------|---------|-------------|
| Admin | localStorage → Server | Permanent |
| Visitor | sessionStorage | Session only (clear on refresh) |

## Testing Checklist

- [ ] Admin login → bisa drag/resize → exit admin → layout tersimpan
- [ ] Visitor buka website → lihat layout admin
- [ ] Visitor drag window/icon → bisa bergerak
- [ ] Visitor refresh → kembali ke posisi admin
- [ ] Admin ubah layout lagi → visitor refresh → lihat layout baru

## Catatan Penting

- **Sticky Notes**: Sudah auto-save ke server hanya untuk admin. Visitor tetap bisa drag tapi tidak persist.
- **Icons**: Visitor bisa drag selama session, reset ke admin position saat refresh.
- **Windows**: Sama seperti icons, visitor bisa drag/resize tapi reset saat refresh.
