/**
 * SIMPEL-LAB - Admin Controller
 * Dedicated logic for Administrator Role
 */

const adminState = {
  currentView: 'dashboard',
  searchQueries: {},
  filterCategories: {},
  charts: {},
  laporanTahun: 'Semua',
  laporanPresetWaktu: 'semua',
  laporanStartDate: '',
  laporanEndDate: '',
  laporanKategori: 'Semua',
  laporanStatus: 'Semua',
  laporanTipe: 'transaksi'
};

document.addEventListener('DOMContentLoaded', () => {
  // Verify admin session
  if (!window.authService.requireRole('admin', '../login.html')) return;

  setupAdminEventListeners();
  handleAdminRouting();
  updateAdminNotificationBadge();
});

function setupAdminEventListeners() {
  // Mobile sidebar controls
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

  // Notifications Dropdown
  const btnNotif = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notifications-dropdown');
  if (btnNotif && notifDropdown) {
    btnNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      renderAdminNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== btnNotif) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  // Hash change routing
  
  // Auto-close sidebar on mobile when a nav item is clicked
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        const sbb = document.getElementById('sidebar-backdrop');
        if (sb) sb.classList.add('-translate-x-full');
        if (sbb) sbb.classList.add('hidden');
      }
    });
  });
  
  window.addEventListener('hashchange', handleAdminRouting);

  // Form Submissions
  setupAdminForms();
}

function handleAdminRouting() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  adminState.currentView = hash;

  // Highlight active sidebar menu
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    const linkHash = link.getAttribute('href').replace('#', '');
    if (linkHash === hash) {
      link.className = 'admin-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25';
    } else {
      link.className = 'admin-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium group';
    }
  });

  const titleEl = document.getElementById('page-title');
  const subTitleEl = document.getElementById('page-subtitle');

  const titles = {
    dashboard: ['Dashboard Administrator', 'Ringkasan performa dan inventaris laboratorium komputer'],
    barang: ['Kelola Data Barang', 'Manajemen inventaris, stok, dan kondisi perangkat laboratorium'],
    siswa: ['Kelola Data Siswa', 'Manajemen akun siswa dan hak peminjaman laboratorium'],
    petugas: ['Kelola Petugas Lab', 'Daftar akun staf teknisi dan operator lab komputer'],
    peminjaman: ['Transaksi Peminjaman', 'Persetujuan pengajuan mandiri dan entri pinjaman langsung'],
    pengembalian: ['Transaksi Pengembalian', 'Verifikasi pengembalian alat, denda, dan pengecekan fisik'],
    laporan: ['Laporan & Cetak Rekapitulasi', 'Filter periode, ekspor data, dan cetak dokumen resmi berkop surat']
  };

  if (titles[hash]) {
    titleEl.textContent = titles[hash][0];
    subTitleEl.textContent = titles[hash][1];
  }

  renderAdminView();
}

function renderAdminView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  destroyAdminCharts();

  const view = adminState.currentView;
  if (view === 'dashboard') renderAdminDashboard(container);
  else if (view === 'barang') renderAdminBarangView(container);
  else if (view === 'siswa') renderAdminSiswaView(container);
  else if (view === 'petugas') renderAdminPetugasView(container);
  else if (view === 'peminjaman') renderAdminPeminjamanView(container);
  else if (view === 'pengembalian') renderAdminPengembalianView(container);
  else if (view === 'laporan') renderAdminLaporanView(container);
  else renderAdminDashboard(container);

  lucide.createIcons();
}

