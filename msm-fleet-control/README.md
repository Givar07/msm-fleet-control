# MSM Fleet Control v1.0 — Tahap 1
## Menjalankan
npm install && npm run dev  → http://localhost:3000
## Deploy ke Vercel
Push ke GitHub → vercel.com/new → import repo → Deploy (preset Next.js, tanpa env var).
## Struktur
src/lib: types, seed (data simulasi), logic (validasi jadwal/benturan), store (state + LocalStorage)
src/components/Shell.tsx: sidebar, pilihan role simulasi, filter area, reset demo
src/app: dashboard (/), request truk (/request)
## Tahap berikutnya
2) Admin Request (approve/sebagian/tolak, assign unit+driver) 3) Monitoring HT/DT 4) Absensi 5) Scheduling 6) Master data 7) Laporan CSV 8) shadcn/ui + Supabase
