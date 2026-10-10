/**
 * SIMPEL-LAB - Siswa Controller
 * Dedicated logic for Siswa Role
 */

const siswaState = {
  currentView: 'dashboard',
  searchQueries: {},
  filterCategories: {},
  activeStudentId: null
};

document.addEventListener('DOMContentLoaded', () => {
  if (!window.authService.requireRole('siswa', '../login.html')) return;

  const session = window.authService.getSession();
  siswaState.activeStudentId = session.refId || 'SIS-001';

  setupSiswaEventListeners();
  populateSiswaSwitcher();
  handleSiswaRouting();
});

function setupSiswaEventListeners() {
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

  // Student Switcher (Allows testing multiple student accounts)
  const studentSelect = document.getElementById('active-student-select');
  if (studentSelect) {
    studentSelect.addEventListener('change', (e) => {
      siswaState.activeStudentId = e.target.value;
      const s = window.labDB.getStudentById(e.target.value);
      if (s) {
        document.getElementById('sidebar-user-name').textContent = s.name;
        document.getElementById('sidebar-user-class').textContent = s.grade;
        showSiswaToast(`Beralih ke profil: ${s.name}`, 'info');
      }
      renderSiswaView();
    });
  }

  
  // Auto-close sidebar on mobile when a nav item is clicked
  document.querySelectorAll('.siswa-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        const sb = document.getElementById('sidebar');
        const sbb = document.getElementById('sidebar-backdrop');
        if (sb) sb.classList.add('-translate-x-full');
        if (sbb) sbb.classList.add('hidden');
      }
    });
  });
  
  window.addEventListener('hashchange', handleSiswaRouting);
  setupSiswaForms();
}

function populateSiswaSwitcher() {
  const select = document.getElementById('active-student-select');
  if (!select) return;

  const students = window.labDB.getStudents();
  select.innerHTML = students.map(s => `
    <option value="${s.id}" ${s.id === siswaState.activeStudentId ? 'selected' : ''}>
      ${s.name} (${s.grade})
    </option>
  `).join('');

  const current = window.labDB.getStudentById(siswaState.activeStudentId) || students[0];
  if (current) {
    document.getElementById('sidebar-user-name').textContent = current.name;
    document.getElementById('sidebar-user-class').textContent = current.grade;
  }
}

function handleSiswaRouting() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  siswaState.currentView = hash;

  document.querySelectorAll('.siswa-nav-link').forEach(link => {
    const linkHash = link.getAttribute('href').replace('#', '');
    if (linkHash === hash) {
      link.className = 'siswa-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25';
    } else {
      link.className = 'siswa-nav-link flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium group';
    }
  });

  const titleEl = document.getElementById('page-title');
  const subTitleEl = document.getElementById('page-subtitle');

  const titles = {
    dashboard: ['Portal Siswa Lab', 'Peminjaman perangkat dan status inventaris Anda'],
    katalog: ['Katalog Alat & Perangkat', 'Pilih perangkat yang Anda butuhkan dan ajukan peminjaman'],
    riwayat: ['Riwayat & Status Peminjaman', 'Pantau pengajuan yang diajukan dan barang yang sedang dipinjam']
  };

  if (titles[hash]) {
    titleEl.textContent = titles[hash][0];
    subTitleEl.textContent = titles[hash][1];
  }

  renderSiswaView();
}

function renderSiswaView() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const view = siswaState.currentView;
  if (view === 'dashboard') renderSiswaDashboard(container);
  else if (view === 'katalog') renderSiswaKatalogView(container);
  else if (view === 'riwayat') renderSiswaRiwayatView(container);
  else renderSiswaDashboard(container);

  lucide.createIcons();
}

