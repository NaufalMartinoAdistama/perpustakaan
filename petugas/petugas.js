/**
 * SIMPEL-LAB - Petugas Controller
 * Dedicated logic for Petugas Lab Role
 */

const petugasState = {
  currentView: 'dashboard',
  searchQueries: {},
  filterCategories: {},
  laporanTahun: 'Semua',
  laporanPresetWaktu: 'semua',
  laporanStartDate: '',
  laporanEndDate: '',
  laporanKategori: 'Semua',
  laporanStatus: 'Semua',
  laporanTipe: 'transaksi'
};

document.addEventListener('DOMContentLoaded', () => {
  if (!window.authService.requireRole('petugas', '../login.html')) return;

  setupPetugasEventListeners();
  handlePetugasRouting();
  updatePetugasNotificationBadge();
});

function setupPetugasEventListeners() {
  const openSidebarBtn = document.getElementById('open-sidebar-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('sidebar');

  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      sidebarBackdrop.classList.remove('hidden');
    });
  }

  const hideSidebar = () => {
    sidebar.classList.add('-translate-x-full');
    sidebarBackdrop.classList.add('hidden');
  };

  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', hideSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', hideSidebar);

  // Notifications
  const btnNotif = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notifications-dropdown');
  if (btnNotif && notifDropdown) {
    btnNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      renderPetugasNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== btnNotif) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  
  // Auto-close sidebar on mobile when a nav item is clicked
  document.querySelectorAll('.petugas-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        const sbb = document.getElementById('sidebar-backdrop');
        if (sb) sb.classList.add('-translate-x-full');
        if (sbb) sbb.classList.add('hidden');
      }
    });
  });
  
  window.addEventListener('hashchange', handlePetugasRouting);
  setupPetugasForms();
}

function handlePetugasRouting() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  petugasState.currentView = hash;

  document.querySelectorAll('.petugas-nav-link').forEach(link => {
    const linkHash = link.getAttribute('href').replace('#', '');
    if (linkHash === hash) {
      link.className = 'petugas-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25';
    } else {
      link.className = 'petugas-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium group';
    }
  });

  const titleEl = document.getElementById('page-title');
  const subTitleEl = document.getElementById('page-subtitle');

  const titles = {
    dashboard: ['Dashboard Petugas Lab', 'Manajemen operasional harian peminjaman & pengembalian'],
    peminjaman: ['Entri & Validasi Peminjaman', 'Form peminjaman langsung di meja lab dan persetujuan siswa'],
    pengembalian: ['Verifikasi Pengembalian', 'Pengecekan fisik perangkat kembali dan pencatatan denda'],
    barang: ['Data Barang Lab', 'Pemantauan ketersediaan dan status fisik barang lab'],
    siswa: ['Data Siswa Terdaftar', 'Daftar data siswa peminjam laboratorium komputer'],
    laporan: ['Laporan & Ekspor Rekapitulasi', 'Unduh laporan resmi ke format Excel (.xlsx), PDF (.pdf), atau Cetak Berkop']
  };

  if (titles[hash]) {
    titleEl.textContent = titles[hash][0];
    subTitleEl.textContent = titles[hash][1];
  }

  renderPetugasView();
}

function renderPetugasView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const view = petugasState.currentView;
  if (view === 'dashboard') renderPetugasDashboard(container);
  else if (view === 'peminjaman') renderPetugasPeminjamanView(container);
  else if (view === 'pengembalian') renderPetugasPengembalianView(container);
  else if (view === 'barang') renderPetugasBarangView(container);
  else if (view === 'siswa') renderPetugasSiswaView(container);
  else if (view === 'laporan') renderPetugasLaporanView(container);
  else renderPetugasDashboard(container);

  lucide.createIcons();
}

