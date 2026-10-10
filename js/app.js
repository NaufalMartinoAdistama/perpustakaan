/**
 * SIMPEL-LAB - Sistem Peminjaman Barang Laboratorium Komputer
 * Main Application Logic & Single Page Router
 */

// Application Global State
const appState = {
  currentRole: 'admin', // 'admin' | 'petugas' | 'siswa'
  currentView: 'dashboard',
  activeStudentId: 'SIS-001', // Default active student for Siswa Role simulation
  searchQueries: {},
  filterCategories: {},
  charts: {} // To store Chart.js instances
};

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load saved role if any
  const savedRole = localStorage.getItem('SIMPEL_LAB_ACTIVE_ROLE');
  if (savedRole && ['admin', 'petugas', 'siswa'].includes(savedRole)) {
    appState.currentRole = savedRole;
  }

  const savedStudent = localStorage.getItem('SIMPEL_LAB_ACTIVE_STUDENT');
  if (savedStudent && window.labDB.getStudentById(savedStudent)) {
    appState.activeStudentId = savedStudent;
  } else {
    const students = window.labDB.getStudents();
    if (students.length > 0) {
      appState.activeStudentId = students[0].id;
    }
  }

  setupEventListeners();
  populateStudentSwitcher();
  updateRoleUI();
  handleHashChange();
  updateNotificationBadge();
}

/**
 * Setup General Global Event Listeners
 */
function setupEventListeners() {
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

  // Role Switcher Dropdown
  const btnOpenRole = document.getElementById('btn-open-role-switcher');
  const roleDropdown = document.getElementById('role-switcher-dropdown');
  if (btnOpenRole && roleDropdown) {
    btnOpenRole.addEventListener('click', (e) => {
      e.stopPropagation();
      roleDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!roleDropdown.contains(e.target) && e.target !== btnOpenRole) {
        roleDropdown.classList.add('hidden');
      }
    });
  }

  // Active Student Select listener
  const studentSelect = document.getElementById('active-student-select');
  if (studentSelect) {
    studentSelect.addEventListener('change', (e) => {
      appState.activeStudentId = e.target.value;
      localStorage.setItem('SIMPEL_LAB_ACTIVE_STUDENT', e.target.value);
      showToast(`Beralih ke profil siswa: ${studentSelect.options[studentSelect.selectedIndex].text}`, 'info');
      renderCurrentView();
    });
  }

  // Notifications Dropdown
  const btnNotif = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notifications-dropdown');
  if (btnNotif && notifDropdown) {
    btnNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
      renderNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== btnNotif) {
        notifDropdown.classList.add('hidden');
      }
    });
  }

  // Factory Reset button
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      openConfirmModal(
        'Reset ke Data Awal Pabrik?',
        'Semua perubahan data barang, transaksi, siswa, dan log akan dikembalikan ke data awal dummy default.',
        () => {
          window.labDB.resetToDefaults();
          showToast('Data berhasil direset ke setelan awal!', 'success');
          populateStudentSwitcher();
          renderCurrentView();
          updateNotificationBadge();
        }
      );
    });
  }

  // Hash change routing
  window.addEventListener('hashchange', handleHashChange);

  // Modal Form Submissions
  setupFormSubmissions();
}

/**
 * Role UI and Sidebar Menu Builder
 */
function switchRole(role) {
  if (!['admin', 'petugas', 'siswa'].includes(role)) return;
  appState.currentRole = role;
  localStorage.setItem('SIMPEL_LAB_ACTIVE_ROLE', role);

  const roleDropdown = document.getElementById('role-switcher-dropdown');
  if (roleDropdown) roleDropdown.classList.add('hidden');

  updateRoleUI();
  
  // Navigate to dashboard for new role
  window.location.hash = '#dashboard';
  handleHashChange();

  const roleNames = {
    admin: 'Administrator Lab (Akses Penuh)',
    petugas: 'Petugas Lab (Operasional)',
    siswa: 'Siswa (Peminjam Mandiri)'
  };
  showToast(`Berhasil beralih ke Role: ${roleNames[role]}`, 'info');
}

function updateRoleUI() {
  const role = appState.currentRole;
  const badge = document.getElementById('header-active-role-badge');
  const avatar = document.getElementById('sidebar-role-avatar');
  const userName = document.getElementById('sidebar-user-name');
  const userRole = document.getElementById('sidebar-user-role');
  const studentSwitcher = document.getElementById('student-switcher-container');

  if (role === 'admin') {
    badge.textContent = 'ADMIN';
    badge.className = 'uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md font-bold text-[11px] shadow-xs';
    avatar.className = 'w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm';
    avatar.textContent = 'AD';
    userName.textContent = 'Budi Santoso, S.Kom';
    userRole.textContent = 'Role: Kepala Lab (Admin)';
    if (studentSwitcher) {
      studentSwitcher.classList.add('hidden');
      studentSwitcher.classList.remove('flex');
    }
  } else if (role === 'petugas') {
    badge.textContent = 'PETUGAS LAB';
    badge.className = 'uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold text-[11px] shadow-xs';
    avatar.className = 'w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm';
    avatar.textContent = 'PT';
    userName.textContent = 'Dian Safitri, A.Md';
    userRole.textContent = 'Role: Teknisi / Petugas Lab';
    if (studentSwitcher) {
      studentSwitcher.classList.add('hidden');
      studentSwitcher.classList.remove('flex');
    }
  } else {
    badge.textContent = 'SISWA';
    badge.className = 'uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-bold text-[11px] shadow-xs';
    avatar.className = 'w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-sm';
    avatar.textContent = 'SW';
    
    const activeStudent = window.labDB.getStudentById(appState.activeStudentId);
    userName.textContent = activeStudent ? activeStudent.name : 'Siswa Peminjam';
    userRole.textContent = activeStudent ? `Kelas: ${activeStudent.grade}` : 'Role: Siswa';
    if (studentSwitcher) {
      studentSwitcher.classList.remove('hidden');
      studentSwitcher.classList.add('flex');
    }
  }

  renderSidebarMenu();
}