// 1. Dashboard View
function renderAdminDashboard(container) {
  const stats = window.labDB.getDashboardStats();
  const pendingTxs = window.labDB.getTransactions().filter(t => t.status === 'Menunggu Konfirmasi');
  const recentLogs = window.labDB.getLogs().slice(0, 5);

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Top Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover-lift flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Total Unit Barang</span>
            <div class="text-2xl font-bold text-slate-800">${stats.totalItems} <span class="text-xs font-normal text-slate-400">Unit</span></div>
            <div class="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>${stats.totalAvailable} Tersedia di Lab</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <i data-lucide="boxes" class="w-6 h-6"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover-lift flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Sedang Dipinjam</span>
            <div class="text-2xl font-bold text-brand-600">${stats.totalBorrowed} <span class="text-xs font-normal text-slate-400">Unit</span></div>
            <div class="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <span>${stats.activeLoans} Transaksi Berjalan</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <i data-lucide="handshake" class="w-6 h-6"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover-lift flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Siswa Terdaftar</span>
            <div class="text-2xl font-bold text-slate-800">${stats.activeStudents} <span class="text-xs font-normal text-slate-400">Siswa</span></div>
            <div class="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 font-medium">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              <span>Hak Pinjam Aktif</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <i data-lucide="users" class="w-6 h-6"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover-lift flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Perlu Tindakan</span>
            <div class="text-2xl font-bold ${stats.pendingRequests > 0 || stats.overdueLoans > 0 ? 'text-rose-600' : 'text-slate-800'}">
              ${stats.pendingRequests + stats.overdueLoans} <span class="text-xs font-normal text-slate-400">Kasus</span>
            </div>
            <div class="flex items-center gap-2 mt-2 text-[11px]">
              <span class="text-amber-600 font-semibold">${stats.pendingRequests} Menunggu</span>
              <span>&bull;</span>
              <span class="text-rose-600 font-semibold">${stats.overdueLoans} Terlambat</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="alert-circle" class="w-6 h-6"></i>
          </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Statistik Frekuensi Peminjaman Lab</h3>
              <p class="text-xs text-slate-400">Tren peminjaman barang per bulan tahun ajaran berjalan</p>
            </div>
            <span class="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg">Tahun 2026</span>
          </div>
          <div class="h-64">
            <canvas id="chart-monthly-loans"></canvas>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div class="mb-4">
            <h3 class="text-sm font-bold text-slate-800">Kategori Alat & Perangkat</h3>
            <p class="text-xs text-slate-400">Distribusi unit barang berdasarkan klasifikasi</p>
          </div>
          <div class="h-56 relative flex-1 flex items-center justify-center">
            <canvas id="chart-category-dist"></canvas>
          </div>
        </div>

      </div>

      <!-- Lower Section: Pending Approvals & Activity Feed -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <h3 class="text-sm font-bold text-slate-800">Pengajuan Peminjaman Menunggu Persetujuan</h3>
            </div>
            <a href="#peminjaman" class="text-xs font-semibold text-brand-600 hover:text-brand-800">Lihat Semua &rarr;</a>
          </div>

          ${pendingTxs.length === 0 ? `
            <div class="text-center py-8 text-slate-400 text-xs">
              <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80"></i>
              Tidak ada pengajuan pinjaman yang tertunda. Semua permohonan telah diproses.
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 border-b border-slate-100">
                    <th class="pb-2 font-medium">Siswa Peminjam</th>
                    <th class="pb-2 font-medium">Barang</th>
                    <th class="pb-2 font-medium">Tenggat</th>
                    <th class="pb-2 font-medium">Keperluan</th>
                    <th class="pb-2 font-medium text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${pendingTxs.map(tx => `
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="py-3">
                        <div class="font-semibold text-slate-800">${tx.studentName}</div>
                        <div class="text-[10px] text-slate-400">${tx.studentClass}</div>
                      </td>
                      <td class="py-3">
                        <span class="font-medium text-brand-700">${tx.itemName}</span>
                        <span class="text-[10px] text-slate-400 block">${tx.qty} Unit (${tx.itemCategory})</span>
                      </td>
                      <td class="py-3 text-slate-600 font-medium">
                        ${formatDate(tx.dueDate)}
                      </td>
                      <td class="py-3 text-slate-500 max-w-xs truncate" title="${tx.purpose}">
                        ${tx.purpose}
                      </td>
                      <td class="py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="approveLoanDirect('${tx.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-[11px] transition-colors shadow-xs">
                            Setujui
                          </button>
                          <button onclick="rejectLoanDirect('${tx.id}')" class="px-2 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg font-medium text-[11px] transition-colors">
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-800">Aktivitas Terkini Lab</h3>
            <i data-lucide="activity" class="w-4 h-4 text-slate-400"></i>
          </div>

          <div class="space-y-3.5 flex-1 overflow-y-auto max-h-72 pr-1">
            ${recentLogs.map(log => `
              <div class="flex items-start gap-3 text-xs">
                <div class="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                <div class="flex-1">
                  <p class="text-slate-700 leading-snug">${log.action}</p>
                  <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span class="font-medium text-slate-500">${log.user}</span>
                    <span>&bull;</span>
                    <span>${log.timestamp}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

    </div>
  `;

  setTimeout(() => initAdminCharts(), 50);
}

// 2. Kelola Barang View
function renderAdminBarangView(container) {
  const items = window.labDB.getItems();
  const searchQuery = adminState.searchQueries.barang || '';
  const filterCategory = adminState.filterCategories.barang || 'Semua';

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'Semua' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['Semua', 'Laptop', 'Multimedia', 'Jaringan', 'Toolkit', 'Komponen', 'Lainnya'];

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="search-barang-input" 
            value="${searchQuery}" 
            placeholder="Cari kode barang, nama, atau lokasi rak..." 
            class="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            oninput="handleAdminBarangSearch(this.value)"
          >
        </div>

        <div class="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <select 
            id="filter-barang-kategori" 
            class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            onchange="handleAdminBarangCategoryChange(this.value)"
          >
            ${categories.map(c => `<option value="${c}" ${c === filterCategory ? 'selected' : ''}>Kategori: ${c}</option>`).join('')}
          </select>

          <button onclick="openBarangModal()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 text-xs text-slate-500 font-medium">
          Menampilkan <strong>${filteredItems.length}</strong> dari total ${items.length} barang lab
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4">Barang & Kode</th>
                <th class="py-3 px-4">Kategori</th>
                <th class="py-3 px-4">Ketersediaan Stok</th>
                <th class="py-3 px-4">Kondisi</th>
                <th class="py-3 px-4">Lokasi Penyimpanan</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filteredItems.length === 0 ? `
                <tr><td colspan="6" class="py-12 text-center text-slate-400">Tidak ada data barang.</td></tr>
              ` : filteredItems.map(item => {
                const stockPercent = Math.round((item.availableStock / item.totalStock) * 100);
                const isOutOfStock = item.availableStock <= 0;

                return `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` : `<i data-lucide="box" class="w-5 h-5 text-slate-400"></i>`}
                        </div>
                        <div>
                          <div class="font-bold text-slate-800 text-[13px]">${item.name}</div>
                          <div class="font-mono text-[10px] text-slate-400 font-semibold">${item.code}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] uppercase">
                        ${item.category}
                      </span>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="w-36">
                        <div class="flex items-center justify-between mb-1 text-[11px]">
                          <span class="font-bold ${isOutOfStock ? 'text-rose-600' : 'text-slate-800'}">
                            ${item.availableStock} / ${item.totalStock} Unit
                          </span>
                          <span class="text-[10px] text-slate-400">${stockPercent}%</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div class="h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : (stockPercent < 30 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${stockPercent}%"></div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        item.condition === 'Sangat Baik' ? 'bg-emerald-100 text-emerald-800' :
                        item.condition === 'Baik' ? 'bg-blue-100 text-blue-800' :
                        item.condition === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }">
                        ${item.condition}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-600">
                      <div class="flex items-center gap-1.5">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span>${item.location || '-'}</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="editBarang('${item.id}')" title="Edit Barang" class="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 rounded-lg transition-colors">
                          <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteBarang('${item.id}')" title="Hapus Barang" class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
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

function handleAdminBarangSearch(val) {
  adminState.searchQueries.barang = val;
  renderAdminBarangView(document.getElementById('main-content'));
  lucide.createIcons();
  const input = document.getElementById('search-barang-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function handleAdminBarangCategoryChange(val) {
  adminState.filterCategories.barang = val;
  renderAdminBarangView(document.getElementById('main-content'));
  lucide.createIcons();
}

// 3. Kelola Siswa View
function renderAdminSiswaView(container) {
  const students = window.labDB.getStudents();
  const searchQuery = adminState.searchQueries.siswa || '';

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="search-siswa-input" 
            value="${searchQuery}" 
            placeholder="Cari NIS, Nama Siswa, atau Kelas..." 
            class="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            oninput="handleAdminSiswaSearch(this.value)"
          >
        </div>

        <button onclick="openSiswaModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>Tambah Data Siswa</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4">Nama Siswa & NIS</th>
                <th class="py-3 px-4">Kelas & Jurusan</th>
                <th class="py-3 px-4">Kontak WhatsApp</th>
                <th class="py-3 px-4">Peminjaman Aktif</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.length === 0 ? `
                <tr><td colspan="6" class="py-8 text-center text-slate-400">Data siswa tidak ditemukan.</td></tr>
              ` : filtered.map(s => {
                const activeLoansCount = window.labDB.getTransactions().filter(t => t.studentId === s.id && (t.status === 'Dipinjam' || t.status === 'Terlambat')).length;
                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-800 text-[13px]">${s.name}</div>
                      <div class="font-mono text-[10px] text-slate-400 font-semibold">NIS: ${s.nis}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-semibold text-slate-700">${s.grade}</span>
                      <div class="text-[10px] text-slate-400">${s.major}</div>
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-600">${s.phone}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeLoansCount > 0 ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'}">
                        ${activeLoansCount} Barang Dipinjam
                      </span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                        ${s.status}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="editSiswa('${s.id}')" title="Edit Data" class="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 rounded-lg transition-colors">
                          <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteSiswa('${s.id}')" title="Hapus Siswa" class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
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

function handleAdminSiswaSearch(val) {
  adminState.searchQueries.siswa = val;
  renderAdminSiswaView(document.getElementById('main-content'));
  lucide.createIcons();
  const input = document.getElementById('search-siswa-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

// 4. Kelola Petugas View
function renderAdminPetugasView(container) {
  const staff = window.labDB.getStaff();

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">Daftar Akun Petugas & Teknisi Lab</h3>
          <p class="text-xs text-slate-400">Pengelola operasional inventaris harian lab komputer</p>
        </div>
        <button onclick="openPetugasModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>Tambah Petugas</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${staff.map(st => `
          <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                ${st.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 class="font-bold text-slate-800 text-sm">${st.name}</h4>
                <div class="text-[11px] text-slate-500 font-mono mt-0.5">NIP: ${st.nip}</div>
                <div class="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold text-[10px] rounded-md">
                  ${st.role}
                </div>
                <div class="mt-2 text-xs text-slate-600 space-y-0.5">
                  <div class="flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ${st.shift}</div>
                  <div class="flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> ${st.phone}</div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button onclick="editPetugas('${st.id}')" title="Edit Akun" class="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 rounded-lg transition-colors">
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button onclick="deletePetugas('${st.id}')" title="Hapus Akun" class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 5. Transaksi Peminjaman View
function renderAdminPeminjamanView(container) {
  const transactions = window.labDB.getTransactions();
  const pendingTxs = transactions.filter(t => t.status === 'Menunggu Konfirmasi');
  const activeTxs = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Manajemen Peminjaman Barang</h3>
          <p class="text-xs text-slate-400">Persetujuan permohonan siswa & pencatatan peminjaman meja lab</p>
        </div>

        <button onclick="openPinjamModal()" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto">
          <i data-lucide="clipboard-plus" class="w-4 h-4"></i>
          <span>Entri Peminjaman Langsung</span>
        </button>
      </div>

      <!-- Pending Section -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <h4 class="text-sm font-bold text-slate-800">Permohonan Menunggu Konfirmasi (${pendingTxs.length})</h4>
          </div>
        </div>

        ${pendingTxs.length === 0 ? `
          <div class="text-center py-6 text-slate-400 text-xs">
            <i data-lucide="check-circle" class="w-6 h-6 text-emerald-500 mx-auto mb-1"></i>
            Tidak ada pengajuan pinjaman tertunda saat ini.
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th class="py-2.5 px-3">No. Pengajuan</th>
                  <th class="py-2.5 px-3">Siswa</th>
                  <th class="py-2.5 px-3">Barang Diminta</th>
                  <th class="py-2.5 px-3">Rencana Pinjam</th>
                  <th class="py-2.5 px-3">Tenggat Kembali</th>
                  <th class="py-2.5 px-3">Tujuan / Keperluan</th>
                  <th class="py-2.5 px-3 text-right">Tindakan Validasi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${pendingTxs.map(tx => `
                  <tr class="hover:bg-amber-50/40 transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-slate-700 text-[11px]">${tx.id}</td>
                    <td class="py-3 px-3">
                      <div class="font-bold text-slate-800">${tx.studentName}</div>
                      <div class="text-[10px] text-slate-400">${tx.studentClass} &bull; ${tx.studentNis}</div>
                    </td>
                    <td class="py-3 px-3">
                      <span class="font-bold text-brand-700">${tx.itemName}</span>
                      <span class="text-[10px] text-slate-500 block">${tx.qty} Unit (${tx.itemCategory})</span>
                    </td>
                    <td class="py-3 px-3 text-slate-600">${formatDate(tx.borrowDate)}</td>
                    <td class="py-3 px-3 font-bold text-slate-700">${formatDate(tx.dueDate)}</td>
                    <td class="py-3 px-3 text-slate-600 max-w-xs truncate" title="${tx.purpose}">${tx.purpose}</td>
                    <td class="py-3 px-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="approveLoanDirect('${tx.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i>
                          <span>Setujui</span>
                        </button>
                        <button onclick="rejectLoanDirect('${tx.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 rounded-lg font-bold text-[11px] transition-colors">
                          Tolak
                        </button>
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
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Daftar Peminjaman Sedang Berjalan (${activeTxs.length})</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th class="py-2.5 px-3">No. Transaksi</th>
                <th class="py-2.5 px-3">Peminjam</th>
                <th class="py-2.5 px-3">Barang & Jml</th>
                <th class="py-2.5 px-3">Tgl Pinjam</th>
                <th class="py-2.5 px-3">Tenggat Waktu</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${activeTxs.length === 0 ? `
                <tr><td colspan="7" class="py-8 text-center text-slate-400">Tidak ada peminjaman aktif.</td></tr>
              ` : activeTxs.map(tx => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-3 font-mono font-bold text-slate-700">${tx.id}</td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-slate-800">${tx.studentName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${tx.studentClass}</div>
                  </td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-brand-700">${tx.itemName}</div>
                    <div class="text-[10px] text-slate-400">${tx.qty} Unit</div>
                  </td>
                  <td class="py-3 px-3 text-slate-600">${formatDate(tx.borrowDate)}</td>
                  <td class="py-3 px-3 font-bold ${tx.status === 'Terlambat' ? 'text-rose-600' : 'text-slate-700'}">${formatDate(tx.dueDate)}</td>
                  <td class="py-3 px-3">
                    ${tx.status === 'Terlambat'
                      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Terlambat</span>`
                      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Dipinjam</span>`}
                  </td>
                  <td class="py-3 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button onclick="openBuktiModal('${tx.id}')" title="Cetak Surat Bukti" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                        <i data-lucide="printer" class="w-4 h-4 text-brand-600"></i>
                      </button>
                      <button onclick="openReturnModal('${tx.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                        <span>Kembalikan</span>
                      </button>
                    </div>
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

// 6. Transaksi Pengembalian View
function renderAdminPengembalianView(container) {
  const transactions = window.labDB.getTransactions();
  const activeLoans = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');
  const completedReturns = transactions.filter(t => t.status === 'Dikembalikan');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Verifikasi Pengembalian & Kondisi Barang</h3>
          <p class="text-xs text-slate-400">Pemeriksaan fisik kelengkapan perangkat, kalkulasi denda, dan restock otomatis</p>
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Tarif Denda Terlambat: <strong class="text-rose-600 font-bold">Rp 2.000 / Hari</strong>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Barang yang Wajib Dikembalikan (${activeLoans.length})</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th class="py-2.5 px-3">ID Transaksi</th>
                <th class="py-2.5 px-3">Peminjam</th>
                <th class="py-2.5 px-3">Barang</th>
                <th class="py-2.5 px-3">Tgl Pinjam</th>
                <th class="py-2.5 px-3">Tenggat Kembali</th>
                <th class="py-2.5 px-3">Estimasi Keterlambatan</th>
                <th class="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${activeLoans.length === 0 ? `
                <tr><td colspan="7" class="py-8 text-center text-slate-400">Tidak ada peminjaman aktif. Semua inventaris ada di lab.</td></tr>
              ` : activeLoans.map(tx => {
                const today = new Date().toISOString().slice(0, 10);
                const isOverdue = tx.dueDate < today || tx.status === 'Terlambat';
                
                let lateDays = 0;
                if (isOverdue) {
                  const diffTime = Math.abs(new Date(today) - new Date(tx.dueDate));
                  lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-slate-700">${tx.id}</td>
                    <td class="py-3 px-3">
                      <div class="font-bold text-slate-800">${tx.studentName}</div>
                      <div class="text-[10px] text-slate-400">${tx.studentClass}</div>
                    </td>
                    <td class="py-3 px-3">
                      <div class="font-bold text-brand-700">${tx.itemName}</div>
                      <div class="text-[10px] text-slate-400">${tx.qty} Unit</div>
                    </td>
                    <td class="py-3 px-3 text-slate-600">${formatDate(tx.borrowDate)}</td>
                    <td class="py-3 px-3 font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}">${formatDate(tx.dueDate)}</td>
                    <td class="py-3 px-3">
                      ${isOverdue ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Lewat ${lateDays} Hari (Denda Rp ${formatRupiah(lateDays * 2000)})
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Tepat Waktu</span>
                      `}
                    </td>
                    <td class="py-3 px-3 text-right">
                      <button onclick="openReturnModal('${tx.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 ml-auto">
                        <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                        <span>Verifikasi Kembali</span>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Riwayat Pengembalian Selesai (${completedReturns.length})</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th class="py-2.5 px-3">ID Transaksi</th>
                <th class="py-2.5 px-3">Peminjam</th>
                <th class="py-2.5 px-3">Barang</th>
                <th class="py-2.5 px-3">Tgl Kembali</th>
                <th class="py-2.5 px-3">Kondisi Kembali</th>
                <th class="py-2.5 px-3">Denda Dibayar</th>
                <th class="py-2.5 px-3">Petugas Penerima</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${completedReturns.map(tx => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-3 font-mono font-bold text-slate-700">${tx.id}</td>
                  <td class="py-3 px-3">
                    <div class="font-bold text-slate-800">${tx.studentName}</div>
                    <div class="text-[10px] text-slate-400">${tx.studentClass}</div>
                  </td>
                  <td class="py-3 px-3 font-semibold text-slate-800">${tx.itemName}</td>
                  <td class="py-3 px-3 text-slate-600">${formatDate(tx.returnDate || tx.borrowDate)}</td>
                  <td class="py-3 px-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.returnCondition === 'Bagus' ? 'bg-emerald-100 text-emerald-800' :
                      tx.returnCondition === 'Rusak Ringan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }">
                      ${tx.returnCondition || 'Bagus'}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-mono font-semibold ${tx.fineAmount > 0 ? 'text-rose-600' : 'text-slate-500'}">
                    Rp ${formatRupiah(tx.fineAmount)}
                  </td>
                  <td class="py-3 px-3 text-slate-600">${tx.officer || 'Petugas Lab'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 7. Laporan & Cetak View
function getAdminFilteredLaporanData() {
  const transactions = window.labDB.getTransactions();
  const items = window.labDB.getItems();
  const tipe = adminState.laporanTipe || 'transaksi';

  // Extract all distinct years from transactions & items
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
      // 1. Filter Tahun
      if (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') {
        const year = (t.borrowDate || '').substring(0, 4);
        if (year !== adminState.laporanTahun) return false;
      }
      // 2. Filter Waktu / Rentang Tanggal
      if (adminState.laporanStartDate && t.borrowDate < adminState.laporanStartDate) return false;
      if (adminState.laporanEndDate && t.borrowDate > adminState.laporanEndDate) return false;
      // 3. Filter Kategori
      if (adminState.laporanKategori && adminState.laporanKategori !== 'Semua') {
        if (t.itemCategory !== adminState.laporanKategori) return false;
      }
      // 4. Filter Status
      if (adminState.laporanStatus && adminState.laporanStatus !== 'Semua') {
        if (t.status !== adminState.laporanStatus) return false;
      }
      return true;
    });
  } else if (tipe === 'barang') {
    filtered = items.filter(i => {
      // 1. Filter Tahun
      if (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') {
        const year = (i.entryDate || i.createdAt || '').substring(0, 4);
        if (year && year !== adminState.laporanTahun) return false;
      }
      // 2. Filter Kategori
      if (adminState.laporanKategori && adminState.laporanKategori !== 'Semua') {
        if (i.category !== adminState.laporanKategori) return false;
      }
      // 3. Filter Status / Kondisi
      const avail = Number(i.availableStock ?? i.available ?? 0);
      const damaged = Number(i.damaged ?? 0);
      if (adminState.laporanStatus && adminState.laporanStatus !== 'Semua') {
        if (adminState.laporanStatus === 'Tersedia' && avail <= 0) return false;
        if (adminState.laporanStatus === 'Habis/Dipinjam' && avail > 0) return false;
        if (adminState.laporanStatus === 'Ada Rusak' && damaged <= 0) return false;
      }
      return true;
    });
  } else if (tipe === 'denda') {
    filtered = transactions.filter(t => {
      if ((Number(t.fineAmount) || 0) <= 0) return false;
      if (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') {
        const year = (t.returnDate || t.borrowDate || '').substring(0, 4);
        if (year !== adminState.laporanTahun) return false;
      }
      const checkDate = t.returnDate || t.borrowDate || '';
      if (adminState.laporanStartDate && checkDate < adminState.laporanStartDate) return false;
      if (adminState.laporanEndDate && checkDate > adminState.laporanEndDate) return false;
      if (adminState.laporanKategori && adminState.laporanKategori !== 'Semua') {
        if (t.itemCategory !== adminState.laporanKategori) return false;
      }
      return true;
    });
  }

  return { filtered, availableYears, tipe };
}

function renderAdminLaporanView(container) {
  const { filtered, availableYears, tipe } = getAdminFilteredLaporanData();
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
              <span class="px-2.5 py-1 bg-brand-50 text-brand-700 text-[11px] font-bold rounded-lg border border-brand-200/60">
                Pusat Unduh Dokumen
              </span>
              <span class="text-xs text-slate-400">&bull; Filter Presisi Tahun, Waktu & Fitur</span>
            </div>
            <h3 class="text-lg font-black text-slate-800 mt-1">Laporan & Ekspor Rekapitulasi</h3>
            <p class="text-xs text-slate-500">Unduh data resmi ke format Excel (.xlsx), dokumen PDF resmi ber-KOP, atau cetak fisik.</p>
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

            <button onclick="printOfficialReport()" class="px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shadow-brand-600/20 active:scale-95" title="Cetak Berkas Fisik Ber-KOP">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span class="hidden sm:inline">Cetak Berkop</span>
            </button>

            <button onclick="resetAdminLaporanFilter()" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors" title="Kembalikan Filter Default">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- TIPE LAPORAN TABS -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span class="text-xs font-bold text-slate-500 mr-1 shrink-0">Jenis Laporan:</span>
          <button onclick="handleAdminLaporanTipeChange('transaksi')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'transaksi' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i>
            <span>Transaksi Peminjaman</span>
          </button>
          <button onclick="handleAdminLaporanTipeChange('barang')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'barang' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="box" class="w-3.5 h-3.5"></i>
            <span>Inventaris & Stok Alat</span>
          </button>
          <button onclick="handleAdminLaporanTipeChange('denda')" class="px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 ${tipe === 'denda' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>Kas & Denda Keterlambatan</span>
          </button>
        </div>

        <!-- MULTI-TIER FILTER CONTROLS -->
        <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 space-y-3">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <i data-lucide="filter" class="w-3.5 h-3.5 text-brand-600"></i>
            <span>Filter Kustomisasi: Tahun, Waktu & Kategori Fitur</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- 1. Filter Tahun -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-brand-600"></i>1. Tahun:
              </label>
              <select id="laporan-tahun-filter" class="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanFilter()">
                <option value="Semua" ${adminState.laporanTahun === 'Semua' ? 'selected' : ''}>Semua Tahun</option>
                ${availableYears.map(yr => `
                  <option value="${yr}" ${adminState.laporanTahun === yr ? 'selected' : ''}>Tahun ${yr}</option>
                `).join('')}
              </select>
            </div>

            <!-- 2. Preset Waktu -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="clock" class="w-3 h-3 inline mr-1 text-brand-600"></i>2. Periode / Waktu:
              </label>
              <select id="laporan-preset-waktu" class="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanPresetChange(this.value)">
                <option value="semua" ${adminState.laporanPresetWaktu === 'semua' ? 'selected' : ''}>Semua Riwayat (Tanpa Batas)</option>
                <option value="hari_ini" ${adminState.laporanPresetWaktu === 'hari_ini' ? 'selected' : ''}>Hari Ini</option>
                <option value="7_hari" ${adminState.laporanPresetWaktu === '7_hari' ? 'selected' : ''}>7 Hari Terakhir</option>
                <option value="bulan_ini" ${adminState.laporanPresetWaktu === 'bulan_ini' ? 'selected' : ''}>Bulan Ini (${new Date().toLocaleString('id-ID', { month: 'long' })})</option>
                <option value="kuartal_ini" ${adminState.laporanPresetWaktu === 'kuartal_ini' ? 'selected' : ''}>Kuartal Berjalan (3 Bulan)</option>
                <option value="tahun_ini" ${adminState.laporanPresetWaktu === 'tahun_ini' ? 'selected' : ''}>Tahun Berjalan (${new Date().getFullYear()})</option>
                <option value="kustom" ${adminState.laporanPresetWaktu === 'kustom' ? 'selected' : ''}>Kustom Rentang Tanggal...</option>
              </select>
            </div>

            <!-- 3. Dari Tanggal -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Dari Tanggal:</label>
              <input type="date" id="laporan-start-date" value="${adminState.laporanStartDate || ''}" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanFilter()">
            </div>

            <!-- 4. Sampai Tanggal -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Sampai Tanggal:</label>
              <input type="date" id="laporan-end-date" value="${adminState.laporanEndDate || ''}" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanFilter()">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
            <!-- 5. Kategori Barang / Fitur -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="tag" class="w-3 h-3 inline mr-1 text-brand-600"></i>Kategori / Fitur Alat:
              </label>
              <select id="laporan-kategori-filter" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanFilter()">
                <option value="Semua" ${adminState.laporanKategori === 'Semua' ? 'selected' : ''}>Semua Kategori Alat</option>
                ${categories.map(cat => `
                  <option value="${cat.name}" ${adminState.laporanKategori === cat.name ? 'selected' : ''}>${cat.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- 6. Status -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">
                <i data-lucide="check-circle" class="w-3 h-3 inline mr-1 text-brand-600"></i>Status Filter:
              </label>
              <select id="laporan-status-filter" class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleAdminLaporanFilter()">
                ${tipe === 'barang' ? `
                  <option value="Semua" ${adminState.laporanStatus === 'Semua' ? 'selected' : ''}>Semua Status Alat</option>
                  <option value="Tersedia" ${adminState.laporanStatus === 'Tersedia' ? 'selected' : ''}>Stok Tersedia (>0)</option>
                  <option value="Habis/Dipinjam" ${adminState.laporanStatus === 'Habis/Dipinjam' ? 'selected' : ''}>Stok Habis / Sedang Dipinjam</option>
                  <option value="Ada Rusak" ${adminState.laporanStatus === 'Ada Rusak' ? 'selected' : ''}>Ada Unit Rusak / Perlu Servis</option>
                ` : `
                  <option value="Semua" ${adminState.laporanStatus === 'Semua' ? 'selected' : ''}>Semua Status Transaksi</option>
                  <option value="Dipinjam" ${adminState.laporanStatus === 'Dipinjam' ? 'selected' : ''}>Dipinjam (Aktif)</option>
                  <option value="Dikembalikan" ${adminState.laporanStatus === 'Dikembalikan' ? 'selected' : ''}>Dikembalikan (Selesai)</option>
                  <option value="Menunggu Konfirmasi" ${adminState.laporanStatus === 'Menunggu Konfirmasi' ? 'selected' : ''}>Menunggu Konfirmasi</option>
                  <option value="Terlambat" ${adminState.laporanStatus === 'Terlambat' ? 'selected' : ''}>Terlambat</option>
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
            <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
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
          ${renderAdminLaporanPreviewTable(tipe, filtered)}
        </div>
      </div>
    </div>
  `;
}

function renderAdminLaporanPreviewTable(tipe, filtered) {
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

  // transaksi & denda
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
            <td class="py-3 px-4 font-medium text-brand-700">${t.itemName} (${t.qty} Unit)</td>
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

function handleAdminLaporanFilter() {
  const elTahun = document.getElementById('laporan-tahun-filter');
  const elStart = document.getElementById('laporan-start-date');
  const elEnd = document.getElementById('laporan-end-date');
  const elKat = document.getElementById('laporan-kategori-filter');
  const elStat = document.getElementById('laporan-status-filter');

  if (elTahun) adminState.laporanTahun = elTahun.value;
  if (elStart) adminState.laporanStartDate = elStart.value;
  if (elEnd) adminState.laporanEndDate = elEnd.value;
  if (elKat) adminState.laporanKategori = elKat.value;
  if (elStat) adminState.laporanStatus = elStat.value;

  renderAdminLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function handleAdminLaporanPresetChange(preset) {
  adminState.laporanPresetWaktu = preset;
  const today = new Date();
  const formatISO = (d) => d.toISOString().slice(0, 10);

  if (preset === 'semua') {
    adminState.laporanStartDate = '';
    adminState.laporanEndDate = '';
  } else if (preset === 'hari_ini') {
    const todayStr = formatISO(today);
    adminState.laporanStartDate = todayStr;
    adminState.laporanEndDate = todayStr;
  } else if (preset === '7_hari') {
    const past7 = new Date();
    past7.setDate(today.getDate() - 7);
    adminState.laporanStartDate = formatISO(past7);
    adminState.laporanEndDate = formatISO(today);
  } else if (preset === 'bulan_ini') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    adminState.laporanStartDate = formatISO(firstDay);
    adminState.laporanEndDate = formatISO(lastDay);
  } else if (preset === 'kuartal_ini') {
    const qMonth = Math.floor(today.getMonth() / 3) * 3;
    const firstDay = new Date(today.getFullYear(), qMonth, 1);
    const lastDay = new Date(today.getFullYear(), qMonth + 3, 0);
    adminState.laporanStartDate = formatISO(firstDay);
    adminState.laporanEndDate = formatISO(lastDay);
  } else if (preset === 'tahun_ini') {
    adminState.laporanStartDate = `${today.getFullYear()}-01-01`;
    adminState.laporanEndDate = `${today.getFullYear()}-12-31`;
    adminState.laporanTahun = today.getFullYear().toString();
  }

  renderAdminLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function handleAdminLaporanTipeChange(tipe) {
  adminState.laporanTipe = tipe;
  adminState.laporanStatus = 'Semua';
  renderAdminLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

function resetAdminLaporanFilter() {
  adminState.laporanTahun = 'Semua';
  adminState.laporanPresetWaktu = 'semua';
  adminState.laporanStartDate = '';
  adminState.laporanEndDate = '';
  adminState.laporanKategori = 'Semua';
  adminState.laporanStatus = 'Semua';
  renderAdminLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

/**
 * Admin Charts
 */
function destroyAdminCharts() {
  Object.keys(adminState.charts).forEach(key => {
    if (adminState.charts[key]) {
      adminState.charts[key].destroy();
      adminState.charts[key] = null;
    }
  });
}

function initAdminCharts() {
  destroyAdminCharts();

  const ctxMonthly = document.getElementById('chart-monthly-loans');
  const ctxCategory = document.getElementById('chart-category-dist');

  if (ctxMonthly) {
    adminState.charts.monthly = new Chart(ctxMonthly, {
      type: 'bar',
      data: {
        labels: ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'],
        datasets: [
          {
            label: 'Total Peminjaman (Unit)',
            data: [14, 18, 26, 32, 29, 38],
            backgroundColor: '#3b82f6',
            borderRadius: 8,
            barThickness: 24
          },
          {
            label: 'Pengembalian Tepat Waktu',
            data: [12, 16, 24, 30, 27, 34],
            backgroundColor: '#10b981',
            borderRadius: 8,
            barThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
        }
      }
    });
  }

  if (ctxCategory) {
    const items = window.labDB.getItems();
    const catCounts = {};
    items.forEach(i => {
      catCounts[i.category] = (catCounts[i.category] || 0) + Number(i.totalStock);
    });

    adminState.charts.category = new Chart(ctxCategory, {
      type: 'doughnut',
      data: {
        labels: Object.keys(catCounts),
        datasets: [{
          data: Object.values(catCounts),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 10 } } } },
        cutout: '68%'
      }
    });
  }
}

/**
 * Setup Admin Modals and Form Actions
 */
function setupAdminForms() {
  // Barang Form
  const formBarang = document.getElementById('form-barang');
  if (formBarang) {
    formBarang.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('barang-id').value;
      const code = document.getElementById('barang-kode').value.trim();
      const name = document.getElementById('barang-nama').value.trim();
      const category = document.getElementById('barang-kategori').value;
      const stock = parseInt(document.getElementById('barang-stok').value);
      const condition = document.getElementById('barang-kondisi').value;
      const location = document.getElementById('barang-lokasi').value.trim();
      const specification = document.getElementById('barang-spesifikasi').value.trim();

      if (id) {
        const old = window.labDB.getItemById(id);
        const stockDiff = stock - (old ? old.totalStock : 0);
        window.labDB.updateItem(id, {
          code, name, category, totalStock: stock,
          availableStock: Math.max(0, (old ? old.availableStock : 0) + stockDiff),
          condition, location, specification
        });
        showAdminToast('Data barang berhasil diperbarui!', 'success');
      } else {
        window.labDB.addItem({
          id: `BRG-${Date.now().toString().slice(-4)}`,
          code, name, category, totalStock: stock,
          availableStock: stock,
          condition, status: 'Tersedia', location, specification,
          image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&auto=format&fit=crop&q=60'
        });
        showAdminToast('Barang baru berhasil ditambahkan!', 'success');
      }

      closeModal('modal-barang');
      renderAdminView();
    });
  }

  // Siswa Form
  const formSiswa = document.getElementById('form-siswa');
  if (formSiswa) {
    formSiswa.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('siswa-id').value;
      const nis = document.getElementById('siswa-nis').value.trim();
      const name = document.getElementById('siswa-nama').value.trim();
      const grade = document.getElementById('siswa-kelas').value.trim();
      const major = document.getElementById('siswa-jurusan').value;
      const phone = document.getElementById('siswa-hp').value.trim();
      const status = document.getElementById('siswa-status').value;

      if (id) {
        window.labDB.updateStudent(id, { nis, name, grade, major, phone, status });
        showAdminToast('Data siswa berhasil diperbarui!', 'success');
      } else {
        window.labDB.addStudent({
          id: `SIS-${Date.now().toString().slice(-4)}`,
          nis, name, grade, major, phone, status,
          joinDate: new Date().toISOString().slice(0, 10)
        });
        showAdminToast('Siswa baru berhasil didaftarkan!', 'success');
      }

      closeModal('modal-siswa');
      renderAdminView();
    });
  }

  // Petugas Form
  const formPetugas = document.getElementById('form-petugas');
  if (formPetugas) {
    formPetugas.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('petugas-id').value;
      const nip = document.getElementById('petugas-nip').value.trim();
      const name = document.getElementById('petugas-nama').value.trim();
      const roleTitle = document.getElementById('petugas-jabatan').value.trim();
      const shift = document.getElementById('petugas-shift').value;
      const phone = document.getElementById('petugas-kontak').value.trim();

      if (id) {
        window.labDB.updateStaff(id, { nip, name, role: roleTitle, shift, phone });
        showAdminToast('Data petugas berhasil diperbarui!', 'success');
      } else {
        window.labDB.addStaff({
          id: `STF-${Date.now().toString().slice(-4)}`,
          nip, name, role: roleTitle, shift, phone, status: 'Aktif'
        });
        showAdminToast('Petugas baru berhasil ditambahkan!', 'success');
      }

      closeModal('modal-petugas');
      renderAdminView();
    });
  }

  // Pinjam Form
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

      if (!student || !item) {
        showAdminToast('Data siswa atau barang tidak valid!', 'error');
        return;
      }

      if (item.availableStock < qty) {
        showAdminToast(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.availableStock})`, 'error');
        return;
      }

      const newTx = window.labDB.createTransaction({
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
        officer: 'Budi Santoso, S.Kom',
        notes: 'Peminjaman langsung di meja lab oleh Admin'
      });

      closeModal('modal-pinjam');
      showAdminToast(`Peminjaman berhasil dicatat untuk ${student.name}`, 'success');
      openBuktiModal(newTx.id);
      renderAdminView();
      updateAdminNotificationBadge();
    });
  }

  // Kembali Form
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
        officerName: 'Budi Santoso, S.Kom'
      });

      closeModal('modal-kembali');
      showAdminToast('Pengembalian barang berhasil diverifikasi! Stok barang telah pulih.', 'success');
      renderAdminView();
      updateAdminNotificationBadge();
    });
  }
}

// Helpers
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

let confirmCallback = null;
function openConfirmModal(title, message, onConfirm) {
  document.getElementById('modal-confirm-title').textContent = title;
  document.getElementById('modal-confirm-message').textContent = message;
  confirmCallback = onConfirm;
  openModal('modal-confirm');
}

const btnConfirmYes = document.getElementById('modal-confirm-btn-yes');
if (btnConfirmYes) {
  btnConfirmYes.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeModal('modal-confirm');
  });
}

function openBarangModal(item = null) {
  const form = document.getElementById('form-barang');
  form.reset();
  const title = document.getElementById('modal-barang-title');

  if (item) {
    title.textContent = 'Edit Data Barang';
    document.getElementById('barang-id').value = item.id;
    document.getElementById('barang-kode').value = item.code;
    document.getElementById('barang-nama').value = item.name;
    document.getElementById('barang-kategori').value = item.category;
    document.getElementById('barang-stok').value = item.totalStock;
    document.getElementById('barang-kondisi').value = item.condition;
    document.getElementById('barang-lokasi').value = item.location || '';
    document.getElementById('barang-spesifikasi').value = item.specification || '';
  } else {
    title.textContent = 'Tambah Data Barang';
    document.getElementById('barang-id').value = '';
    const count = window.labDB.getItems().length + 1;
    document.getElementById('barang-kode').value = `BRG-00${count}`;
  }
  openModal('modal-barang');
}

function editBarang(id) {
  const item = window.labDB.getItemById(id);
  if (item) openBarangModal(item);
}

function deleteBarang(id) {
  const item = window.labDB.getItemById(id);
  if (!item) return;

  openConfirmModal(
    `Hapus Barang ${item.name}?`,
    `Barang dengan kode ${item.code} akan dihapus secara permanen dari sistem inventaris.`,
    () => {
      window.labDB.deleteItem(id);
      showAdminToast(`Barang ${item.name} berhasil dihapus`, 'success');
      renderAdminView();
    }
  );
}

function openSiswaModal(siswa = null) {
  const form = document.getElementById('form-siswa');
  form.reset();
  const title = document.getElementById('modal-siswa-title');

  if (siswa) {
    title.textContent = 'Edit Data Siswa';
    document.getElementById('siswa-id').value = siswa.id;
    document.getElementById('siswa-nis').value = siswa.nis;
    document.getElementById('siswa-nama').value = siswa.name;
    document.getElementById('siswa-kelas').value = siswa.grade;
    document.getElementById('siswa-jurusan').value = siswa.major;
    document.getElementById('siswa-hp').value = siswa.phone;
    document.getElementById('siswa-status').value = siswa.status;
  } else {
    title.textContent = 'Tambah Data Siswa';
    document.getElementById('siswa-id').value = '';
    const nextNis = 20241000 + window.labDB.getStudents().length + 1;
    document.getElementById('siswa-nis').value = nextNis;
  }
  openModal('modal-siswa');
}

function editSiswa(id) {
  const siswa = window.labDB.getStudentById(id);
  if (siswa) openSiswaModal(siswa);
}

function deleteSiswa(id) {
  const siswa = window.labDB.getStudentById(id);
  if (!siswa) return;

  openConfirmModal(
    `Hapus Data Siswa ${siswa.name}?`,
    `Data siswa ini beserta rekam hak peminjamannya akan dihapus.`,
    () => {
      window.labDB.deleteStudent(id);
      showAdminToast(`Data siswa ${siswa.name} berhasil dihapus`, 'success');
      renderAdminView();
    }
  );
}

function openPetugasModal(petugas = null) {
  const form = document.getElementById('form-petugas');
  form.reset();
  const title = document.getElementById('modal-petugas-title');

  if (petugas) {
    title.textContent = 'Edit Petugas Lab';
    document.getElementById('petugas-id').value = petugas.id;
    document.getElementById('petugas-nip').value = petugas.nip;
    document.getElementById('petugas-nama').value = petugas.name;
    document.getElementById('petugas-jabatan').value = petugas.role;
    document.getElementById('petugas-shift').value = petugas.shift;
    document.getElementById('petugas-kontak').value = petugas.phone;
  } else {
    title.textContent = 'Tambah Petugas Lab';
    document.getElementById('petugas-id').value = '';
  }
  openModal('modal-petugas');
}

function editPetugas(id) {
  const staff = window.labDB.getStaff().find(s => s.id === id);
  if (staff) openPetugasModal(staff);
}

function deletePetugas(id) {
  const staff = window.labDB.getStaff().find(s => s.id === id);
  if (!staff) return;

  openConfirmModal(
    `Hapus Akun Petugas ${staff.name}?`,
    `Akun petugas ini tidak akan dapat login atau memvalidasi barang lagi.`,
    () => {
      window.labDB.deleteStaff(id);
      showAdminToast(`Petugas ${staff.name} berhasil dihapus`, 'success');
      renderAdminView();
    }
  );
}

function openPinjamModal(preselectedItemId = null) {
  const items = window.labDB.getItems();
  const students = window.labDB.getStudents();
  const form = document.getElementById('form-pinjam');
  form.reset();

  const todayStr = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 3);
  document.getElementById('pinjam-tanggal').value = todayStr;
  document.getElementById('pinjam-tenggat').value = future.toISOString().slice(0, 10);

  const studentSelect = document.getElementById('pinjam-siswa-id');
  studentSelect.innerHTML = students.map(s => `<option value="${s.id}">${s.name} (${s.grade} - ${s.nis})</option>`).join('');

  const itemSelect = document.getElementById('pinjam-barang-id');
  itemSelect.innerHTML = items.map(i => `
    <option value="${i.id}" ${i.availableStock <= 0 ? 'disabled' : ''} ${i.id === preselectedItemId ? 'selected' : ''}>
      ${i.name} [${i.code}] - Tersedia: ${i.availableStock} Unit
    </option>
  `).join('');

  const updateItemInfo = () => {
    const sel = window.labDB.getItemById(itemSelect.value);
    if (sel) {
      document.getElementById('item-info-stock').textContent = `Stok Tersedia: ${sel.availableStock} Unit`;
      document.getElementById('item-info-location').textContent = `Lokasi: ${sel.location || 'Lab'}`;
    }
  };
  itemSelect.onchange = updateItemInfo;
  updateItemInfo();

  openModal('modal-pinjam');
}

function approveLoanDirect(txId) {
  const result = window.labDB.approveLoan(txId, 'Budi Santoso, S.Kom');
  if (result.success) {
    showAdminToast('Pengajuan peminjaman disetujui! Stok telah berkurang.', 'success');
    renderAdminView();
    updateAdminNotificationBadge();
  } else {
    showAdminToast(result.message || 'Gagal menyetujui peminjaman', 'error');
  }
}

function rejectLoanDirect(txId) {
  const reason = prompt('Masukkan alasan penolakan peminjaman:', 'Stok sedang digunakan untuk ujian sekolah');
  if (reason) {
    window.labDB.rejectLoan(txId, reason);
    showAdminToast('Pengajuan peminjaman ditolak', 'info');
    renderAdminView();
    updateAdminNotificationBadge();
  }
}

function openReturnModal(txId) {
  const tx = window.labDB.getTransactionById(txId);
  if (!tx) return;

  document.getElementById('kembali-tx-id').value = tx.id;
  document.getElementById('kembali-info-id').textContent = tx.id;
  document.getElementById('kembali-info-siswa').textContent = `${tx.studentName} (${tx.studentClass})`;
  document.getElementById('kembali-info-barang').textContent = `${tx.itemName} (${tx.qty} Unit)`;
  const elTglPinjam = document.getElementById('kembali-info-tgl-pinjam');
  if (elTglPinjam) elTglPinjam.textContent = formatDate(tx.borrowDate);
  document.getElementById('kembali-info-tenggat').textContent = formatDate(tx.dueDate);

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = tx.dueDate < today || tx.status === 'Terlambat';
  const alertEl = document.getElementById('kembali-alert-keterlambatan');
  const dendaInput = document.getElementById('kembali-denda');

  if (isOverdue) {
    const diffTime = Math.abs(new Date(today) - new Date(tx.dueDate));
    const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fine = lateDays * 2000;
    alertEl.classList.remove('hidden');
    document.getElementById('kembali-text-terlambat').textContent = `Terlambat ${lateDays} hari dari tenggat waktu. Total denda: Rp ${formatRupiah(fine)}.`;
    dendaInput.value = fine;
  } else {
    alertEl.classList.add('hidden');
    dendaInput.value = 0;
  }

  document.getElementById('kembali-catatan').value = '';
  document.getElementById('kembali-kondisi').value = 'Bagus';
  openModal('modal-kembali');
}

function openBuktiModal(txId) {
  const tx = window.labDB.getTransactionById(txId);
  if (!tx) return;

  document.getElementById('slip-tx-id').textContent = tx.id;
  document.getElementById('slip-student-name').textContent = tx.studentName;
  document.getElementById('slip-student-nis').textContent = `${tx.studentNis} / ${tx.studentClass}`;
  document.getElementById('slip-item-name').textContent = tx.itemName;
  document.getElementById('slip-item-qty').textContent = `${tx.qty} Unit (${tx.itemCategory})`;
  document.getElementById('slip-borrow-date').textContent = formatDate(tx.borrowDate);
  document.getElementById('slip-due-date').textContent = formatDate(tx.dueDate);
  document.getElementById('slip-purpose').textContent = `"${tx.purpose}"`;
  document.getElementById('slip-sign-student').textContent = `( ${tx.studentName} )`;
  document.getElementById('slip-sign-officer').textContent = `( ${tx.officer || 'Budi Santoso, S.Kom'} )`;

  openModal('modal-bukti');
}

function printOfficialReport() {
  const { filtered, tipe } = getAdminFilteredLaporanData();
  const printTableBody = document.getElementById('print-table-body');
  const printTableHead = document.getElementById('print-table-head');
  const printTimestamp = document.getElementById('print-timestamp');
  const printPeriode = document.getElementById('print-periode-info');
  const printOfficer = document.getElementById('print-officer-name');
  const printTitle = document.getElementById('print-report-title');

  if (printTimestamp) printTimestamp.textContent = new Date().toLocaleString('id-ID');
  if (printOfficer) printOfficer.textContent = 'Budi Santoso, S.Kom';

  let filterSummary = [];
  if (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') filterSummary.push(`Tahun: ${adminState.laporanTahun}`);
  if (adminState.laporanStartDate || adminState.laporanEndDate) {
    filterSummary.push(`Rentang: ${adminState.laporanStartDate || 'Awal'} s/d ${adminState.laporanEndDate || 'Sekarang'}`);
  } else if (adminState.laporanPresetWaktu && adminState.laporanPresetWaktu !== 'semua') {
    filterSummary.push(`Periode: ${adminState.laporanPresetWaktu}`);
  }
  if (adminState.laporanKategori && adminState.laporanKategori !== 'Semua') filterSummary.push(`Kategori: ${adminState.laporanKategori}`);
  if (adminState.laporanStatus && adminState.laporanStatus !== 'Semua') filterSummary.push(`Status: ${adminState.laporanStatus}`);

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
  document.body.classList.remove('printing-slip');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-report'), 1000);
}

function printBuktiSlip() {
  document.body.classList.add('printing-slip');
  document.body.classList.remove('printing-report');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-slip'), 1000);
}

function exportReportToExcel() {
  const { filtered, tipe } = getAdminFilteredLaporanData();
  if (filtered.length === 0) {
    showAdminToast('Tidak ada data yang sesuai dengan filter untuk diekspor ke Excel', 'warning');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showAdminToast('Modul Excel (SheetJS) sedang dimuat, silakan coba sesaat lagi...', 'warning');
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
      'Petugas Penerima': tx.officer || 'Petugas Lab'
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
      'Petugas Pencatat': tx.officer || 'Petugas Lab'
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

  const yrStr = (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') ? `_Thn${adminState.laporanTahun}` : '';
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_SIMPEL_LAB_${tipe.toUpperCase()}${yrStr}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });
  showAdminToast(`Laporan berhasil diekspor ke format Excel (.xlsx): ${filename}`, 'success');
}

function exportReportToPDF() {
  const { filtered, tipe } = getAdminFilteredLaporanData();
  if (filtered.length === 0) {
    showAdminToast('Tidak ada data yang sesuai dengan filter untuk diekspor ke PDF', 'warning');
    return;
  }

  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : null;
  if (!jsPDFLib) {
    showAdminToast('Modul PDF (jsPDF) sedang dimuat, silakan coba sesaat lagi...', 'warning');
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

    // KOP SURAT RESMI
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

    // Double Divider Line
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.line(14, currentY, pageWidth - 14, currentY);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 1, pageWidth - 14, currentY + 1);
    currentY += 6;

    // JUDUL LAPORAN
    let titleStr = 'LAPORAN REKAPITULASI PEMINJAMAN ALAT LABORATORIUM';
    if (tipe === 'barang') titleStr = 'LAPORAN INVENTARIS & STOK ALAT LABORATORIUM';
    else if (tipe === 'denda') titleStr = 'LAPORAN REKAPITULASI KAS & DENDA KETERLAMBATAN';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(titleStr, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // FILTER INFORMATION BAR
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    let filterDesc = [];
    if (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') filterDesc.push(`Tahun: ${adminState.laporanTahun}`);
    if (adminState.laporanStartDate || adminState.laporanEndDate) {
      filterDesc.push(`Rentang: ${adminState.laporanStartDate || 'Awal'} s/d ${adminState.laporanEndDate || 'Sekarang'}`);
    } else if (adminState.laporanPresetWaktu && adminState.laporanPresetWaktu !== 'semua') {
      filterDesc.push(`Periode: ${adminState.laporanPresetWaktu}`);
    }
    if (adminState.laporanKategori && adminState.laporanKategori !== 'Semua') filterDesc.push(`Kategori: ${adminState.laporanKategori}`);
    if (adminState.laporanStatus && adminState.laporanStatus !== 'Semua') filterDesc.push(`Status: ${adminState.laporanStatus}`);

    const subText = filterDesc.length > 0 ? `Filter: ${filterDesc.join(' | ')}` : 'Filter: Semua Riwayat Transaksi';
    doc.text(`${subText}  (Total: ${filtered.length} Data)`, 14, currentY);
    doc.text(`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 4;

    // AUTOTABLE DATA
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

      // TANDA TANGAN RESMI
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 20;
      if (finalY > doc.internal.pageSize.getHeight() - 35) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      // Kiri: Mengetahui Kepala Lab
      doc.text('Mengetahui,', 40, finalY, { align: 'center' });
      doc.text('Kepala Laboratorium Komputer', 40, finalY + 4, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Budi Santoso, S.Kom', 40, finalY + 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('NIP. 198507122010011002', 40, finalY + 24, { align: 'center' });

      // Kanan: Petugas Administrasi
      const rightX = pageWidth - 45;
      doc.text('Petugas Administrasi Lab,', rightX, finalY, { align: 'center' });
      doc.text('SIMPEL-LAB System', rightX, finalY + 4, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Dian Safitri, A.Md', rightX, finalY + 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('NIP. 199203152015022001', rightX, finalY + 24, { align: 'center' });
    }

    const yrStr = (adminState.laporanTahun && adminState.laporanTahun !== 'Semua') ? `_Thn${adminState.laporanTahun}` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Laporan_SIMPEL_LAB_${tipe.toUpperCase()}${yrStr}_${dateStr}.pdf`;

    doc.save(filename);
    showAdminToast(`Laporan berhasil diekspor ke format PDF (.pdf): ${filename}`, 'success');
  } catch (err) {
    console.error('Gagal export PDF:', err);
    showAdminToast('Terjadi kesalahan saat membuat berkas PDF: ' + err.message, 'error');
  }
}

// Global Aliases & Defensive Backward Compatibility
window.exportReportToExcel = exportReportToExcel;
window.exportReportToPDF = exportReportToPDF;
window.printOfficialReport = printOfficialReport;
window.exportToCSV = exportReportToExcel;

function updateAdminNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  const notifCountText = document.getElementById('notif-count-text');
  const stats = window.labDB.getDashboardStats();
  const total = stats.pendingRequests + stats.overdueLoans;

  if (badge) {
    if (total > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
  }
  if (notifCountText) notifCountText.textContent = `${total} Perhatian`;
}

function renderAdminNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  const txs = window.labDB.getTransactions();
  const pending = txs.filter(t => t.status === 'Menunggu Konfirmasi');
  const overdue = txs.filter(t => t.status === 'Terlambat');

  if (pending.length === 0 && overdue.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru.</div>`;
    return;
  }

  let html = '';
  pending.forEach(p => {
    html += `
      <div class="p-2 hover:bg-amber-50/60 rounded-xl transition-colors text-xs flex items-start gap-2.5">
        <div class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
        <div>
          <span class="font-bold text-slate-800">Permohonan Pinjam Baru</span>
          <p class="text-slate-600 text-[11px]">${p.studentName} meminjam ${p.itemName}</p>
          <span class="text-[10px] text-slate-400">${p.createdAt}</span>
        </div>
      </div>
    `;
  });

  overdue.forEach(o => {
    html += `
      <div class="p-2 hover:bg-rose-50/60 rounded-xl transition-colors text-xs flex items-start gap-2.5">
        <div class="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
        <div>
          <span class="font-bold text-rose-700">Keterlambatan Pengembalian</span>
          <p class="text-slate-600 text-[11px]">${o.studentName} - ${o.itemName} melewati tenggat!</p>
          <span class="text-[10px] text-rose-500 font-semibold">Denda: Rp ${formatRupiah(o.fineAmount)}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

function showAdminToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item bg-white border rounded-2xl p-4 flex items-start gap-3 shadow-xl';

  let iconName = 'check-circle-2';
  let iconClass = 'text-emerald-500 bg-emerald-50';
  let borderClass = 'border-slate-100';

  if (type === 'error') {
    iconName = 'alert-octagon';
    iconClass = 'text-rose-500 bg-rose-50';
    borderClass = 'border-rose-100';
  } else if (type === 'warning') {
    iconName = 'alert-triangle';
    iconClass = 'text-amber-500 bg-amber-50';
    borderClass = 'border-amber-100';
  } else if (type === 'info') {
    iconName = 'info';
    iconClass = 'text-brand-500 bg-brand-50';
    borderClass = 'border-brand-100';
  }

  toast.classList.add(borderClass);

  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl ${iconClass} flex items-center justify-center shrink-0 mt-0.5">
      <i data-lucide="${iconName}" class="w-4 h-4"></i>
    </div>
    <div class="flex-1 text-xs">
      <div class="font-bold text-slate-800 capitalize">${type}</div>
      <div class="text-slate-600 mt-0.5">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 p-1">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
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