function renderSiswaDashboard(container) {
  const student = window.labDB.getStudentById(siswaState.activeStudentId) || window.labDB.getStudents()[0];
  const allTxs = window.labDB.getTransactions().filter(t => t.studentId === student.id);
  const activeLoans = allTxs.filter(t => t.status === 'Dipinjam' || t.status === 'Terlambat');
  const pendingTxs = allTxs.filter(t => t.status === 'Menunggu Konfirmasi');
  const finishedTxs = allTxs.filter(t => t.status === 'Dikembalikan');

  const hasOverdue = activeLoans.some(t => t.status === 'Terlambat');

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Hero Banner -->
      <div class="bg-gradient-to-tr from-brand-900 via-brand-800 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-200 text-xs font-semibold mb-3">
              <i data-lucide="graduation-cap" class="w-4 h-4"></i>
              <span>${student.grade} &bull; ${student.major}</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight">Halo, ${student.name}!</h2>
            <p class="text-brand-100 text-xs sm:text-sm mt-1 max-w-xl">Selamat datang di Portal Peminjaman Laboratorium Komputer. Anda dapat meminjam laptop, router, switch, proyektor, dan toolkit praktikum.</p>
          </div>
          
          <div class="flex items-center gap-3">
            <a href="#katalog" class="px-5 py-3 bg-white text-brand-900 hover:bg-brand-50 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 hover:scale-105">
              <i data-lucide="plus-circle" class="w-4 h-4 text-brand-600"></i>
              <span>Pinjam Barang Sekarang</span>
            </a>
          </div>
        </div>
      </div>

      ${hasOverdue ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
          <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-600 shrink-0 mt-0.5"></i>
          <div>
            <h4 class="text-xs font-bold text-rose-900">Perhatian: Ada Barang Melewati Batas Waktu!</h4>
            <p class="text-xs text-rose-700 mt-0.5">Harap segera kembalikan peralatan ke petugas lab untuk menghindari akumulasi denda harian.</p>
          </div>
        </div>
      ` : ''}

      <!-- 3 Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Barang Sedang Dipinjam</span>
            <div class="text-2xl font-bold text-brand-600">${activeLoans.length} <span class="text-xs font-normal text-slate-400">Unit</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <i data-lucide="laptop" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Menunggu Konfirmasi</span>
            <div class="text-2xl font-bold text-amber-600">${pendingTxs.length} <span class="text-xs font-normal text-slate-400">Pengajuan</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <i data-lucide="hourglass" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-500 block mb-1">Riwayat Selesai</span>
            <div class="text-2xl font-bold text-emerald-600">${finishedTxs.length} <span class="text-xs font-normal text-slate-400">Transaksi</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Current Possessions Table -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-2 border-b">
          <div>
            <h3 class="text-sm font-bold text-slate-800">Barang yang Saat Ini Anda Bawa</h3>
            <p class="text-xs text-slate-400">Kembalikan tepat waktu sebelum tenggat</p>
          </div>
          <a href="#riwayat" class="text-xs font-semibold text-brand-600 hover:text-brand-800">Semua Riwayat &rarr;</a>
        </div>

        ${activeLoans.length === 0 ? `
          <div class="text-center py-8 text-slate-400 text-xs">
            <p>Anda tidak memiliki barang lab yang sedang dipinjam saat ini.</p>
            <a href="#katalog" class="inline-block mt-2 px-4 py-2 bg-brand-50 text-brand-700 font-semibold rounded-xl">Lihat Katalog Barang &rarr;</a>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b text-slate-500">
                <tr>
                  <th class="py-2.5 px-3">Barang Dipinjam</th>
                  <th class="py-2.5 px-3">Tgl Pinjam</th>
                  <th class="py-2.5 px-3">Tenggat Kembali</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3 text-right">Surat Bukti</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${activeLoans.map(tx => `
                  <tr>
                    <td class="py-3 px-3"><strong>${tx.itemName}</strong> <div class="text-[10px] text-slate-400 font-mono">${tx.qty} Unit</div></td>
                    <td class="py-3 px-3">${formatDate(tx.borrowDate)}</td>
                    <td class="py-3 px-3 font-bold ${tx.status === 'Terlambat' ? 'text-rose-600' : 'text-slate-700'}">${formatDate(tx.dueDate)}</td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">
                        ${tx.status}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right">
                      <button onclick="openBuktiModal('${tx.id}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1 ml-auto">
                        <i data-lucide="printer" class="w-3.5 h-3.5 text-brand-600"></i>
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

function renderSiswaKatalogView(container) {
  const items = window.labDB.getItems();
  const searchQuery = siswaState.searchQueries.katalog || '';
  const filterCategory = siswaState.filterCategories.katalog || 'Semua';

  const categories = ['Semua', 'Laptop', 'Multimedia', 'Jaringan', 'Toolkit', 'Komponen', 'Lainnya'];

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'Semua' || i.category === filterCategory;
    return matchSearch && matchCat;
  });

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-800">Katalog Barang Laboratorium</h3>
          <p class="text-xs text-slate-400">Pilih alat yang Anda butuhkan untuk pembelajaran atau praktikum</p>
        </div>
        <div class="relative w-full md:w-80">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            value="${searchQuery}" 
            placeholder="Cari laptop, mikrotik, proyektor..." 
            class="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            oninput="siswaState.searchQueries.katalog = this.value; renderSiswaKatalogView(document.getElementById('main-content')); lucide.createIcons();"
          >
        </div>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        ${categories.map(c => `
          <button 
            onclick="siswaState.filterCategories.katalog = '${c}'; renderSiswaKatalogView(document.getElementById('main-content')); lucide.createIcons();"
            class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }"
          >
            ${c}
          </button>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        ${filtered.map(item => {
          const isAvail = item.availableStock > 0;
          return `
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover-lift flex flex-col group">
              <div class="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` : `<i data-lucide="monitor" class="w-12 h-12 text-slate-300"></i>`}
                <span class="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-semibold uppercase">${item.category}</span>
                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${isAvail ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}">
                  ${isAvail ? `Tersedia (${item.availableStock})` : 'Stok Habis'}
                </span>
              </div>

              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                    <span>${item.code}</span>
                    <span class="text-emerald-700 bg-emerald-50 px-1.5 rounded font-medium">${item.condition}</span>
                  </div>
                  <h4 class="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors">${item.name}</h4>
                  <p class="text-xs text-slate-500 line-clamp-2 mb-3">${item.specification || 'Peralatan lab komputer.'}</p>
                </div>

                <div class="pt-3 border-t space-y-2.5">
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span class="truncate">${item.location || 'Laboratorium'}</span>
                  </div>
                  <button 
                    onclick="openAjukanModal('${item.id}')"
                    ${!isAvail ? 'disabled' : ''}
                    class="w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isAvail ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }"
                  >
                    <i data-lucide="${isAvail ? 'send' : 'lock'}" class="w-3.5 h-3.5"></i>
                    <span>${isAvail ? 'Ajukan Pinjam' : 'Stok Habis'}</span>
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

function renderSiswaRiwayatView(container) {
  const student = window.labDB.getStudentById(siswaState.activeStudentId) || window.labDB.getStudents()[0];
  const txs = window.labDB.getTransactions().filter(t => t.studentId === student.id);

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">Riwayat Pengajuan & Peminjaman</h3>
          <p class="text-xs text-slate-400">Akun Siswa: <strong>${student.name} (${student.grade} - ${student.nis})</strong></p>
        </div>
        <a href="#katalog" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Pinjam Baru</span>
        </a>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b text-slate-500 uppercase font-semibold">
              <tr>
                <th class="py-3 px-4">No. Transaksi</th>
                <th class="py-3 px-4">Barang</th>
                <th class="py-3 px-4">Pinjam - Tenggat</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Kondisi / Denda</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${txs.length === 0 ? `
                <tr><td colspan="6" class="py-10 text-center text-slate-400">Belum ada riwayat transaksi.</td></tr>
              ` : txs.map(t => `
                <tr class="hover:bg-slate-50">
                  <td class="py-3.5 px-4 font-mono font-bold">${t.id}</td>
                  <td class="py-3.5 px-4"><strong>${t.itemName}</strong> <span class="text-slate-400">(${t.qty} Unit)</span></td>
                  <td class="py-3.5 px-4">${formatDate(t.borrowDate)} &rarr; ${formatDate(t.dueDate)}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Dipinjam' ? 'bg-blue-100 text-blue-700' :
                      t.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'Menunggu Konfirmasi' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      t.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                    }">${t.status}</span>
                  </td>
                  <td class="py-3.5 px-4">
                    ${t.status === 'Dikembalikan' ? `Kondisi: <strong>${t.returnCondition}</strong>` : (t.status === 'Terlambat' ? `<span class="text-rose-600 font-bold">Denda: Rp ${formatRupiah(t.fineAmount)}</span>` : '-')}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    ${t.status === 'Menunggu Konfirmasi' ? `
                      <button onclick="batalPengajuan('${t.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold">Batalkan</button>
                    ` : ''}
                    ${t.status === 'Dipinjam' || t.status === 'Dikembalikan' ? `
                      <button onclick="openBuktiModal('${t.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1">
                        <i data-lucide="printer" class="w-3.5 h-3.5 text-indigo-600"></i>
                        <span>Bukti</span>
                      </button>
                    ` : ''}
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

function openAjukanModal(preselectedItemId = null) {
  const items = window.labDB.getItems();
  const student = window.labDB.getStudentById(siswaState.activeStudentId);

  document.getElementById('form-pinjam').reset();
  const todayStr = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 3);

  document.getElementById('pinjam-tanggal').value = todayStr;
  document.getElementById('pinjam-tenggat').value = future.toISOString().slice(0, 10);
  document.getElementById('pinjam-student-name').textContent = student ? `${student.name} (${student.grade})` : 'Siswa';

  const select = document.getElementById('pinjam-barang-id');
  select.innerHTML = items.map(i => `
    <option value="${i.id}" ${i.availableStock <= 0 ? 'disabled' : ''} ${i.id === preselectedItemId ? 'selected' : ''}>
      ${i.name} [Stok: ${i.availableStock}]
    </option>
  `).join('');

  openModal('modal-pinjam');
}

function batalPengajuan(txId) {
  if (confirm('Yakin ingin membatalkan permohonan pinjam ini?')) {
    const txs = window.labDB.getTransactions().filter(t => t.id !== txId);
    window.labDB.saveTransactions(txs);
    showSiswaToast('Pengajuan pinjaman berhasil dibatalkan', 'info');
    renderSiswaView();
  }
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
  document.getElementById('slip-sign-officer').textContent = `( ${tx.officer || 'Petugas Lab'} )`;

  openModal('modal-bukti');
}

function printBuktiSlip() {
  document.body.classList.add('printing-slip');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-slip'), 1000);
}

function setupSiswaForms() {
  const formPinjam = document.getElementById('form-pinjam');
  if (formPinjam) {
    formPinjam.addEventListener('submit', (e) => {
      e.preventDefault();
      const student = window.labDB.getStudentById(siswaState.activeStudentId);
      const itemId = document.getElementById('pinjam-barang-id').value;
      const qty = parseInt(document.getElementById('pinjam-qty').value);
      const borrowDate = document.getElementById('pinjam-tanggal').value;
      const dueDate = document.getElementById('pinjam-tenggat').value;
      const purpose = document.getElementById('pinjam-keperluan').value.trim();

      const item = window.labDB.getItemById(itemId);
      if (!item || item.availableStock < qty) {
        showSiswaToast('Stok tidak mencukupi', 'error');
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
        status: 'Menunggu Konfirmasi',
        returnCondition: '-',
        fineAmount: 0,
        officer: '-',
        notes: 'Pengajuan mandiri oleh siswa melalui Portal Siswa'
      });

      closeModal('modal-pinjam');
      showSiswaToast('Pengajuan peminjaman berhasil dikirim! Menunggu validasi petugas lab.', 'success');
      window.location.hash = '#riwayat';
    });
  }
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

function showSiswaToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3 shadow-xl';
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'} flex items-center justify-center shrink-0">
      <i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}" class="w-4 h-4"></i>
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