function renderSidebarMenu() {
  const menuContainer = document.getElementById('sidebar-menu');
  if (!menuContainer) return;

  const role = appState.currentRole;
  const currentView = appState.currentView;
  const stats = window.labDB.getDashboardStats();

  let menuItems = [];

  if (role === 'admin') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard Admin', icon: 'layout-dashboard', hash: '#dashboard' },
      { id: 'barang', label: 'Kelola Data Barang', icon: 'box', hash: '#barang' },
      { id: 'siswa', label: 'Kelola Data Siswa', icon: 'users', hash: '#siswa' },
      { id: 'petugas', label: 'Kelola Petugas Lab', icon: 'user-check', hash: '#petugas' },
      { 
        id: 'peminjaman', 
        label: 'Transaksi Pinjam', 
        icon: 'clipboard-list', 
        hash: '#peminjaman',
        badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
        badgeColor: 'bg-amber-500 text-white'
      },
      { 
        id: 'pengembalian', 
        label: 'Transaksi Kembali', 
        icon: 'rotate-ccw', 
        hash: '#pengembalian',
        badge: stats.overdueLoans > 0 ? stats.overdueLoans : null,
        badgeColor: 'bg-rose-500 text-white'
      },
      { id: 'laporan', label: 'Laporan & Cetak', icon: 'file-bar-chart', hash: '#laporan' }
    ];
  } else if (role === 'petugas') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard Petugas', icon: 'layout-dashboard', hash: '#dashboard' },
      { 
        id: 'peminjaman', 
        label: 'Entri Peminjaman', 
        icon: 'clipboard-list', 
        hash: '#peminjaman',
        badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
        badgeColor: 'bg-amber-500 text-white'
      },
      { 
        id: 'pengembalian', 
        label: 'Verifikasi Kembali', 
        icon: 'rotate-ccw', 
        hash: '#pengembalian',
        badge: stats.overdueLoans > 0 ? stats.overdueLoans : null,
        badgeColor: 'bg-rose-500 text-white'
      },
      { id: 'barang', label: 'Data Barang Lab', icon: 'box', hash: '#barang' },
      { id: 'siswa', label: 'Data Siswa', icon: 'users', hash: '#siswa' }
    ];
  } else {
    // Siswa Role
    const myLoans = window.labDB.getTransactions().filter(t => t.studentId === appState.activeStudentId && (t.status === 'Dipinjam' || t.status === 'Terlambat'));
    const myPending = window.labDB.getTransactions().filter(t => t.studentId === appState.activeStudentId && t.status === 'Menunggu Konfirmasi');

    menuItems = [
      { id: 'dashboard', label: 'Dashboard Siswa', icon: 'layout-dashboard', hash: '#dashboard' },
      { id: 'katalog', label: 'Katalog Barang Lab', icon: 'grid', hash: '#katalog' },
      { 
        id: 'riwayat', 
        label: 'Riwayat Pinjaman', 
        icon: 'history', 
        hash: '#riwayat',
        badge: myLoans.length > 0 ? myLoans.length : null,
        badgeColor: 'bg-brand-500 text-white'
      }
    ];
  }

  let html = '';
  menuItems.forEach(item => {
    const isActive = currentView === item.id;
    const activeClasses = isActive 
      ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-700/30' 
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium';

    html += `
      <a href="${item.hash}" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group ${activeClasses}">
        <div class="flex items-center gap-3">
          <i data-lucide="${item.icon}" class="w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors"></i>
          <span class="text-xs tracking-wide">${item.label}</span>
        </div>
        ${item.badge ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor} animate-pulse">${item.badge}</span>` : ''}
      </a>
    `;
  });

  menuContainer.innerHTML = html;
  lucide.createIcons();
}

function populateStudentSwitcher() {
  const select = document.getElementById('active-student-select');
  if (!select) return;

  const students = window.labDB.getStudents();
  select.innerHTML = students.map(s => `
    <option value="${s.id}" ${s.id === appState.activeStudentId ? 'selected' : ''}>
      ${s.name} (${s.grade})
    </option>
  `).join('');
}

/**
 * Single Page Hash Routing
 */
function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  appState.currentView = hash;

  // Update Page Title and Subtitle
  const titleEl = document.getElementById('page-title');
  const subTitleEl = document.getElementById('page-subtitle');

  const titles = {
    dashboard: {
      admin: ['Dashboard Administrator', 'Ringkasan performa dan inventaris laboratorium komputer'],
      petugas: ['Dashboard Petugas Lab', 'Manajemen operasional harian peminjaman & pengembalian'],
      siswa: ['Portal Siswa Lab', 'Peminjaman perangkat dan status inventaris Anda']
    },
    barang: {
      admin: ['Kelola Data Barang', 'Manajemen inventaris, stok, dan kondisi perangkat laboratorium'],
      petugas: ['Katalog & Stok Barang', 'Pemantauan ketersediaan dan status fisik barang lab'],
      siswa: ['Katalog Barang Lab', 'Jelajahi perangkat lab yang siap untuk dipinjam']
    },
    siswa: {
      admin: ['Kelola Data Siswa', 'Manajemen akun siswa dan hak peminjaman laboratorium'],
      petugas: ['Data Siswa Terdaftar', 'Daftar data siswa peminjam laboratorium komputer'],
      siswa: ['Portal Siswa Lab', 'Data Siswa']
    },
    petugas: {
      admin: ['Kelola Petugas Lab', 'Daftar akun staf teknisi dan operator lab komputer'],
      petugas: ['Staf Laboratorium', 'Daftar Staf Lab'],
      siswa: ['Staf Laboratorium', 'Daftar Staf Lab']
    },
    peminjaman: {
      admin: ['Transaksi Peminjaman', 'Persetujuan pengajuan mandiri dan entri pinjaman langsung'],
      petugas: ['Entri & Validasi Peminjaman', 'Form peminjaman langsung di meja lab dan persetujuan siswa'],
      siswa: ['Form Pengajuan', 'Ajukan peminjaman barang']
    },
    pengembalian: {
      admin: ['Transaksi Pengembalian', 'Verifikasi pengembalian alat, denda, dan pengecekan fisik'],
      petugas: ['Verifikasi Pengembalian', 'Pengecekan fisik perangkat kembali dan pencatatan denda'],
      siswa: ['Pengembalian', 'Status Pengembalian']
    },
    katalog: {
      admin: ['Katalog Barang', 'Katalog Barang Lab'],
      petugas: ['Katalog Barang', 'Katalog Barang Lab'],
      siswa: ['Katalog Perangkat Laboratorium', 'Pilih perangkat yang Anda butuhkan dan ajukan peminjaman']
    },
    riwayat: {
      admin: ['Riwayat Transaksi', 'Riwayat Transaksi'],
      petugas: ['Riwayat Transaksi', 'Riwayat Transaksi'],
      siswa: ['Riwayat & Status Peminjaman', 'Pantau pengajuan yang diajukan dan barang yang sedang dipinjam']
    },
    laporan: {
      admin: ['Laporan & Cetak Rekapitulasi', 'Filter periode, ekspor data, dan cetak dokumen resmi berkop surat'],
      petugas: ['Laporan Rekapitulasi', 'Rekapitulasi transaksi lab'],
      siswa: ['Laporan', 'Laporan']
    }
  };

  const currentRole = appState.currentRole;
  if (titles[hash] && titles[hash][currentRole]) {
    titleEl.textContent = titles[hash][currentRole][0];
    subTitleEl.textContent = titles[hash][currentRole][1];
  } else {
    titleEl.textContent = 'Dashboard SIMPEL-LAB';
    subTitleEl.textContent = 'Sistem Peminjaman Barang Laboratorium Komputer';
  }

  renderSidebarMenu();
  renderCurrentView();
}

function renderCurrentView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const view = appState.currentView;
  const role = appState.currentRole;

  // Cleanup old charts
  destroyAllCharts();

  if (view === 'dashboard') {
    if (role === 'admin') renderAdminDashboard(container);
    else if (role === 'petugas') renderPetugasDashboard(container);
    else renderSiswaDashboard(container);
  } else if (view === 'barang') {
    renderBarangView(container);
  } else if (view === 'siswa') {
    renderSiswaView(container);
  } else if (view === 'petugas') {
    if (role !== 'admin') {
      showToast('Akses dibatasi hanya untuk Administrator', 'warning');
      window.location.hash = '#dashboard';
      return;
    }
    renderPetugasView(container);
  } else if (view === 'peminjaman') {
    renderPeminjamanView(container);
  } else if (view === 'pengembalian') {
    renderPengembalianView(container);
  } else if (view === 'katalog') {
    renderKatalogView(container);
  } else if (view === 'riwayat') {
    renderRiwayatView(container);
  } else if (view === 'laporan') {
    if (role === 'siswa') {
      showToast('Halaman laporan hanya untuk Admin & Petugas', 'warning');
      window.location.hash = '#dashboard';
      return;
    }
    renderLaporanView(container);
  } else {
    window.location.hash = '#dashboard';
  }

  lucide.createIcons();
}

/**
 * -------------------------------------------------------------
 * VIEW 1: ADMIN DASHBOARD
 * -------------------------------------------------------------
 */
function renderAdminDashboard(container) {
  const stats = window.labDB.getDashboardStats();
  const pendingTxs = window.labDB.getTransactions().filter(t => t.status === 'Menunggu Konfirmasi');
  const recentLogs = window.labDB.getLogs().slice(0, 5);

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Top Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Barang -->
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

        <!-- Barang Dipinjam -->
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

        <!-- Siswa Aktif -->
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

        <!-- Keterlambatan / Butuh Aksi -->
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
        
        <!-- Chart 1: Statistik Peminjaman Bulanan (Span 2) -->
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

        <!-- Chart 2: Komposisi Kategori Barang (Span 1) -->
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

      <!-- Lower Section: Pending Approvals & Activity Log -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Pending Approvals (2 Cols) -->
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

        <!-- Recent Activity Feed (1 Col) -->
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

  // Render Charts
  setTimeout(() => {
    initDashboardCharts();
  }, 50);
}

/**
 * -------------------------------------------------------------
 * VIEW 2: PETUGAS DASHBOARD
 * -------------------------------------------------------------
 */
function renderPetugasDashboard(container) {
  const stats = window.labDB.getDashboardStats();
  const activeLoans = window.labDB.getTransactions().filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');
  const pendingRequests = window.labDB.getTransactions().filter(t => t.status === 'Menunggu Konfirmasi');

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Welcome Banner Petugas -->
      <div class="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span class="px-2.5 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold backdrop-blur-sm">Shift Kerja: Pagi (07.00 - 15.00)</span>
          <h2 class="text-xl font-black mt-2">Selamat Bertugas, Dian Safitri, A.Md</h2>
          <p class="text-emerald-100 text-xs mt-1 max-w-xl">Pastikan seluruh barang laboratorium yang dipinjam dicatat dengan teliti dan periksa kelengkapan fisik saat pengembalian.</p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <button onclick="openPinjamModal()" class="px-4 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Entri Peminjaman Baru</span>
          </button>
        </div>
      </div>

      <!-- Quick Operational Metrics -->
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

      <!-- Quick Action Table: Ongoing Loans awaiting return -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Daftar Peminjaman Aktif & Jatuh Tempo</h3>
            <p class="text-xs text-slate-400">Siswa yang saat ini masih meminjam peralatan lab</p>
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
                <tr><td colspan="5" class="py-6 text-center text-slate-400">Tidak ada peminjaman aktif saat ini. Semua barang ada di lab.</td></tr>
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

/**
 * -------------------------------------------------------------
 * VIEW 3: SISWA DASHBOARD
 * -------------------------------------------------------------
 */
function renderSiswaDashboard(container) {
  const currentStudent = window.labDB.getStudentById(appState.activeStudentId) || window.labDB.getStudents()[0];
  const allTxs = window.labDB.getTransactions().filter(t => t.studentId === currentStudent.id);
  const activeLoans = allTxs.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');
  const pendingTxs = allTxs.filter(t => t.status === 'Menunggu Konfirmasi');
  const finishedTxs = allTxs.filter(t => t.status === 'Dikembalikan');

  const hasOverdue = activeLoans.some(t => t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Student Hero Welcome Card -->
      <div class="bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-200 text-xs font-semibold mb-3">
              <i data-lucide="graduation-cap" class="w-4 h-4"></i>
              <span>${currentStudent.grade} &bull; ${currentStudent.major}</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight">Halo, ${currentStudent.name}!</h2>
            <p class="text-brand-100 text-xs sm:text-sm mt-1 max-w-xl">Selamat datang di Portal Peminjaman Laboratorium Komputer. Anda dapat meminjam laptop, router, switch, proyektor, dan toolkit praktikum.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <a href="#katalog" class="px-5 py-3 bg-white text-brand-900 hover:bg-brand-50 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 hover:scale-105">
              <i data-lucide="plus-circle" class="w-4 h-4 text-brand-600"></i>
              <span>Pinjam Barang Sekarang</span>
            </a>
          </div>
        </div>

        <!-- Background subtle ornament -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- Warning Alert if overdue -->
      ${hasOverdue ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="alert-octagon" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-rose-900 uppercase tracking-wide">Peringatan: Ada Barang Melewati Batas Waktu!</h4>
            <p class="text-xs text-rose-700 mt-0.5">Mohon segera mengembalikan peralatan ke Petugas Lab untuk menghindari penumpukan denda harian.</p>
          </div>
        </div>
      ` : ''}

      <!-- 3 Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Barang Sedang Anda Pinjam</span>
            <div class="text-2xl font-bold text-brand-600">${activeLoans.length} <span class="text-xs font-normal text-slate-400">Unit</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <i data-lucide="laptop" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Menunggu Persetujuan Petugas</span>
            <div class="text-2xl font-bold text-amber-600">${pendingTxs.length} <span class="text-xs font-normal text-slate-400">Pengajuan</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i data-lucide="hourglass" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Riwayat Selesai Dikembalikan</span>
            <div class="text-2xl font-bold text-emerald-600">${finishedTxs.length} <span class="text-xs font-normal text-slate-400">Transaksi</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
          </div>
        </div>

      </div>

      <!-- Current Possessions Table -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Peralatan Lab yang Sedang Anda Pegang</h3>
            <p class="text-xs text-slate-400">Pastikan alat dirawat dengan baik dan dikembalikan tepat waktu</p>
          </div>
          <a href="#riwayat" class="text-xs font-semibold text-brand-600 hover:text-brand-800">Lihat Semua Riwayat &rarr;</a>
        </div>

        ${activeLoans.length === 0 ? `
          <div class="text-center py-8 text-slate-400 text-xs space-y-2">
            <i data-lucide="package-open" class="w-10 h-10 mx-auto text-slate-300"></i>
            <p>Anda saat ini tidak memiliki barang lab yang sedang dipinjam.</p>
            <a href="#katalog" class="inline-block mt-2 px-4 py-2 bg-brand-50 text-brand-700 font-semibold rounded-xl text-xs hover:bg-brand-100 transition-colors">
              Lihat Katalog Barang Lab &rarr;
            </a>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-100">
                  <th class="pb-2 font-medium">Barang Dipinjam</th>
                  <th class="pb-2 font-medium">Tanggal Pinjam</th>
                  <th class="pb-2 font-medium">Tenggat Kembali</th>
                  <th class="pb-2 font-medium">Status</th>
                  <th class="pb-2 font-medium text-right">Surat Bukti</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${activeLoans.map(tx => `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3">
                      <div class="font-bold text-slate-800">${tx.itemName}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${tx.itemCode} &bull; ${tx.qty} Unit</div>
                    </td>
                    <td class="py-3 text-slate-600">${formatDate(tx.borrowDate)}</td>
                    <td class="py-3">
                      <span class="font-semibold ${tx.status === 'Terlambat' ? 'text-rose-600 font-bold' : 'text-slate-700'}">
                        ${formatDate(tx.dueDate)}
                      </span>
                    </td>
                    <td class="py-3">
                      ${tx.status === 'Terlambat' 
                        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Terlambat (Denda: Rp ${formatRupiah(tx.fineAmount)})</span>`
                        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Aktif Dipinjam</span>`}
                    </td>
                    <td class="py-3 text-right">
                      <button onclick="openBuktiModal('${tx.id}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition-colors inline-flex items-center gap-1">
                        <i data-lucide="printer" class="w-3 h-3 text-brand-600"></i>
                        <span>Cetak Bukti</span>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

    </div>
  `;
}

/**
 * -------------------------------------------------------------
 * VIEW 4: DATA BARANG (CRUD FOR ADMIN / READ & UPDATE FOR PETUGAS)
 * -------------------------------------------------------------
 */
function renderBarangView(container) {
  const role = appState.currentRole;
  const items = window.labDB.getItems();

  const searchQuery = appState.searchQueries.barang || '';
  const filterCategory = appState.filterCategories.barang || 'Semua';

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

      <!-- Action & Filter Bar -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="search-barang-input" 
            value="${searchQuery}" 
            placeholder="Cari kode barang, nama, atau lokasi rak..." 
            class="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            oninput="handleBarangSearch(this.value)"
          >
        </div>

        <!-- Filter Categories & Add Button -->
        <div class="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <select 
            id="filter-barang-kategori" 
            class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            onchange="handleBarangCategoryChange(this.value)"
          >
            ${categories.map(c => `<option value="${c}" ${c === filterCategory ? 'selected' : ''}>Kategori: ${c}</option>`).join('')}
          </select>

          ${role === 'admin' ? `
            <button onclick="openBarangModal()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Tambah Barang</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Menampilkan <strong>${filteredItems.length}</strong> dari total ${items.length} barang lab</span>
          ${role === 'petugas' ? `<span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Mode Operasional: Update Stok & Kondisi</span>` : ''}
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
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <i data-lucide="package-search" class="w-8 h-8 mx-auto mb-2 opacity-60"></i>
                    Tidak ada data barang yang sesuai dengan kata kunci pencarian.
                  </td>
                </tr>
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
                      <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] uppercase tracking-wide">
                        ${item.category}
                      </span>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="w-36">
                        <div class="flex items-center justify-between mb-1 text-[11px]">
                          <span class="font-bold ${isOutOfStock ? 'text-rose-600' : 'text-slate-800'}">
                            ${item.availableStock} / ${item.totalStock} Unit
                          </span>
                          <span class="text-[10px] text-slate-400 font-medium">${stockPercent}%</span>
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
                        ${role === 'admin' ? `
                          <button onclick="editBarang('${item.id}')" title="Edit Barang" class="p-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 rounded-lg transition-colors">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                          </button>
                          <button onclick="deleteBarang('${item.id}')" title="Hapus Barang" class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                          </button>
                        ` : `
                          <button onclick="quickUpdateStock('${item.id}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1">
                            <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                            <span>Update Stok</span>
                          </button>
                        `}
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