function renderPetugasDashboard(container) {
  const stats = window.labDB.getDashboardStats();
  const activeLoans = window.labDB.getTransactions().filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Welcome Card -->
      <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span class="px-2.5 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-sm">Shift Kerja: Pagi (07.00 - 15.00)</span>
          <h2 class="text-xl font-black mt-2">Selamat Bertugas, Dian Safitri, A.Md</h2>
          <p class="text-emerald-100 text-xs mt-1 max-w-xl">Catat setiap peminjaman barang dan pastikan pemeriksaan fisik kelengkapan dilakukan dengan cermat.</p>
        </div>
        <button onclick="openPinjamModal()" class="px-4 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 shrink-0">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>Entri Peminjaman Baru</span>
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Permintaan Menunggu Validasi</span>
            <div class="text-2xl font-bold text-amber-600">${stats.pendingRequests} <span class="text-xs font-normal text-slate-400">Pengajuan</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Barang Berada di Tangan Siswa</span>
            <div class="text-2xl font-bold text-brand-600">${stats.activeLoans} <span class="text-xs font-normal text-slate-400">Peminjaman</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <i data-lucide="package-search" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Keterlambatan / Denda Aktif</span>
            <div class="text-2xl font-bold text-rose-600">${stats.overdueLoans} <span class="text-xs font-normal text-slate-400">Kasus</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Active Table -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Daftar Peminjaman Aktif & Jatuh Tempo</h3>
            <p class="text-xs text-slate-400">Peralatan lab yang sedang dipinjam siswa saat ini</p>
          </div>
          <a href="#pengembalian" class="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Buka Menu Pengembalian &rarr;</a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100">
                <th class="pb-2 font-medium">Siswa</th>
                <th class="pb-2 font-medium">Barang & Jml</th>
                <th class="pb-2 font-medium">Tenggat Waktu</th>
                <th class="pb-2 font-medium">Status & Denda</th>
                <th class="pb-2 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${activeLoans.length === 0 ? `
                <tr><td colspan="5" class="py-6 text-center text-slate-400">Tidak ada peminjaman aktif. Semua inventaris ada di lab.</td></tr>
              ` : activeLoans.map(tx => {
                const isOverdue = tx.status === 'Terlambat';
                return `
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3">
                      <div class="font-bold text-slate-800">${tx.studentName}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${tx.studentNis} &bull; ${tx.studentClass}</div>
                    </td>
                    <td class="py-3">
                      <div class="font-semibold text-brand-700">${tx.itemName}</div>
                      <div class="text-[10px] text-slate-400">${tx.qty} Unit (${tx.itemCode})</div>
                    </td>
                    <td class="py-3">
                      <div class="font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}">${formatDate(tx.dueDate)}</div>
                      <div class="text-[10px] text-slate-400">Pinjam: ${formatDate(tx.borrowDate)}</div>
                    </td>
                    <td class="py-3">
                      ${isOverdue ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Terlambat (Denda: Rp ${formatRupiah(tx.fineAmount)})</span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Dipinjam</span>
                      `}
                    </td>
                    <td class="py-3 text-right">
                      <button onclick="openReturnModal('${tx.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 ml-auto">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                        <span>Proses Kembali</span>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function renderPetugasPeminjamanView(container) {
  const transactions = window.labDB.getTransactions();
  const pendingTxs = transactions.filter(t => t.status === 'Menunggu Konfirmasi');
  const activeTxs = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Entri & Validasi Peminjaman</h3>
          <p class="text-xs text-slate-400">Persetujuan permohonan siswa & pencatatan langsung di meja lab</p>
        </div>

        <button onclick="openPinjamModal()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Entri Peminjaman Meja Lab</span>
        </button>
      </div>

      <!-- Pending Section -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Pengajuan Siswa Menunggu Konfirmasi (${pendingTxs.length})
        </h4>

        ${pendingTxs.length === 0 ? `
          <div class="text-center py-6 text-slate-400 text-xs">Tidak ada permohonan pending.</div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th class="py-2 px-3">Siswa</th>
                  <th class="py-2 px-3">Barang</th>
                  <th class="py-2 px-3">Tenggat</th>
                  <th class="py-2 px-3">Keperluan</th>
                  <th class="py-2 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${pendingTxs.map(tx => `
                  <tr>
                    <td class="py-3 px-3"><strong>${tx.studentName}</strong> (${tx.studentClass})</td>
                    <td class="py-3 px-3 text-brand-700 font-semibold">${tx.itemName} (${tx.qty} Unit)</td>
                    <td class="py-3 px-3">${formatDate(tx.dueDate)}</td>
                    <td class="py-3 px-3 max-w-xs truncate">${tx.purpose}</td>
                    <td class="py-3 px-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="approveLoanPetugas('${tx.id}')" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">Setujui</button>
                        <button onclick="rejectLoanPetugas('${tx.id}')" class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">Tolak</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Active Section -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Peminjaman Berjalan (${activeTxs.length})
        </h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b text-slate-500">
              <tr>
                <th class="py-2.5 px-3">ID</th>
                <th class="py-2.5 px-3">Siswa</th>
                <th class="py-2.5 px-3">Barang</th>
                <th class="py-2.5 px-3">Tenggat</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${activeTxs.map(tx => `
                <tr>
                  <td class="py-3 px-3 font-mono font-bold">${tx.id}</td>
                  <td class="py-3 px-3"><strong>${tx.studentName}</strong> (${tx.studentClass})</td>
                  <td class="py-3 px-3 text-brand-700 font-semibold">${tx.itemName}</td>
                  <td class="py-3 px-3">${formatDate(tx.dueDate)}</td>
                  <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">${tx.status}</span></td>
                  <td class="py-3 px-3 text-right">
                    <button onclick="openReturnModal('${tx.id}')" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs">Kembalikan</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPetugasPengembalianView(container) {
  const transactions = window.labDB.getTransactions();
  const activeLoans = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">Verifikasi Pengembalian & Kondisi Barang</h3>
          <p class="text-xs text-slate-400">Pemeriksaan fisik barang, denda otomatis, dan restock</p>
        </div>
        <div class="text-xs text-slate-600">Tarif Denda: <strong class="text-rose-600">Rp 2.000 / Hari</strong></div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b">Barang yang Harus Dikembalikan (${activeLoans.length})</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b text-slate-500">
              <tr>
                <th class="py-2.5 px-3">No. Transaksi</th>
                <th class="py-2.5 px-3">Peminjam</th>
                <th class="py-2.5 px-3">Barang & Jml</th>
                <th class="py-2.5 px-3">Tenggat</th>
                <th class="py-2.5 px-3">Status / Keterlambatan</th>
                <th class="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${activeLoans.length === 0 ? `
                <tr><td colspan="6" class="py-6 text-center text-slate-400">Tidak ada peminjaman aktif.</td></tr>
              ` : activeLoans.map(tx => {
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = tx.dueDate < today || tx.status === 'Terlambat';
                return `
                  <tr>
                    <td class="py-3 px-3 font-mono font-bold">${tx.id}</td>
                    <td class="py-3 px-3"><strong>${tx.studentName}</strong> (${tx.studentClass})</td>
                    <td class="py-3 px-3 text-brand-700 font-semibold">${tx.itemName} (${tx.qty} Unit)</td>
                    <td class="py-3 px-3 ${isOverdue ? 'text-rose-600 font-bold' : ''}">${formatDate(tx.dueDate)}</td>
                    <td class="py-3 px-3">
                      ${isOverdue ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Terlambat</span>` : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Tepat Waktu</span>`}
                    </td>
                    <td class="py-3 px-3 text-right">
                      <button onclick="openReturnModal('${tx.id}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs">Verifikasi Kembali</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPetugasBarangView(container) {
  const items = window.labDB.getItems();
  const searchQuery = petugasState.searchQueries.barang || '';

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
        <input 
          type="text" 
          value="${searchQuery}" 
          placeholder="Cari barang atau kode..." 
          class="px-3 py-2 text-xs border border-slate-200 rounded-xl w-72"
          oninput="petugasState.searchQueries.barang = this.value; renderPetugasBarangView(document.getElementById('main-content')); lucide.createIcons();"
        >
        <span class="text-xs text-slate-500">Klik "Update Stok" untuk mengubah jumlah fisik</span>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b text-slate-500">
              <tr>
                <th class="py-3 px-4">Barang</th>
                <th class="py-3 px-4">Kategori</th>
                <th class="py-3 px-4">Stok Tersedia</th>
                <th class="py-3 px-4">Kondisi</th>
                <th class="py-3 px-4">Lokasi</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.map(i => `
                <tr>
                  <td class="py-3 px-4"><strong>${i.name}</strong> <span class="text-slate-400 font-mono text-[10px]">(${i.code})</span></td>
                  <td class="py-3 px-4"><span class="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">${i.category}</span></td>
                  <td class="py-3 px-4 font-bold ${i.availableStock <= 0 ? 'text-rose-600' : 'text-slate-800'}">${i.availableStock} / ${i.totalStock} Unit</td>
                  <td class="py-3 px-4">${i.condition}</td>
                  <td class="py-3 px-4 text-slate-500">${i.location || '-'}</td>
                  <td class="py-3 px-4 text-right">
                    <button onclick="quickUpdateStockPetugas('${i.id}')" class="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold text-[11px] rounded-lg hover:bg-emerald-100">Update Stok</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPetugasSiswaView(container) {
  const students = window.labDB.getStudents();
  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b text-xs font-bold text-slate-800">Direktori Siswa Terdaftar (${students.length} Siswa)</div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b text-slate-500">
            <tr>
              <th class="py-3 px-4">NIS</th>
              <th class="py-3 px-4">Nama Siswa</th>
              <th class="py-3 px-4">Kelas & Jurusan</th>
              <th class="py-3 px-4">No. HP</th>
              <th class="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${students.map(s => `
              <tr>
                <td class="py-3 px-4 font-mono font-bold">${s.nis}</td>
                <td class="py-3 px-4 font-semibold">${s.name}</td>
                <td class="py-3 px-4">${s.grade} - ${s.major}</td>
                <td class="py-3 px-4">${s.phone}</td>
                <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function quickUpdateStockPetugas(id) {
  const item = window.labDB.getItemById(id);
  if (!item) return;

  const newStock = prompt(`Update Stok Tersedia untuk "${item.name}" (Saat ini: ${item.availableStock} / Total: ${item.totalStock}):`, item.availableStock);
  if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
    const val = parseInt(newStock);
    window.labDB.updateItem(id, {
      availableStock: Math.min(item.totalStock, val),
      status: val > 0 ? 'Tersedia' : 'Habis'
    });
    showPetugasToast(`Stok ${item.name} diperbarui menjadi ${val} unit`, 'success');
    renderPetugasView();
  }
}

function approveLoanPetugas(txId) {
  const result = window.labDB.approveLoan(txId, 'Dian Safitri, A.Md');
  if (result.success) {
    showPetugasToast('Peminjaman berhasil disetujui', 'success');
    renderPetugasView();
    updatePetugasNotificationBadge();
  } else {
    showPetugasToast(result.message || 'Gagal menyetujui', 'error');
  }
}

function rejectLoanPetugas(txId) {
  const reason = prompt('Alasan penolakan:', 'Jadwal lab bentrok');
  if (reason) {
    window.labDB.rejectLoan(txId, reason);
    showPetugasToast('Pengajuan ditolak', 'info');
    renderPetugasView();
    updatePetugasNotificationBadge();
  }
}

function setupPetugasForms() {
  const formPinjam = document.getElementById('form-pinjam');
  if (formPinjam) {
    formPinjam.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = document.getElementById('pinjam-siswa-id').value;
      const itemId = document.getElementById('pinjam-barang-id').value;
      const qty = parseInt(document.getElementById('pinjam-qty').value);
      const borrowDate = document.getElementById('pinjam-tanggal').value;
      const dueDate = document.getElementById('pinjam-tenggat').value;
      const purpose = document.getElementById('pinjam-keperluan').value.trim();

      const student = window.labDB.getStudentById(studentId);
      const item = window.labDB.getItemById(itemId);

      if (item.availableStock < qty) {
        showPetugasToast(`Stok ${item.name} tidak cukup`, 'error');
        return;
      }

      window.labDB.createTransaction({
        studentId: student.id,
        studentNis: student.nis,
        studentName: student.name,
        studentClass: student.grade,
        studentPhone: student.phone,
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        itemCategory: item.category,
        qty: qty,
        borrowDate: borrowDate,
        dueDate: dueDate,
        returnDate: null,
        purpose: purpose,
        status: 'Dipinjam',
        returnCondition: '-',
        fineAmount: 0,
        officer: 'Dian Safitri, A.Md',
        notes: 'Peminjaman di meja lab oleh Petugas'
      });

      closeModal('modal-pinjam');
      showPetugasToast('Peminjaman berhasil dicatat!', 'success');
      renderPetugasView();
      updatePetugasNotificationBadge();
    });
  }

  const formKembali = document.getElementById('form-kembali');
  if (formKembali) {
    formKembali.addEventListener('submit', (e) => {
      e.preventDefault();
      const txId = document.getElementById('kembali-tx-id').value;
      const returnCondition = document.getElementById('kembali-kondisi').value;
      const fineAmount = parseFloat(document.getElementById('kembali-denda').value) || 0;
      const notes = document.getElementById('kembali-catatan').value.trim();

      window.labDB.processReturn(txId, {
        returnCondition,
        fineAmount,
        notes,
        officerName: 'Dian Safitri, A.Md'
      });

      closeModal('modal-kembali');
      showPetugasToast('Barang berhasil diverifikasi kembali!', 'success');
      renderPetugasView();
      updatePetugasNotificationBadge();
    });
  }
}

function openPinjamModal() {
  const items = window.labDB.getItems();
  const students = window.labDB.getStudents();
  document.getElementById('form-pinjam').reset();

  const todayStr = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 3);
  document.getElementById('pinjam-tanggal').value = todayStr;
  document.getElementById('pinjam-tenggat').value = future.toISOString().slice(0, 10);

  document.getElementById('pinjam-siswa-id').innerHTML = students.map(s => `<option value="${s.id}">${s.name} (${s.grade})</option>`).join('');
  document.getElementById('pinjam-barang-id').innerHTML = items.map(i => `<option value="${i.id}" ${i.availableStock <= 0 ? 'disabled' : ''}>${i.name} [Stok: ${i.availableStock}]</option>`).join('');

  openModal('modal-pinjam');
}

function openReturnModal(txId) {
  const tx = window.labDB.getTransactionById(txId);
  if (!tx) return;

  const elId = document.getElementById('kembali-info-id');
  if (elId) elId.textContent = tx.id;
  const elSiswa = document.getElementById('kembali-info-siswa');
  if (elSiswa) elSiswa.textContent = `${tx.studentName} (${tx.studentClass})`;
  const elBarang = document.getElementById('kembali-info-barang');
  if (elBarang) elBarang.textContent = `${tx.itemName} (${tx.qty} Unit)`;
  const elTglPinjam = document.getElementById('kembali-info-tgl-pinjam');
  if (elTglPinjam) elTglPinjam.textContent = formatDate(tx.borrowDate);
  const elTenggat = document.getElementById('kembali-info-tenggat');
  if (elTenggat) elTenggat.textContent = formatDate(tx.dueDate);

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = tx.dueDate < today || tx.status === 'Terlambat';
  const alertEl = document.getElementById('kembali-alert-keterlambatan');
  const dendaInput = document.getElementById('kembali-denda');

  if (isOverdue) {
    const diffTime = Math.abs(new Date(today) - new Date(tx.dueDate));
    const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fine = lateDays * 2000;
    alertEl.classList.remove('hidden');
    document.getElementById('kembali-text-terlambat').textContent = `Terlambat ${lateDays} hari. Denda: Rp ${formatRupiah(fine)}.`;
    dendaInput.value = fine;
  } else {
    alertEl.classList.add('hidden');
    dendaInput.value = 0;
  }

  openModal('modal-kembali');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    lucide.createIcons();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function showPetugasToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3 shadow-xl';
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0">
      <i data-lucide="${type === 'success' ? 'check-circle-2' : 'alert-circle'}" class="w-4 h-4"></i>
    </div>
    <div class="flex-1 text-xs">
      <div class="font-bold text-slate-800 capitalize">${type}</div>
      <div class="text-slate-600 mt-0.5">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.remove(), 3500);
}

function updatePetugasNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  const stats = window.labDB.getDashboardStats();
  const total = stats.pendingRequests + stats.overdueLoans;
  if (badge) {
    if (total > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
  }
}

function renderPetugasNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;
  const txs = window.labDB.getTransactions();
  const pending = txs.filter(t => t.status === 'Menunggu Konfirmasi');

  if (pending.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">Tidak ada permohonan baru.</div>`;
    return;
  }

  container.innerHTML = pending.map(p => `
    <div class="p-2 hover:bg-emerald-50/60 rounded-xl text-xs">
      <strong class="text-slate-800">${p.studentName}</strong> meminjam ${p.itemName}
      <div class="text-[10px] text-slate-400">${p.createdAt}</div>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parts[2]} ${months[parseInt(parts[1], 10) - 1] || parts[1]} ${parts[0]}`;
}

function formatRupiah(num) {
  return Number(num || 0).toLocaleString('id-ID');
}

/**
 * LAPORAN & EKSPOR SISTEM (PETUGAS)
 */
function getPetugasFilteredLaporanData() {
  const transactions = window.labDB.getTransactions();
  const items = window.labDB.getItems();
  const tipe = petugasState.laporanTipe || 'transaksi';

  const allYearsSet = new Set();
  transactions.forEach(t => {
    if (t.borrowDate) allYearsSet.add(t.borrowDate.substring(0, 4));
    if (t.returnDate) allYearsSet.add(t.returnDate.substring(0, 4));
    if (t.createdAt) allYearsSet.add(t.createdAt.substring(0, 4));
  });
  items.forEach(i => {
    if (i.createdAt) allYearsSet.add(i.createdAt.substring(0, 4));
    if (i.entryDate) allYearsSet.add(i.entryDate.substring(0, 4));
  });
  const currentYr = new Date().getFullYear().toString();
  allYearsSet.add(currentYr);
  const availableYears = Array.from(allYearsSet).filter(Boolean).sort().reverse();

  let filtered = [];

  if (tipe === 'transaksi') {
    filtered = transactions.filter(t => {
      if (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') {
        const year = (t.borrowDate || '').substring(0, 4);
        if (year !== petugasState.laporanTahun) return false;
      }
      if (petugasState.laporanStartDate && t.borrowDate < petugasState.laporanStartDate) return false;
      if (petugasState.laporanEndDate && t.borrowDate > petugasState.laporanEndDate) return false;
      if (petugasState.laporanKategori && petugasState.laporanKategori !== 'Semua') {
        if (t.itemCategory !== petugasState.laporanKategori) return false;
      }
      if (petugasState.laporanStatus && petugasState.laporanStatus !== 'Semua') {
        if (t.status !== petugasState.laporanStatus) return false;
      }
      return true;
    });
  } else if (tipe === 'barang') {
    filtered = items.filter(i => {
      if (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') {
        const year = (i.entryDate || i.createdAt || '').substring(0, 4);
        if (year && year !== petugasState.laporanTahun) return false;
      }
      if (petugasState.laporanKategori && petugasState.laporanKategori !== 'Semua') {
        if (i.category !== petugasState.laporanKategori) return false;
      }
      const avail = Number(i.availableStock ?? i.available ?? 0);
      const damaged = Number(i.damaged ?? 0);
      if (petugasState.laporanStatus && petugasState.laporanStatus !== 'Semua') {
        if (petugasState.laporanStatus === 'Tersedia' && avail <= 0) return false;
        if (petugasState.laporanStatus === 'Habis/Dipinjam' && avail > 0) return false;
        if (petugasState.laporanStatus === 'Ada Rusak' && damaged <= 0) return false;
      }
      return true;
    });
  } else if (tipe === 'denda') {
    filtered = transactions.filter(t => {
      if ((Number(t.fineAmount) || 0) <= 0) return false;
      if (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') {
        const year = (t.returnDate || t.borrowDate || '').substring(0, 4);
        if (year !== petugasState.laporanTahun) return false;
      }
      const checkDate = t.returnDate || t.borrowDate || '';
      if (petugasState.laporanStartDate && checkDate < petugasState.laporanStartDate) return false;
      if (petugasState.laporanEndDate && checkDate > petugasState.laporanEndDate) return false;
      if (petugasState.laporanKategori && petugasState.laporanKategori !== 'Semua') {
        if (t.itemCategory !== petugasState.laporanKategori) return false;
      }
      return true;
    });
  }

  return { filtered, availableYears, tipe };
}

function renderPetugasLaporanView(container) {
  const { filtered, availableYears, tipe } = getPetugasFilteredLaporanData();
  const categories = window.labDB.getCategories();

  const totalDenda = (tipe === 'barang') ? 0 : filtered.reduce((acc, curr) => acc + (Number(curr.fineAmount) || 0), 0);
  const totalUnit = (tipe === 'barang') 
    ? filtered.reduce((acc, curr) => acc + (Number(curr.totalStock ?? curr.stock) || 0), 0)
    : filtered.reduce((acc, curr) => acc + (Number(curr.qty) || 1), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER CARD -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200/60">
                Pusat Unduh Dokumen Petugas
              </span>
              <span class="text-xs text-slate-400">&bull; Filter Presisi Tahun, Waktu & Fitur</span>
            </div>
            <h3 class="text-lg font-black text-slate-800 mt-1">Laporan & Rekapitulasi Data</h3>
            <p class="text-xs text-slate-500">Unduh data resmi ke format Excel (.xlsx), berkas PDF ber-KOP resmi, atau cetak dokumen fisik.</p>
          </div>

          <!-- ACTION BUTTONS: EXCEL, PDF, CETAK, RESET -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="exportReportToExcel()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shadow-emerald-600/20 active:scale-95" title="Download Spreadsheet Excel (.xlsx)">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              <span>Export Excel (.xlsx)</span>
            </button>

            <button onclick="exportReportToPDF()" class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shadow-rose-600/20 active:scale-95" title="Download Berkas PDF Resmi">
              <i data-lucide="file-text" class="w-4 h-4"></i>
              <span>Export PDF (.pdf)</span>
            </button>

            <button onclick="printOfficialReport()" class="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shadow-blue-600/20 active:scale-95" title="Cetak Berkas Fisik Ber-KOP">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Cetak Berkop</span>
            </button>

            <button onclick="resetPetugasLaporanFilter()" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors" title="Kembalikan Filter Default">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- TIPE LAPORAN TABS -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span class="text-xs font-bold text-slate-500 mr-1 shrink-0">Jenis Laporan:</span>
          <button onclick="handlePetugasLaporanTipeChange('transaksi')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'transaksi' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i>
            <span>Transaksi Peminjaman</span>
          </button>
          <button onclick="handlePetugasLaporanTipeChange('barang')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'barang' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="box" class="w-3.5 h-3.5"></i>
            <span>Inventaris & Stok Alat</span>
          </button>
          <button onclick="handlePetugasLaporanTipeChange('denda')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'denda' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>Kas & Denda Keterlambatan</span>
          </button>
        </div>

        <!-- MULTI-TIER FILTER CONTROLS -->
        <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-3">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <i data-lucide="filter" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Filter Kustomisasi: Tahun, Waktu & Kategori Fitur</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- 1. Filter Tahun -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-blue-600"></i>1. Tahun:
              </label>
              <select id="laporan-tahun-filter" class="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanFilter()">
                <option value="Semua" ${petugasState.laporanTahun === 'Semua' ? 'selected' : ''}>Semua Tahun</option>
                ${availableYears.map(yr => `
                  <option value="${yr}" ${petugasState.laporanTahun === yr ? 'selected' : ''}>Tahun ${yr}</option>
                `).join('')}
              </select>
            </div>

            <!-- 2. Preset Waktu -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="clock" class="w-3 h-3 inline mr-1 text-blue-600"></i>2. Periode / Waktu:
              </label>
              <select id="laporan-preset-waktu" class="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanPresetChange(this.value)">
                <option value="semua" ${petugasState.laporanPresetWaktu === 'semua' ? 'selected' : ''}>Semua Riwayat (Tanpa Batas)</option>
                <option value="hari_ini" ${petugasState.laporanPresetWaktu === 'hari_ini' ? 'selected' : ''}>Hari Ini</option>
                <option value="7_hari" ${petugasState.laporanPresetWaktu === '7_hari' ? 'selected' : ''}>7 Hari Terakhir</option>
                <option value="bulan_ini" ${petugasState.laporanPresetWaktu === 'bulan_ini' ? 'selected' : ''}>Bulan Ini (${new Date().toLocaleString('id-ID', { month: 'long' })})</option>
                <option value="kuartal_ini" ${petugasState.laporanPresetWaktu === 'kuartal_ini' ? 'selected' : ''}>Kuartal Berjalan (3 Bulan)</option>
                <option value="tahun_ini" ${petugasState.laporanPresetWaktu === 'tahun_ini' ? 'selected' : ''}>Tahun Berjalan (${new Date().getFullYear()})</option>
                <option value="kustom" ${petugasState.laporanPresetWaktu === 'kustom' ? 'selected' : ''}>Kustom Rentang Tanggal...</option>
              </select>
            </div>

            <!-- 3. Dari Tanggal -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Dari Tanggal:</label>
              <input type="date" id="laporan-start-date" value="${petugasState.laporanStartDate || ''}" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanFilter()">
            </div>

            <!-- 4. Sampai Tanggal -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Sampai Tanggal:</label>
              <input type="date" id="laporan-end-date" value="${petugasState.laporanEndDate || ''}" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanFilter()">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
            <!-- 5. Kategori Barang / Fitur -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="tag" class="w-3 h-3 inline mr-1 text-blue-600"></i>Kategori / Fitur Alat:
              </label>
              <select id="laporan-kategori-filter" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanFilter()">
                <option value="Semua" ${petugasState.laporanKategori === 'Semua' ? 'selected' : ''}>Semua Kategori Alat</option>
                ${categories.map(cat => `
                  <option value="${cat.name}" ${petugasState.laporanKategori === cat.name ? 'selected' : ''}>${cat.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- 6. Status -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="check-circle" class="w-3 h-3 inline mr-1 text-blue-600"></i>Status Filter:
              </label>
              <select id="laporan-status-filter" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" onchange="handlePetugasLaporanFilter()">
                ${tipe === 'barang' ? `
                  <option value="Semua" ${petugasState.laporanStatus === 'Semua' ? 'selected' : ''}>Semua Status Alat</option>
                  <option value="Tersedia" ${petugasState.laporanStatus === 'Tersedia' ? 'selected' : ''}>Stok Tersedia (>0)</option>
                  <option value="Habis/Dipinjam" ${petugasState.laporanStatus === 'Habis/Dipinjam' ? 'selected' : ''}>Stok Habis / Sedang Dipinjam</option>
                  <option value="Ada Rusak" ${petugasState.laporanStatus === 'Ada Rusak' ? 'selected' : ''}>Ada Unit Rusak / Perlu Servis</option>
                ` : `
                  <option value="Semua" ${petugasState.laporanStatus === 'Semua' ? 'selected' : ''}>Semua Status Transaksi</option>
                  <option value="Dipinjam" ${petugasState.laporanStatus === 'Dipinjam' ? 'selected' : ''}>Dipinjam (Aktif)</option>
                  <option value="Dikembalikan" ${petugasState.laporanStatus === 'Dikembalikan' ? 'selected' : ''}>Dikembalikan (Selesai)</option>
                  <option value="Menunggu Konfirmasi" ${petugasState.laporanStatus === 'Menunggu Konfirmasi' ? 'selected' : ''}>Menunggu Konfirmasi</option>
                  <option value="Terlambat" ${petugasState.laporanStatus === 'Terlambat' ? 'selected' : ''}>Terlambat</option>
                `}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- STAT CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <i data-lucide="layers" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">Total Record:</span>
              <span class="text-base font-black text-slate-800">${filtered.length} Baris Data</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <i data-lucide="box" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">${tipe === 'barang' ? 'Total Stok Keseluruhan:' : 'Total Unit Dipinjam:'}</span>
              <span class="text-base font-black text-emerald-700">${totalUnit} Unit</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <i data-lucide="wallet" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="text-slate-500 block text-[11px]">${tipe === 'barang' ? 'Total Kategori:' : 'Total Denda Terkumpul:'}</span>
              <span class="text-base font-black ${tipe === 'barang' ? 'text-slate-800' : 'text-rose-600'}">
                ${tipe === 'barang' ? `${new Set(filtered.map(i => i.category)).size} Kategori` : `Rp ${formatRupiah(totalDenda)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- PREVIEW TABLE -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div class="flex items-center gap-2">
            <i data-lucide="table" class="w-4 h-4 text-slate-500"></i>
            <span class="font-bold text-xs text-slate-700">Pratinjau Data Laporan (${filtered.length} item)</span>
          </div>
          <span class="text-[11px] text-slate-400">Pratinjau sebelum diekspor ke Excel / PDF</span>
        </div>

        <div class="overflow-x-auto">
          ${renderPetugasLaporanPreviewTable(tipe, filtered)}
        </div>
      </div>
    </div>
  `;
}

function renderPetugasLaporanPreviewTable(tipe, filtered) {
  if (filtered.length === 0) {
    return `<div class="py-12 text-center text-slate-400 text-xs">Tidak ada data yang sesuai dengan kombinasi filter tahun, waktu, dan fitur yang dipilih.</div>`;
  }

  if (tipe === 'barang') {
    return `
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
          <tr>
            <th class="py-3 px-4">No</th>
            <th class="py-3 px-4">Kode Alat</th>
            <th class="py-3 px-4">Nama Barang Lab</th>
            <th class="py-3 px-4">Kategori</th>
            <th class="py-3 px-4">Lokasi</th>
            <th class="py-3 px-4 text-center">Total</th>
            <th class="py-3 px-4 text-center">Tersedia</th>
            <th class="py-3 px-4 text-center">Dipinjam</th>
            <th class="py-3 px-4 text-center">Rusak</th>
            <th class="py-3 px-4">Kondisi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${filtered.map((item, idx) => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-4 text-slate-400 font-mono">${idx + 1}</td>
              <td class="py-3 px-4 font-mono font-bold text-slate-700">${item.code || item.id}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">${item.name}</td>
              <td class="py-3 px-4"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium">${item.category || '-'}</span></td>
              <td class="py-3 px-4 text-slate-600">${item.location || 'Lab Komputer'}</td>
              <td class="py-3 px-4 text-center font-bold text-slate-800">${item.totalStock ?? item.stock}</td>
              <td class="py-3 px-4 text-center font-bold text-emerald-600">${item.availableStock ?? item.available}</td>
              <td class="py-3 px-4 text-center font-bold text-blue-600">${item.borrowed || 0}</td>
              <td class="py-3 px-4 text-center font-bold text-rose-500">${item.damaged || 0}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.condition === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${item.condition || 'Baik'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return `
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
        <tr>
          <th class="py-3 px-4">No. Transaksi</th>
          <th class="py-3 px-4">Siswa (NIS)</th>
          <th class="py-3 px-4">Barang Lab</th>
          <th class="py-3 px-4">Kategori</th>
          <th class="py-3 px-4">Pinjam - Tenggat</th>
          <th class="py-3 px-4">Tgl Kembali</th>
          <th class="py-3 px-4">Kondisi</th>
          <th class="py-3 px-4">Denda</th>
          <th class="py-3 px-4">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${filtered.map(t => `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4 font-mono font-bold text-slate-700">${t.id}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${t.studentName} <span class="text-slate-400 text-[10px]">(${t.studentNis})</span></td>
            <td class="py-3 px-4 font-medium text-blue-700">${t.itemName} (${t.qty} Unit)</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px]">${t.itemCategory || '-'}</span></td>
            <td class="py-3 px-4 text-slate-600">${formatDate(t.borrowDate)} &rarr; ${formatDate(t.dueDate)}</td>
            <td class="py-3 px-4 text-slate-600">${t.returnDate ? formatDate(t.returnDate) : '-'}</td>
            <td class="py-3 px-4">${t.returnCondition || '-'}</td>
            <td class="py-3 px-4 font-mono font-bold ${Number(t.fineAmount) > 0 ? 'text-rose-600' : 'text-slate-500'}">Rp ${formatRupiah(t.fineAmount)}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                t.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-800' :
                t.status === 'Dipinjam' ? 'bg-blue-100 text-blue-800' :
                t.status === 'Terlambat' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }">
                ${t.status}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function handlePetugasLaporanFilter() {
  const elTahun = document.getElementById('laporan-tahun-filter');
  const elStart = document.getElementById('laporan-start-date');
  const elEnd = document.getElementById('laporan-end-date');
  const elKat = document.getElementById('laporan-kategori-filter');
  const elStat = document.getElementById('laporan-status-filter');

  if (elTahun) petugasState.laporanTahun = elTahun.value;
  if (elStart) petugasState.laporanStartDate = elStart.value;
  if (elEnd) petugasState.laporanEndDate = elEnd.value;
  if (elKat) petugasState.laporanKategori = elKat.value;
  if (elStat) petugasState.laporanStatus = elStat.value;

  renderPetugasLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function handlePetugasLaporanPresetChange(preset) {
  petugasState.laporanPresetWaktu = preset;
  const today = new Date();
  const formatISO = (d) => d.toISOString().slice(0, 10);

  if (preset === 'semua') {
    petugasState.laporanStartDate = '';
    petugasState.laporanEndDate = '';
  } else if (preset === 'hari_ini') {
    const todayStr = formatISO(today);
    petugasState.laporanStartDate = todayStr;
    petugasState.laporanEndDate = todayStr;
  } else if (preset === '7_hari') {
    const past7 = new Date();
    past7.setDate(today.getDate() - 7);
    petugasState.laporanStartDate = formatISO(past7);
    petugasState.laporanEndDate = formatISO(today);
  } else if (preset === 'bulan_ini') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    petugasState.laporanStartDate = formatISO(firstDay);
    petugasState.laporanEndDate = formatISO(lastDay);
  } else if (preset === 'kuartal_ini') {
    const qMonth = Math.floor(today.getMonth() / 3) * 3;
    const firstDay = new Date(today.getFullYear(), qMonth, 1);
    const lastDay = new Date(today.getFullYear(), qMonth + 3, 0);
    petugasState.laporanStartDate = formatISO(firstDay);
    petugasState.laporanEndDate = formatISO(lastDay);
  } else if (preset === 'tahun_ini') {
    petugasState.laporanStartDate = `${today.getFullYear()}-01-01`;
    petugasState.laporanEndDate = `${today.getFullYear()}-12-31`;
    petugasState.laporanTahun = today.getFullYear().toString();
  }

  renderPetugasLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function handlePetugasLaporanTipeChange(tipe) {
  petugasState.laporanTipe = tipe;
  petugasState.laporanStatus = 'Semua';
  renderPetugasLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function resetPetugasLaporanFilter() {
  petugasState.laporanTahun = 'Semua';
  petugasState.laporanPresetWaktu = 'semua';
  petugasState.laporanStartDate = '';
  petugasState.laporanEndDate = '';
  petugasState.laporanKategori = 'Semua';
  petugasState.laporanStatus = 'Semua';
  renderPetugasLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function printOfficialReport() {
  const { filtered, tipe } = getPetugasFilteredLaporanData();
  const printTableBody = document.getElementById('print-table-body');
  const printTableHead = document.getElementById('print-table-head');
  const printTimestamp = document.getElementById('print-timestamp');
  const printPeriode = document.getElementById('print-periode-info');
  const printOfficer = document.getElementById('print-officer-name');
  const printTitle = document.getElementById('print-report-title');

  if (printTimestamp) printTimestamp.textContent = new Date().toLocaleString('id-ID');
  if (printOfficer) printOfficer.textContent = 'Dian Safitri, A.Md';

  let filterSummary = [];
  if (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') filterSummary.push(`Tahun: ${petugasState.laporanTahun}`);
  if (petugasState.laporanStartDate || petugasState.laporanEndDate) {
    filterSummary.push(`Rentang: ${petugasState.laporanStartDate || 'Awal'} s/d ${petugasState.laporanEndDate || 'Sekarang'}`);
  } else if (petugasState.laporanPresetWaktu && petugasState.laporanPresetWaktu !== 'semua') {
    filterSummary.push(`Periode: ${petugasState.laporanPresetWaktu}`);
  }
  if (petugasState.laporanKategori && petugasState.laporanKategori !== 'Semua') filterSummary.push(`Kategori: ${petugasState.laporanKategori}`);
  if (petugasState.laporanStatus && petugasState.laporanStatus !== 'Semua') filterSummary.push(`Status: ${petugasState.laporanStatus}`);

  if (printPeriode) {
    printPeriode.textContent = filterSummary.length > 0 
      ? `Filter Parameter: ${filterSummary.join(' | ')} (Total: ${filtered.length} Data)`
      : `Periode: Semua Riwayat Transaksi (Total: ${filtered.length} Data)`;
  }

  if (printTitle) {
    if (tipe === 'barang') printTitle.textContent = 'LAPORAN INVENTARIS & STOK ALAT LABORATORIUM';
    else if (tipe === 'denda') printTitle.textContent = 'LAPORAN REKAPITULASI KAS & DENDA KETERLAMBATAN';
    else printTitle.textContent = 'LAPORAN REKAPITULASI PEMINJAMAN ALAT LABORATORIUM';
  }

  if (tipe === 'barang') {
    if (printTableHead) {
      printTableHead.innerHTML = `
        <tr>
          <th>No</th>
          <th>Kode Alat</th>
          <th>Nama Barang Lab</th>
          <th>Kategori</th>
          <th>Lokasi</th>
          <th>Total Stok</th>
          <th>Tersedia</th>
          <th>Dipinjam</th>
          <th>Rusak</th>
          <th>Kondisi</th>
        </tr>
      `;
    }
    if (printTableBody) {
      printTableBody.innerHTML = filtered.map((item, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="font-mono">${item.code || item.id}</td>
          <td class="font-semibold">${item.name}</td>
          <td>${item.category || '-'}</td>
          <td>${item.location || 'Lab Komputer'}</td>
          <td class="text-center font-bold">${item.totalStock ?? item.stock}</td>
          <td class="text-center">${item.availableStock ?? item.available}</td>
          <td class="text-center">${item.borrowed || 0}</td>
          <td class="text-center">${item.damaged || 0}</td>
          <td>${item.condition || 'Baik'}</td>
        </tr>
      `).join('');
    }
  } else {
    if (printTableHead) {
      printTableHead.innerHTML = `
        <tr>
          <th>No</th>
          <th>ID Transaksi</th>
          <th>Nama Siswa (NIS)</th>
          <th>Barang & Jml</th>
          <th>Tgl Pinjam</th>
          <th>Tenggat</th>
          <th>Tgl Kembali</th>
          <th>Kondisi</th>
          <th>Denda</th>
          <th>Status</th>
        </tr>
      `;
    }
    if (printTableBody) {
      printTableBody.innerHTML = filtered.map((tx, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="font-mono">${tx.id}</td>
          <td>${tx.studentName} (${tx.studentNis})</td>
          <td>${tx.itemName} (${tx.qty} Unit)</td>
          <td>${formatDate(tx.borrowDate)}</td>
          <td>${formatDate(tx.dueDate)}</td>
          <td>${tx.returnDate ? formatDate(tx.returnDate) : '-'}</td>
          <td>${tx.returnCondition || '-'}</td>
          <td class="font-mono">${Number(tx.fineAmount) > 0 ? 'Rp ' + formatRupiah(tx.fineAmount) : '-'}</td>
          <td class="font-bold">${tx.status}</td>
        </tr>
      `).join('');
    }
  }

  document.body.classList.add('printing-report');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-report'), 1000);
}

function exportReportToExcel() {
  const { filtered, tipe } = getPetugasFilteredLaporanData();
  if (filtered.length === 0) {
    showPetugasToast('Tidak ada data yang sesuai dengan filter untuk diekspor ke Excel', 'warning');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showPetugasToast('Modul Excel (SheetJS) sedang dimuat, silakan coba sesaat lagi...', 'warning');
    return;
  }

  let sheetData = [];
  let sheetTitle = 'Laporan SIMPEL-LAB';

  if (tipe === 'barang') {
    sheetTitle = 'Inventaris Alat Lab';
    sheetData = filtered.map((item, idx) => ({
      'No': idx + 1,
      'Kode Alat': item.code || item.id,
      'Nama Barang Lab': item.name,
      'Kategori': item.category || '-',
      'Lokasi Simpan': item.location || 'Lab Komputer',
      'Total Stok (Unit)': Number(item.totalStock ?? item.stock) || 0,
      'Tersedia (Unit)': Number(item.availableStock ?? item.available) || 0,
      'Dipinjam (Unit)': Number(item.borrowed) || 0,
      'Rusak (Unit)': Number(item.damaged) || 0,
      'Kondisi Fisik': item.condition || 'Baik',
      'Tahun Masuk': item.entryDate ? item.entryDate.substring(0, 4) : '-'
    }));
  } else if (tipe === 'denda') {
    sheetTitle = 'Kas & Denda';
    sheetData = filtered.map((tx, idx) => ({
      'No': idx + 1,
      'ID Transaksi': tx.id,
      'NIS Siswa': tx.studentNis,
      'Nama Siswa': tx.studentName,
      'Kelas': tx.studentClass || '-',
      'Barang Lab': tx.itemName,
      'Jumlah (Unit)': Number(tx.qty) || 1,
      'Tgl Pinjam': tx.borrowDate,
      'Tenggat Kembali': tx.dueDate,
      'Tgl Pengembalian': tx.returnDate || '-',
      'Kondisi Alat': tx.returnCondition || '-',
      'Nominal Denda (Rp)': Number(tx.fineAmount) || 0,
      'Status Transaksi': tx.status,
      'Petugas Penerima': tx.officer || 'Dian Safitri, A.Md'
    }));
  } else {
    sheetTitle = 'Rekapitulasi Peminjaman';
    sheetData = filtered.map((tx, idx) => ({
      'No': idx + 1,
      'ID Transaksi': tx.id,
      'NIS Siswa': tx.studentNis,
      'Nama Siswa': tx.studentName,
      'Kelas': tx.studentClass || '-',
      'Kode Barang': tx.itemCode || '-',
      'Nama Barang Lab': tx.itemName,
      'Kategori Alat': tx.itemCategory || '-',
      'Jumlah (Unit)': Number(tx.qty) || 1,
      'Tanggal Pinjam': tx.borrowDate,
      'Tenggat Waktu': tx.dueDate,
      'Tanggal Kembali': tx.returnDate || '-',
      'Kondisi Saat Kembali': tx.returnCondition || '-',
      'Denda Keterlambatan (Rp)': Number(tx.fineAmount) || 0,
      'Status Transaksi': tx.status,
      'Petugas Pencatat': tx.officer || 'Dian Safitri, A.Md'
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetData);

  const colKeys = Object.keys(sheetData[0] || {});
  const colWidths = colKeys.map(k => {
    let maxLen = k.length;
    sheetData.forEach(row => {
      const val = row[k] ? String(row[k]) : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const yrStr = (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') ? `_Thn${petugasState.laporanTahun}` : '';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Petugas_${tipe.toUpperCase()}${yrStr}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });
  showPetugasToast(`Laporan berhasil diekspor ke format Excel (.xlsx): ${filename}`, 'success');
}

function exportReportToPDF() {
  const { filtered, tipe } = getPetugasFilteredLaporanData();
  if (filtered.length === 0) {
    showPetugasToast('Tidak ada data yang sesuai dengan filter untuk diekspor ke PDF', 'warning');
    return;
  }

  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : null;
  if (!jsPDFLib) {
    showPetugasToast('Modul PDF (jsPDF) sedang dimuat, silakan coba sesaat lagi...', 'warning');
    return;
  }

  try {
    const doc = new jsPDFLib({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('PEMERINTAH DAERAH PROVINSI - DINAS PENDIDIKAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('SMK NEGERI 1 INFORMATIKA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text('UNIT LABORATORIUM KOMPUTER & TEKNOLOGI INFORMASI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Alamat: Jl. Pendidikan No. 12, Telp. (021) 555-0199, Email: labkomputer@smk.sch.id', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.line(14, currentY, pageWidth - 14, currentY);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 1, pageWidth - 14, currentY + 1);
    currentY += 6;

    let titleStr = 'LAPORAN REKAPITULASI PEMINJAMAN ALAT LABORATORIUM';
    if (tipe === 'barang') titleStr = 'LAPORAN INVENTARIS & STOK ALAT LABORATORIUM';
    else if (tipe === 'denda') titleStr = 'LAPORAN REKAPITULASI KAS & DENDA KETERLAMBATAN';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(titleStr, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    let filterDesc = [];
    if (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') filterDesc.push(`Tahun: ${petugasState.laporanTahun}`);
    if (petugasState.laporanStartDate || petugasState.laporanEndDate) {
      filterDesc.push(`Rentang: ${petugasState.laporanStartDate || 'Awal'} s/d ${petugasState.laporanEndDate || 'Sekarang'}`);
    } else if (petugasState.laporanPresetWaktu && petugasState.laporanPresetWaktu !== 'semua') {
      filterDesc.push(`Periode: ${petugasState.laporanPresetWaktu}`);
    }
    if (petugasState.laporanKategori && petugasState.laporanKategori !== 'Semua') filterDesc.push(`Kategori: ${petugasState.laporanKategori}`);
    if (petugasState.laporanStatus && petugasState.laporanStatus !== 'Semua') filterDesc.push(`Status: ${petugasState.laporanStatus}`);

    const subText = filterDesc.length > 0 ? `Filter: ${filterDesc.join(' | ')}` : 'Filter: Semua Riwayat Transaksi';
    doc.text(`${subText}  (Total: ${filtered.length} Data)`, 14, currentY);
    doc.text(`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 4;

    let head = [];
    let body = [];

    if (tipe === 'barang') {
      head = [['No', 'Kode Alat', 'Nama Barang Lab', 'Kategori', 'Lokasi', 'Stok', 'Tersedia', 'Dipinjam', 'Rusak', 'Kondisi']];
      body = filtered.map((item, idx) => [
        idx + 1,
        item.code || item.id,
        item.name,
        item.category || '-',
        item.location || 'Lab Komputer',
        item.totalStock ?? item.stock,
        item.availableStock ?? item.available,
        item.borrowed || 0,
        item.damaged || 0,
        item.condition || 'Baik'
      ]);
    } else {
      head = [['No', 'ID Transaksi', 'Nama Siswa (NIS)', 'Kelas', 'Barang Lab (Qty)', 'Tgl Pinjam', 'Tenggat', 'Tgl Kembali', 'Denda', 'Status']];
      body = filtered.map((tx, idx) => [
        idx + 1,
        tx.id,
        `${tx.studentName}\n(${tx.studentNis})`,
        tx.studentClass || '-',
        `${tx.itemName} (${tx.qty} Unit)`,
        tx.borrowDate,
        tx.dueDate,
        tx.returnDate || '-',
        Number(tx.fineAmount) > 0 ? 'Rp ' + formatRupiah(tx.fineAmount) : '-',
        tx.status
      ]);
    }

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: head,
        body: body,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 }
        },
        margin: { left: 14, right: 14, bottom: 25 },
        didDrawPage: function (data) {
          const str = 'Halaman ' + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        }
      });

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 20;
      if (finalY > doc.internal.pageSize.getHeight() - 35) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text('Mengetahui,', 40, finalY, { align: 'center' });
      doc.text('Kepala Laboratorium Komputer', 40, finalY + 4, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Budi Santoso, S.Kom', 40, finalY + 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('NIP. 198507122010011002', 40, finalY + 24, { align: 'center' });

      const rightX = pageWidth - 45;
      doc.text('Petugas Administrasi Lab,', rightX, finalY, { align: 'center' });
      doc.text('SIMPEL-LAB System', rightX, finalY + 4, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Dian Safitri, A.Md', rightX, finalY + 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('NIP. 199203152015022001', rightX, finalY + 24, { align: 'center' });
    }

    const yrStr = (petugasState.laporanTahun && petugasState.laporanTahun !== 'Semua') ? `_Thn${petugasState.laporanTahun}` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_Petugas_${tipe.toUpperCase()}${yrStr}_${dateStr}.pdf`;

    doc.save(filename);
    showPetugasToast(`Laporan berhasil diekspor ke format PDF (.pdf): ${filename}`, 'success');
  } catch (err) {
    console.error('Gagal export PDF:', err);
    showPetugasToast('Terjadi kesalahan saat membuat berkas PDF: ' + err.message, 'error');
  }
}

window.exportReportToExcel = exportReportToExcel;
window.exportReportToPDF = exportReportToPDF;
window.printOfficialReport = printOfficialReport;
window.exportToCSV = exportReportToExcel;