function handleBarangSearch(val) {
  appState.searchQueries.barang = val;
  renderBarangView(document.getElementById('main-content'));
  lucide.createIcons();
  const input = document.getElementById('search-barang-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function handleBarangCategoryChange(val) {
  appState.filterCategories.barang = val;
  renderBarangView(document.getElementById('main-content'));
  lucide.createIcons();
}

/**
 * -------------------------------------------------------------
 * VIEW 5: DATA SISWA (CRUD)
 * -------------------------------------------------------------
 */
function renderSiswaView(container) {
  const role = appState.currentRole;
  const students = window.labDB.getStudents();
  const searchQuery = appState.searchQueries.siswa || '';

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
            oninput="handleSiswaSearch(this.value)"
          >
        </div>

        ${role === 'admin' ? `
          <button onclick="openSiswaModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-colors">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Tambah Data Siswa</span>
          </button>
        ` : ''}
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
                ${role === 'admin' ? `<th class="py-3 px-4 text-right">Aksi</th>` : ''}
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
                    <td class="py-3.5 px-4 font-mono text-slate-600">
                      ${s.phone}
                    </td>
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
                    ${role === 'admin' ? `
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
                    ` : ''}
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

function handleSiswaSearch(val) {
  appState.searchQueries.siswa = val;
  renderSiswaView(document.getElementById('main-content'));
  lucide.createIcons();
  const input = document.getElementById('search-siswa-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

/**
 * -------------------------------------------------------------
 * VIEW 6: DATA PETUGAS (ADMIN ONLY)
 * -------------------------------------------------------------
 */
function renderPetugasView(container) {
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

/**
 * -------------------------------------------------------------
 * VIEW 7: TRANSAKSI PEMINJAMAN (APPROVAL & DIRECT ENTRY)
 * -------------------------------------------------------------
 */
function renderPeminjamanView(container) {
  const transactions = window.labDB.getTransactions();
  const pendingTxs = transactions.filter(t => t.status === 'Menunggu Konfirmasi');
  const activeTxs = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Action Button Bar -->
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

      <!-- Section 1: Pending Approvals -->
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

      <!-- Section 2: Active Borrowings -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h4 class="text-sm font-bold text-slate-800">Daftar Peminjaman Sedang Berjalan (${activeTxs.length})</h4>
        </div>

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

/**
 * -------------------------------------------------------------
 * VIEW 8: TRANSAKSI PENGEMBALIAN (VERIFIKASI & DENDA)
 * -------------------------------------------------------------
 */
function renderPengembalianView(container) {
  const transactions = window.labDB.getTransactions();
  const activeLoans = transactions.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');
  const completedReturns = transactions.filter(t => t.status === 'Dikembalikan');

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Header Info -->
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Verifikasi Pengembalian & Kondisi Barang</h3>
          <p class="text-xs text-slate-400">Pemeriksaan fisik kelengkapan perangkat, kalkulasi denda, dan restock otomatis</p>
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Tarif Denda Terlambat: <strong class="text-rose-600 font-bold">Rp 2.000 / Hari</strong>
        </div>
      </div>

      <!-- Pending Return Items -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Barang yang Wajib Dikembalikan (${activeLoans.length})
        </h4>

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

      <!-- History of Completed Returns -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Riwayat Pengembalian Selesai (${completedReturns.length})
        </h4>

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

/**
 * -------------------------------------------------------------
 * VIEW 9: KATALOG BARANG (UNTUK SISWA & UMUM)
 * -------------------------------------------------------------
 */
function renderKatalogView(container) {
  const items = window.labDB.getItems();
  const searchQuery = appState.searchQueries.katalog || '';
  const filterCategory = appState.filterCategories.katalog || 'Semua';

  const categories = ['Semua', 'Laptop', 'Multimedia', 'Jaringan', 'Toolkit', 'Komponen', 'Lainnya'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.specification && item.specification.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'Semua' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Header & Search -->
      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Katalog Alat & Perangkat Laboratorium</h3>
          <p class="text-xs text-slate-400">Pilih perangkat yang Anda butuhkan untuk kegiatan pembelajaran atau praktikum</p>
        </div>

        <div class="relative w-full md:w-80">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="search-katalog-input" 
            value="${searchQuery}" 
            placeholder="Cari laptop, mikrotik, proyektor..." 
            class="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            oninput="handleKatalogSearch(this.value)"
          >
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        ${categories.map(c => `
          <button 
            onclick="handleKatalogCategoryChange('${c}')"
            class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === c 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }"
          >
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Product Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        ${filteredItems.length === 0 ? `
          <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            <i data-lucide="package-search" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs">Barang yang Anda cari tidak ditemukan pada katalog.</p>
          </div>
        ` : filteredItems.map(item => {
          const isAvailable = item.availableStock > 0;
          return `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover-lift flex flex-col group">
              <!-- Item Image -->
              <div class="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                ${item.image ? `
                  <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                ` : `
                  <i data-lucide="monitor" class="w-12 h-12 text-slate-300"></i>
                `}
                <span class="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold uppercase">
                  ${item.category}
                </span>

                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }">
                  ${isAvailable ? `Tersedia (${item.availableStock})` : 'Stok Habis'}
                </span>
              </div>

              <!-- Item Details -->
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>${item.code}</span>
                    <span class="font-sans text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">${item.condition}</span>
                  </div>
                  <h4 class="font-bold text-slate-800 text-sm mb-2 group-hover:text-brand-600 transition-colors">${item.name}</h4>
                  <p class="text-xs text-slate-500 line-clamp-2 mb-3">${item.specification || 'Peralatan standar lab komputer SMK.'}</p>
                </div>

                <div class="pt-3 border-t border-slate-100 space-y-3">
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span class="truncate">${item.location || 'Laboratorium Komputer'}</span>
                  </div>

                  <button 
                    onclick="openPinjamModal('${item.id}')"
                    ${!isAvailable ? 'disabled' : ''}
                    class="w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isAvailable 
                        ? 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-brand-500/20' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }"
                  >
                    <i data-lucide="${isAvailable ? 'send' : 'lock'}" class="w-3.5 h-3.5"></i>
                    <span>${isAvailable ? 'Ajukan Pinjam' : 'Stok Tidak Tersedia'}</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

function handleKatalogSearch(val) {
  appState.searchQueries.katalog = val;
  renderKatalogView(document.getElementById('main-content'));
  lucide.createIcons();
  const input = document.getElementById('search-katalog-input');
  if (input) {
    input.focus();
    input.setSelectionRange(val.length, val.length);
  }
}

function handleKatalogCategoryChange(val) {
  appState.filterCategories.katalog = val;
  renderKatalogView(document.getElementById('main-content'));
  lucide.createIcons();
}

/**
 * -------------------------------------------------------------
 * VIEW 10: RIWAYAT PINJAMAN SISWA
 * -------------------------------------------------------------
 */
function renderRiwayatView(container) {
  const currentStudent = window.labDB.getStudentById(appState.activeStudentId) || window.labDB.getStudents()[0];
  const allTxs = window.labDB.getTransactions().filter(t => t.studentId === currentStudent.id);

  container.innerHTML = `
    <div class="space-y-6">

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">Riwayat Pengajuan & Peminjaman</h3>
          <p class="text-xs text-slate-400">Daftar transaksi akun peminjam: <strong>${currentStudent.name} (${currentStudent.grade})</strong></p>
        </div>
        <a href="#katalog" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Pinjam Baru</span>
        </a>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4">No. Transaksi</th>
                <th class="py-3 px-4">Barang</th>
                <th class="py-3 px-4">Tgl Pinjam</th>
                <th class="py-3 px-4">Tenggat Kembali</th>
                <th class="py-3 px-4">Status Transaksi</th>
                <th class="py-3 px-4">Kondisi / Denda</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${allTxs.length === 0 ? `
                <tr><td colspan="7" class="py-10 text-center text-slate-400">Belum ada riwayat pengajuan peminjaman untuk akun ini.</td></tr>
              ` : allTxs.map(tx => {
                let badgeClass = 'bg-slate-100 text-slate-600';
                if (tx.status === 'Dipinjam') badgeClass = 'bg-blue-100 text-blue-700';
                else if (tx.status === 'Dikembalikan') badgeClass = 'bg-emerald-100 text-emerald-700';
                else if (tx.status === 'Menunggu Konfirmasi') badgeClass = 'bg-amber-100 text-amber-700 pulse-badge';
                else if (tx.status === 'Terlambat') badgeClass = 'bg-rose-100 text-rose-700 font-bold';
                else if (tx.status === 'Ditolak') badgeClass = 'bg-slate-200 text-slate-700';

                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold text-slate-700">${tx.id}</td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-800">${tx.itemName}</div>
                      <div class="text-[10px] text-slate-400">${tx.qty} Unit &bull; ${tx.itemCategory}</div>
                    </td>
                    <td class="py-3.5 px-4 text-slate-600">${formatDate(tx.borrowDate)}</td>
                    <td class="py-3.5 px-4 font-bold text-slate-700">${formatDate(tx.dueDate)}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">
                        ${tx.status}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-600">
                      ${tx.status === 'Dikembalikan' ? `
                        <span>Kondisi: <strong>${tx.returnCondition}</strong></span>
                      ` : (tx.status === 'Terlambat' ? `
                        <span class="text-rose-600 font-bold">Denda: Rp ${formatRupiah(tx.fineAmount)}</span>
                      ` : '-')}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        ${tx.status === 'Menunggu Konfirmasi' ? `
                          <button onclick="cancelLoanRequest('${tx.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] transition-colors">
                            Batalkan
                          </button>
                        ` : ''}

                        ${tx.status === 'Dipinjam' || tx.status === 'Dikembalikan' ? `
                          <button onclick="openBuktiModal('${tx.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1">
                            <i data-lucide="printer" class="w-3 h-3 text-brand-600"></i>
                            <span>Bukti</span>
                          </button>
                        ` : ''}
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

/**
 * -------------------------------------------------------------
 * VIEW 11: LAPORAN & CETAK
 * -------------------------------------------------------------
 */
function renderLaporanView(container) {
  const transactions = window.labDB.getTransactions();

  const startDate = appState.laporanStartDate || '';
  const endDate = appState.laporanEndDate || '';
  const statusFilter = appState.laporanStatus || 'Semua';

  const filtered = transactions.filter(t => {
    let matchDate = true;
    if (startDate && t.borrowDate < startDate) matchDate = false;
    if (endDate && t.borrowDate > endDate) matchDate = false;

    let matchStatus = true;
    if (statusFilter !== 'Semua' && t.status !== statusFilter) matchStatus = false;

    return matchDate && matchStatus;
  });

  const totalDenda = filtered.reduce((acc, curr) => acc + (Number(curr.fineAmount) || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Filter Controls & Actions Card -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-800">Filter Laporan Rekapitulasi</h3>
            <p class="text-xs text-slate-400">Atur rentang tanggal atau status untuk mencetak berkas laporan resmi</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="exportToCSV()" class="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
              <span>Export CSV</span>
            </button>
            <button onclick="printOfficialReport()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak Laporan Lengkap</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal:</label>
            <input type="date" id="laporan-start-date" value="${startDate}" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleLaporanFilterChange()">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal:</label>
            <input type="date" id="laporan-end-date" value="${endDate}" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleLaporanFilterChange()">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Status Transaksi:</label>
            <select id="laporan-status-filter" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none" onchange="handleLaporanFilterChange()">
              <option value="Semua" ${statusFilter === 'Semua' ? 'selected' : ''}>Semua Status</option>
              <option value="Dipinjam" ${statusFilter === 'Dipinjam' ? 'selected' : ''}>Dipinjam</option>
              <option value="Dikembalikan" ${statusFilter === 'Dikembalikan' ? 'selected' : ''}>Dikembalikan</option>
              <option value="Menunggu Konfirmasi" ${statusFilter === 'Menunggu Konfirmasi' ? 'selected' : ''}>Menunggu Konfirmasi</option>
              <option value="Terlambat" ${statusFilter === 'Terlambat' ? 'selected' : ''}>Terlambat</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Quick Summary Metric Pills -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
        <div class="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
          <span class="text-slate-500">Total Transaksi Terfilter:</span>
          <span class="text-sm font-bold text-slate-800">${filtered.length} Transaksi</span>
        </div>
        <div class="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
          <span class="text-slate-500">Total Unit Dipinjam:</span>
          <span class="text-sm font-bold text-brand-700">${filtered.reduce((a, c) => a + (Number(c.qty) || 1), 0)} Unit</span>
        </div>
        <div class="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
          <span class="text-slate-500">Total Denda Terkumpul:</span>
          <span class="text-sm font-bold text-rose-600">Rp ${formatRupiah(totalDenda)}</span>
        </div>
      </div>

      <!-- Printable Preview Table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th class="py-3 px-4">No. Transaksi</th>
                <th class="py-3 px-4">Siswa (NIS)</th>
                <th class="py-3 px-4">Barang Lab</th>
                <th class="py-3 px-4">Pinjam - Tenggat</th>
                <th class="py-3 px-4">Tgl Kembali</th>
                <th class="py-3 px-4">Kondisi Fisik</th>
                <th class="py-3 px-4">Denda (Rp)</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.length === 0 ? `
                <tr><td colspan="8" class="py-10 text-center text-slate-400">Tidak ada transaksi yang cocok dengan kriteria filter.</td></tr>
              ` : filtered.map(t => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-slate-700">${t.id}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">${t.studentName} <span class="text-slate-400 text-[10px]">(${t.studentNis})</span></td>
                  <td class="py-3 px-4 font-medium text-brand-700">${t.itemName} (${t.qty})</td>
                  <td class="py-3 px-4 text-slate-600">${formatDate(t.borrowDate)} &rarr; ${formatDate(t.dueDate)}</td>
                  <td class="py-3 px-4 text-slate-600">${t.returnDate ? formatDate(t.returnDate) : '-'}</td>
                  <td class="py-3 px-4">${t.returnCondition || '-'}</td>
                  <td class="py-3 px-4 font-mono font-bold ${t.fineAmount > 0 ? 'text-rose-600' : 'text-slate-500'}">Rp ${formatRupiah(t.fineAmount)}</td>
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
        </div>
      </div>

    </div>
  `;
}

function handleLaporanFilterChange() {
  const start = document.getElementById('laporan-start-date').value;
  const end = document.getElementById('laporan-end-date').value;
  const status = document.getElementById('laporan-status-filter').value;

  appState.laporanStartDate = start;
  appState.laporanEndDate = end;
  appState.laporanStatus = status;

  renderLaporanView(document.getElementById('main-content'));
  lucide.createIcons();
}

/**
 * Print Official Report with Kop Surat
 */
function printOfficialReport() {
  const transactions = window.labDB.getTransactions();
  const startDate = appState.laporanStartDate;
  const endDate = appState.laporanEndDate;
  const statusFilter = appState.laporanStatus || 'Semua';

  const filtered = transactions.filter(t => {
    let matchDate = true;
    if (startDate && t.borrowDate < startDate) matchDate = false;
    if (endDate && t.borrowDate > endDate) matchDate = false;

    let matchStatus = true;
    if (statusFilter !== 'Semua' && t.status !== statusFilter) matchStatus = false;

    return matchDate && matchStatus;
  });

  const printTableBody = document.getElementById('print-table-body');
  const printTimestamp = document.getElementById('print-timestamp');
  const printPeriode = document.getElementById('print-periode-info');
  const printOfficer = document.getElementById('print-officer-name');

  if (printTimestamp) printTimestamp.textContent = new Date().toLocaleString('id-ID');
  if (printPeriode) {
    if (startDate || endDate) {
      printPeriode.textContent = `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'} (Filter: ${statusFilter})`;
    } else {
      printPeriode.textContent = `Periode: Semua Riwayat Transaksi (Filter: ${statusFilter})`;
    }
  }

  const currentUser = appState.currentRole === 'admin' ? 'Budi Santoso, S.Kom' : 'Dian Safitri, A.Md';
  if (printOfficer) printOfficer.textContent = currentUser;

  if (printTableBody) {
    printTableBody.innerHTML = filtered.map((tx, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="font-mono">${tx.id}</td>
        <td>${tx.studentName} (${tx.studentClass})</td>
        <td>${tx.itemName} (${tx.qty} Unit)</td>
        <td>${tx.borrowDate}</td>
        <td>${tx.dueDate}</td>
        <td>${tx.returnDate || '-'}</td>
        <td>${tx.returnCondition || '-'}</td>
        <td class="font-mono">Rp ${formatRupiah(tx.fineAmount)}</td>
        <td class="font-bold">${tx.status}</td>
      </tr>
    `).join('');
  }

  document.body.classList.add('printing-report');
  document.body.classList.remove('printing-slip');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-report');
  }, 1000);
}

/**
 * Print Individual Transaction Slip (Surat Bukti Peminjaman)
 */
function printBuktiSlip() {
  document.body.classList.add('printing-slip');
  document.body.classList.remove('printing-report');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-slip');
  }, 1000);
}

/**
 * Export Transaksi to CSV
 */
function exportToCSV() {
  const transactions = window.labDB.getTransactions();
  if (transactions.length === 0) {
    showToast('Tidak ada data transaksi untuk diekspor', 'warning');
    return;
  }

  const headers = ['ID Transaksi', 'NIS', 'Nama Siswa', 'Kelas', 'Kode Barang', 'Nama Barang', 'Kategori', 'Qty', 'Tgl Pinjam', 'Tenggat', 'Tgl Kembali', 'Kondisi Kembali', 'Denda', 'Status', 'Petugas'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.studentNis}"`,
    `"${t.studentName}"`,
    `"${t.studentClass}"`,
    `"${t.itemCode}"`,
    `"${t.itemName}"`,
    `"${t.itemCategory}"`,
    t.qty,
    `"${t.borrowDate}"`,
    `"${t.dueDate}"`,
    `"${t.returnDate || ''}"`,
    `"${t.returnCondition || ''}"`,
    t.fineAmount || 0,
    `"${t.status}"`,
    `"${t.officer || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Laporan_Peminjaman_LabKomputer_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Laporan berhasil diunduh dalam format CSV!', 'success');
}

/**
 * -------------------------------------------------------------
 * DASHBOARD CHARTS (CHART.JS)
 * -------------------------------------------------------------
 */
function destroyAllCharts() {
  Object.keys(appState.charts).forEach(key => {
    if (appState.charts[key]) {
      appState.charts[key].destroy();
      appState.charts[key] = null;
    }
  });
}

function initDashboardCharts() {
  destroyAllCharts();

  const ctxMonthly = document.getElementById('chart-monthly-loans');
  const ctxCategory = document.getElementById('chart-category-dist');

  // Chart 1: Monthly Loans
  if (ctxMonthly) {
    appState.charts.monthly = new Chart(ctxMonthly, {
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
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
          }
        }
      }
    });
  }

  // Chart 2: Category Distribution
  if (ctxCategory) {
    const items = window.labDB.getItems();
    const catCounts = {};
    items.forEach(i => {
      catCounts[i.category] = (catCounts[i.category] || 0) + Number(i.totalStock);
    });

    const labels = Object.keys(catCounts);
    const data = Object.values(catCounts);

    appState.charts.category = new Chart(ctxCategory, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { family: 'Plus Jakarta Sans', size: 10 }
            }
          }
        },
        cutout: '68%'
      }
    });
  }
}

/**
 * -------------------------------------------------------------
 * MODAL HANDLERS & CRUD OPERATIONS
 * -------------------------------------------------------------
 */

// Modal open/close helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    lucide.createIcons();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Confirmation Modal
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

// --- BARANG CRUD ---
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
    // Auto generate next code
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
      showToast(`Barang ${item.name} berhasil dihapus`, 'success');
      renderCurrentView();
    }
  );
}

function quickUpdateStock(id) {
  const item = window.labDB.getItemById(id);
  if (!item) return;

  const newStock = prompt(`Update Jumlah Stok Tersedia untuk "${item.name}" (Saat ini: ${item.availableStock} / Total: ${item.totalStock}):`, item.availableStock);
  if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
    const val = parseInt(newStock);
    window.labDB.updateItem(id, {
      availableStock: Math.min(item.totalStock, val),
      status: val > 0 ? 'Tersedia' : 'Habis'
    });
    showToast(`Stok ${item.name} diperbarui menjadi ${val} unit`, 'success');
    renderCurrentView();
  }
}

// --- SISWA CRUD ---
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
      populateStudentSwitcher();
      showToast(`Data siswa ${siswa.name} berhasil dihapus`, 'success');
      renderCurrentView();
    }
  );
}

// --- PETUGAS CRUD ---
function openPetugasModal(petugas = null) {
  const form = document.getElementById('form-petugas');
  form.reset();
  const title = document.getElementById('modal-petugas-title');

  if (petugas) {
    title.textContent = 'Edit Petugas Lab';
    document.getElementById('petugas-id').value = petugas.id;
    document.getElementById('petugas-nip').value = petugas.nip;
    document.getElementById('petugas-nama').value = petugas.nama || petugas.name;
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
      showToast(`Petugas ${staff.name} berhasil dihapus`, 'success');
      renderCurrentView();
    }
  );
}

// --- PEMINJAMAN MODAL & PROCESS ---
function openPinjamModal(preselectedItemId = null) {
  const role = appState.currentRole;
  const items = window.labDB.getItems();
  const students = window.labDB.getStudents();

  const form = document.getElementById('form-pinjam');
  form.reset();

  // Dates default: today and +3 days
  const todayStr = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 3);
  const dueStr = future.toISOString().slice(0, 10);

  document.getElementById('pinjam-tanggal').value = todayStr;
  document.getElementById('pinjam-tenggat').value = dueStr;

  // Setup Student Selection
  const wrapperSelect = document.getElementById('wrapper-siswa-select');
  const wrapperStatic = document.getElementById('wrapper-siswa-static');
  const studentSelect = document.getElementById('pinjam-siswa-id');

  if (role === 'siswa') {
    wrapperSelect.classList.add('hidden');
    wrapperStatic.classList.remove('hidden');
    const currentStudent = window.labDB.getStudentById(appState.activeStudentId) || students[0];
    document.getElementById('pinjam-static-siswa-name').textContent = currentStudent.name;
    document.getElementById('pinjam-static-siswa-class').textContent = `${currentStudent.grade} - ${currentStudent.nis}`;
    studentSelect.innerHTML = `<option value="${currentStudent.id}" selected>${currentStudent.name}</option>`;
    document.getElementById('pinjam-btn-submit-text').textContent = 'Kirim Pengajuan Mandiri';
  } else {
    wrapperSelect.classList.remove('hidden');
    wrapperStatic.classList.add('hidden');
    studentSelect.innerHTML = students.map(s => `
      <option value="${s.id}">${s.name} (${s.grade} - ${s.nis})</option>
    `).join('');
    document.getElementById('pinjam-btn-submit-text').textContent = 'Simpan & Berikan Barang';
  }

  // Setup Item Selection
  const itemSelect = document.getElementById('pinjam-barang-id');
  itemSelect.innerHTML = items.map(i => `
    <option value="${i.id}" ${i.availableStock <= 0 ? 'disabled' : ''} ${i.id === preselectedItemId ? 'selected' : ''}>
      ${i.name} [${i.code}] - Tersedia: ${i.availableStock} Unit
    </option>
  `).join('');

  // Info label for selected item
  const updateSelectedItemInfo = () => {
    const sel = window.labDB.getItemById(itemSelect.value);
    if (sel) {
      document.getElementById('item-info-stock').textContent = `Stok Tersedia: ${sel.availableStock} Unit`;
      document.getElementById('item-info-location').textContent = `Lokasi: ${sel.location || 'Lab'}`;
    }
  };
  itemSelect.onchange = updateSelectedItemInfo;
  updateSelectedItemInfo();

  openModal('modal-pinjam');
}

// Direct Approval & Reject
function approveLoanDirect(txId) {
  const officerName = appState.currentRole === 'petugas' ? 'Dian Safitri, A.Md' : 'Budi Santoso, S.Kom';
  const result = window.labDB.approveLoan(txId, officerName);
  if (result.success) {
    showToast('Pengajuan peminjaman berhasil disetujui! Stok telah dipotong.', 'success');
    updateRoleUI();
    renderCurrentView();
    updateNotificationBadge();
  } else {
    showToast(result.message || 'Gagal menyetujui peminjaman', 'error');
  }
}

function rejectLoanDirect(txId) {
  const reason = prompt('Masukkan alasan penolakan peminjaman barang ini:', 'Stok sedang digunakan untuk ujian sekolah');
  if (reason) {
    window.labDB.rejectLoan(txId, reason);
    showToast('Pengajuan peminjaman telah ditolak', 'info');
    updateRoleUI();
    renderCurrentView();
    updateNotificationBadge();
  }
}

function cancelLoanRequest(txId) {
  openConfirmModal(
    'Batalkan Pengajuan Ini?',
    'Pengajuan peminjaman yang berstatus menunggu konfirmasi akan dibatalkan.',
    () => {
      const txs = window.labDB.getTransactions().filter(t => t.id !== txId);
      window.labDB.saveTransactions(txs);
      showToast('Pengajuan peminjaman berhasil dibatalkan', 'info');
      renderCurrentView();
    }
  );
}

// --- PENGEMBALIAN MODAL ---
function openReturnModal(txId) {
  const tx = window.labDB.getTransactionById(txId);
  if (!tx) return;

  document.getElementById('kembali-tx-id').value = tx.id;
  document.getElementById('kembali-info-id').textContent = tx.id;
  document.getElementById('kembali-info-siswa').textContent = `${tx.studentName} (${tx.studentClass})`;
  document.getElementById('kembali-info-barang').textContent = `${tx.itemName} (${tx.qty} Unit)`;
  document.getElementById('kembali-info-tgl-pinjam').textContent = formatDate(tx.borrowDate);
  document.getElementById('kembali-info-tenggat').textContent = formatDate(tx.dueDate);

  // Late calculation
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = tx.dueDate < today || tx.status === 'Terlambat';
  const alertEl = document.getElementById('kembali-alert-keterlambatan');
  const dendaInput = document.getElementById('kembali-denda');

  if (isOverdue) {
    const diffTime = Math.abs(new Date(today) - new Date(tx.dueDate));
    const lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fine = lateDays * 2000;

    alertEl.classList.remove('hidden');
    document.getElementById('kembali-text-terlambat').textContent = `Terlambat ${lateDays} hari dari tenggat waktu (Tarif Denda: Rp 2.000 / hari). Total denda: Rp ${formatRupiah(fine)}.`;
    dendaInput.value = fine;
  } else {
    alertEl.classList.add('hidden');
    dendaInput.value = 0;
  }

  document.getElementById('kembali-catatan').value = '';
  document.getElementById('kembali-kondisi').value = 'Bagus';

  openModal('modal-kembali');
}

// --- SURAT BUKTI PEMINJAMAN MODAL ---
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

/**
 * Handle All Form Submissions
 */
function setupFormSubmissions() {
  // Form Barang
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
        // Update
        const old = window.labDB.getItemById(id);
        const stockDiff = stock - (old ? old.totalStock : 0);
        window.labDB.updateItem(id, {
          code, name, category, totalStock: stock,
          availableStock: Math.max(0, (old ? old.availableStock : 0) + stockDiff),
          condition, location, specification
        });
        showToast('Data barang berhasil diperbarui!', 'success');
      } else {
        // Create
        window.labDB.addItem({
          id: `BRG-${Date.now().toString().slice(-4)}`,
          code, name, category, totalStock: stock,
          availableStock: stock,
          condition, status: 'Tersedia', location, specification,
          image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&auto=format&fit=crop&q=60'
        });
        showToast('Barang baru berhasil ditambahkan!', 'success');
      }

      closeModal('modal-barang');
      renderCurrentView();
    });
  }

  // Form Siswa
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
        showToast('Data siswa berhasil diperbarui!', 'success');
      } else {
        window.labDB.addStudent({
          id: `SIS-${Date.now().toString().slice(-4)}`,
          nis, name, grade, major, phone, status,
          joinDate: new Date().toISOString().slice(0, 10)
        });
        showToast('Siswa baru berhasil didaftarkan!', 'success');
      }

      closeModal('modal-siswa');
      populateStudentSwitcher();
      renderCurrentView();
    });
  }

  // Form Petugas
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
        showToast('Data petugas berhasil diperbarui!', 'success');
      } else {
        window.labDB.addStaff({
          id: `STF-${Date.now().toString().slice(-4)}`,
          nip, name, role: roleTitle, shift, phone, status: 'Aktif'
        });
        showToast('Petugas baru berhasil ditambahkan!', 'success');
      }

      closeModal('modal-petugas');
      renderCurrentView();
    });
  }

  // Form Pinjam (Submission)
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
        showToast('Data siswa atau barang tidak valid!', 'error');
        return;
      }

      if (item.availableStock < qty) {
        showToast(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.availableStock})`, 'error');
        return;
      }

      // If submitted by Admin/Petugas -> Status is immediately 'Dipinjam'
      // If submitted by Siswa -> Status is 'Menunggu Konfirmasi'
      const isSelfStudent = appState.currentRole === 'siswa';
      const initialStatus = isSelfStudent ? 'Menunggu Konfirmasi' : 'Dipinjam';
      const officer = isSelfStudent ? '-' : (appState.currentRole === 'admin' ? 'Budi Santoso, S.Kom' : 'Dian Safitri, A.Md');

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
        status: initialStatus,
        returnCondition: '-',
        fineAmount: 0,
        officer: officer,
        notes: isSelfStudent ? 'Pengajuan mandiri oleh siswa via portal web' : 'Peminjaman langsung di meja lab'
      });

      closeModal('modal-pinjam');

      if (isSelfStudent) {
        showToast('Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan petugas lab.', 'success');
        window.location.hash = '#riwayat';
      } else {
        showToast(`Peminjaman berhasil dicatat untuk ${student.name}. Stok telah berkurang.`, 'success');
        openBuktiModal(newTx.id);
      }

      updateRoleUI();
      renderCurrentView();
      updateNotificationBadge();
    });
  }

  // Form Pengembalian (Submission)
  const formKembali = document.getElementById('form-kembali');
  if (formKembali) {
    formKembali.addEventListener('submit', (e) => {
      e.preventDefault();
      const txId = document.getElementById('kembali-tx-id').value;
      const returnCondition = document.getElementById('kembali-kondisi').value;
      const fineAmount = parseFloat(document.getElementById('kembali-denda').value) || 0;
      const notes = document.getElementById('kembali-catatan').value.trim();

      const officer = appState.currentRole === 'admin' ? 'Budi Santoso, S.Kom' : 'Dian Safitri, A.Md';

      window.labDB.processReturn(txId, {
        returnCondition,
        fineAmount,
        notes,
        officerName: officer
      });

      closeModal('modal-kembali');
      showToast('Barang berhasil diverifikasi kembali! Stok barang telah dipulihkan.', 'success');

      updateRoleUI();
      renderCurrentView();
      updateNotificationBadge();
    });
  }
}

/**
 * -------------------------------------------------------------
 * TOAST NOTIFICATIONS & BADGES
 * -------------------------------------------------------------
 */
function showToast(message, type = 'success') {
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

function updateNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  const notifCountText = document.getElementById('notif-count-text');
  const stats = window.labDB.getDashboardStats();

  const totalAlerts = stats.pendingRequests + stats.overdueLoans;
  if (badge) {
    if (totalAlerts > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (notifCountText) {
    notifCountText.textContent = `${totalAlerts} Perhatian`;
  }
}

function renderNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  const txs = window.labDB.getTransactions();
  const pending = txs.filter(t => t.status === 'Menunggu Konfirmasi');
  const overdue = txs.filter(t => t.status === 'Terlambat');

  if (pending.length === 0 && overdue.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-xs text-slate-400">
        <i data-lucide="bell-off" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
        Tidak ada pemberitahuan baru saat ini.
      </div>
    `;
    lucide.createIcons();
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

/**
 * -------------------------------------------------------------
 * HELPER FORMATTERS
 * -------------------------------------------------------------
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = parts[2];
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

function formatRupiah(num) {
  return Number(num || 0).toLocaleString('id-ID');
}
