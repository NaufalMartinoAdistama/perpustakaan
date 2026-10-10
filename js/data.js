/**
 * Data Storage & Dummy Seeder for Sistem Peminjaman Barang Laboratorium Komputer
 * Client-Side Persistence with LocalStorage
 */

const STORAGE_KEYS = {
  ITEMS: 'SIMPEL_LAB_ITEMS_V1',
  STUDENTS: 'SIMPEL_LAB_STUDENTS_V1',
  STAFF: 'SIMPEL_LAB_STAFF_V1',
  TRANSACTIONS: 'SIMPEL_LAB_TRANSACTIONS_V1',
  LOGS: 'SIMPEL_LAB_LOGS_V1',
  AUTH: 'SIMPEL_LAB_AUTH_V1'
};

// Default Dummy Data
const DEFAULT_ITEMS = [
  {
    id: 'BRG-001',
    code: 'BRG-001',
    name: 'Laptop ASUS ROG',
    category: 'Laptop',
    totalStock: 5,
    availableStock: 5,
    condition: 'Sangat Baik',
    status: 'Tersedia',
    location: 'Lemari A1 - Lab RPL',
    specification: 'AMD Ryzen 7, RAM 16GB, RTX 3050, SSD 512GB, Windows 11',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-002',
    code: 'BRG-002',
    name: 'Laptop Dell Latitude',
    category: 'Laptop',
    totalStock: 10,
    availableStock: 9, // 1 dipinjam oleh Ahmad Fauzi
    condition: 'Baik',
    status: 'Tersedia',
    location: 'Lemari A2 - Lab RPL',
    specification: 'Intel Core i5 Gen 11, RAM 8GB, SSD 256GB, Layar 14 inch FHD',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-003',
    code: 'BRG-003',
    name: 'Proyektor Epson',
    category: 'Multimedia',
    totalStock: 3,
    availableStock: 3, // 1 sedang menunggu konfirmasi
    condition: 'Baik',
    status: 'Tersedia',
    location: 'Meja Operator - Lab Multimedia',
    specification: '3300 Lumens, Resolusi WXGA, HDMI / VGA Input, Kabel 5 Meter',
    image: 'https://images.unsplash.com/photo-1517697471339-4aa32003c11a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-004',
    code: 'BRG-004',
    name: 'Switch TP-Link 16 Port',
    category: 'Jaringan',
    totalStock: 4,
    availableStock: 4,
    condition: 'Baik',
    status: 'Tersedia',
    location: 'Rak Server Utama - Lab TKJ',
    specification: '16 Port Gigabit 10/100/1000Mbps, Rackmount Steel Case',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-005',
    code: 'BRG-005',
    name: 'Router Mikrotik',
    category: 'Jaringan',
    totalStock: 8,
    availableStock: 8,
    condition: 'Sangat Baik',
    status: 'Tersedia',
    location: 'Laci Perangkat Jaringan - Lab TKJ',
    specification: 'Routerboard RB951Ui-2HnD, 5 Port LAN, Wireless 2.4GHz High Power',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-006',
    code: 'BRG-006',
    name: 'Tang Crimp',
    category: 'Toolkit',
    totalStock: 15,
    availableStock: 14, // 1 dipinjam oleh Rian Pratama (terlambat)
    condition: 'Baik',
    status: 'Tersedia',
    location: 'Kotak Perkakas 1 - Lab TKJ',
    specification: 'Crimping Tool RJ45 / RJ11 dengan Pemotong & Pengupas Kabel',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-007',
    code: 'BRG-007',
    name: 'LAN Cable Tester RJ45/RJ11',
    category: 'Toolkit',
    totalStock: 10,
    availableStock: 10,
    condition: 'Baik',
    status: 'Tersedia',
    location: 'Kotak Perkakas 2 - Lab TKJ',
    specification: 'Cable Continuity Tester LED Indicator, Baterai 9V',
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'BRG-008',
    code: 'BRG-008',
    name: 'Arduino Uno R3 Kit',
    category: 'Komponen',
    totalStock: 12,
    availableStock: 12,
    condition: 'Sangat Baik',
    status: 'Tersedia',
    location: 'Kotak Sensor & IoT - Lab RPL',
    specification: 'Microcontroller ATmega328P + Breadboard + Jumper Wires + Sensor Kit',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500&auto=format&fit=crop&q=60'
  }
];

const DEFAULT_STUDENTS = [
  {
    id: 'SIS-001',
    nis: '20241001',
    name: 'Naufal Martino Adistama',
    grade: 'XII RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    phone: '0812-3456-7890',
    email: 'naufal.martino@smk.sch.id',
    status: 'Aktif',
    joinDate: '2024-07-15'
  },
  {
    id: 'SIS-002',
    nis: '20241002',
    name: 'Ahmad Fauzi',
    grade: 'XII RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    phone: '0823-4567-8901',
    email: 'ahmad.fauzi@smk.sch.id',
    status: 'Aktif',
    joinDate: '2024-07-15'
  },
  {
    id: 'SIS-003',
    nis: '20241003',
    name: 'Siti Nurhaliza',
    grade: 'XII RPL 2',
    major: 'Rekayasa Perangkat Lunak',
    phone: '0834-5678-9012',
    email: 'siti.nurhaliza@smk.sch.id',
    status: 'Aktif',
    joinDate: '2024-07-15'
  },
  {
    id: 'SIS-004',
    nis: '20241004',
    name: 'Rian Pratama',
    grade: 'XII TKJ 1',
    major: 'Teknik Komputer & Jaringan',
    phone: '0856-7890-1234',
    email: 'rian.pratama@smk.sch.id',
    status: 'Aktif',
    joinDate: '2024-07-15'
  }
];

const DEFAULT_STAFF = [
  {
    id: 'STF-001',
    nip: '198507122010011002',
    name: 'Budi Santoso, S.Kom',
    role: 'Kepala Lab Komputer',
    shift: 'Pagi (07.00 - 15.00)',
    phone: '0811-2233-4455',
    email: 'budi.santoso@smk.sch.id',
    status: 'Aktif'
  },
  {
    id: 'STF-002',
    nip: '199203152015022001',
    name: 'Dian Safitri, A.Md',
    role: 'Petugas / Teknisi Lab',
    shift: 'Siang (10.00 - 17.00)',
    phone: '0812-9988-7766',
    email: 'dian.safitri@smk.sch.id',
    status: 'Aktif'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TRX-20261002-001',
    studentId: 'SIS-002',
    studentNis: '20241002',
    studentName: 'Ahmad Fauzi',
    studentClass: 'XII RPL 1',
    studentPhone: '0823-4567-8901',
    itemId: 'BRG-002',
    itemCode: 'BRG-002',
    itemName: 'Laptop Dell Latitude',
    itemCategory: 'Laptop',
    qty: 1,
    borrowDate: '2026-10-02',
    dueDate: '2026-10-06',
    returnDate: null,
    purpose: 'Pengerjaan Uji Kompetensi Keahlian (UKK) Web Development',
    status: 'Dipinjam', // Dipinjam
    returnCondition: '-',
    fineAmount: 0,
    officer: 'Budi Santoso, S.Kom',
    createdAt: '2026-10-02 08:30:00',
    notes: 'Kondisi awal lengkap dengan charger dan mouse pad'
  },
  {
    id: 'TRX-20260928-002',
    studentId: 'SIS-001',
    studentNis: '20241001',
    studentName: 'Naufal Martino Adistama',
    studentClass: 'XII RPL 1',
    studentPhone: '0812-3456-7890',
    itemId: 'BRG-005',
    itemCode: 'BRG-005',
    itemName: 'Router Mikrotik',
    itemCategory: 'Jaringan',
    qty: 1,
    borrowDate: '2026-09-28',
    dueDate: '2026-10-01',
    returnDate: '2026-10-01',
    purpose: 'Simulasi Routing Dinamis OSPF praktikum jaringan',
    status: 'Dikembalikan', // Dikembalikan
    returnCondition: 'Bagus',
    fineAmount: 0,
    officer: 'Dian Safitri, A.Md',
    createdAt: '2026-09-28 09:15:00',
    notes: 'Dikembalikan tepat waktu, port dan adaptor berfungsi normal'
  },
  {
    id: 'TRX-20261004-003',
    studentId: 'SIS-003',
    studentNis: '20241003',
    studentName: 'Siti Nurhaliza',
    studentClass: 'XII RPL 2',
    studentPhone: '0834-5678-9012',
    itemId: 'BRG-003',
    itemCode: 'BRG-003',
    itemName: 'Proyektor Epson',
    itemCategory: 'Multimedia',
    qty: 1,
    borrowDate: '2026-10-04',
    dueDate: '2026-10-05',
    returnDate: null,
    purpose: 'Presentasi Proyek Akhir Kelompok di Ruang Teori RPL',
    status: 'Menunggu Konfirmasi', // Menunggu Konfirmasi
    returnCondition: '-',
    fineAmount: 0,
    officer: '-',
    createdAt: '2026-10-04 10:10:00',
    notes: 'Pengajuan mandiri via portal siswa'
  },
  {
    id: 'TRX-20260925-004',
    studentId: 'SIS-004',
    studentNis: '20241004',
    studentName: 'Rian Pratama',
    studentClass: 'XII TKJ 1',
    studentPhone: '0856-7890-1234',
    itemId: 'BRG-006',
    itemCode: 'BRG-006',
    itemName: 'Tang Crimp',
    itemCategory: 'Toolkit',
    qty: 1,
    borrowDate: '2026-09-25',
    dueDate: '2026-09-30',
    returnDate: null,
    purpose: 'Praktikum Pengkabelan UTP Cross & Straight',
    status: 'Terlambat', // Terlambat
    returnCondition: '-',
    fineAmount: 8000, // 4 hari terlambat x Rp 2.000
    officer: 'Budi Santoso, S.Kom',
    createdAt: '2026-09-25 11:00:00',
    notes: 'Peringatan keterlambatan telah dikirim via WhatsApp'
  }
];

const DEFAULT_LOGS = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-04 10:10:00',
    user: 'Siti Nurhaliza (Siswa)',
    role: 'Siswa',
    action: 'Mengajukan peminjaman Proyektor Epson (1 Unit)',
    type: 'request'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-10-02 08:30:00',
    user: 'Budi Santoso, S.Kom',
    role: 'Admin',
    action: 'Menyetujui peminjaman Laptop Dell Latitude untuk Ahmad Fauzi',
    type: 'approve'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-10-01 14:20:00',
    user: 'Dian Safitri, A.Md',
    role: 'Petugas Lab',
    action: 'Memverifikasi pengembalian Router Mikrotik dari Naufal Martino (Kondisi: Bagus)',
    type: 'return'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-09-30 16:00:00',
    user: 'Sistem Otomatis',
    role: 'System',
    action: 'Mendeteksi transaksi TRX-20260925-004 melewati batas jatuh tempo (Terlambat)',
    type: 'alert'
  }
];

class LabStorage {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(DEFAULT_STAFF));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
  }

  // --- Items ---
  getItems() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
  }

  saveItems(items) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }

  getItemById(id) {
    return this.getItems().find(item => item.id === id || item.code === id);
  }

  addItem(item) {
    const items = this.getItems();
    items.unshift(item);
    this.saveItems(items);
    this.logActivity(`Menambahkan barang baru: ${item.name} (${item.code})`, 'create');
    return item;
  }

  updateItem(id, updatedFields) {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id || i.code === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedFields };
      this.saveItems(items);
      this.logActivity(`Memperbarui data barang: ${items[index].name}`, 'update');
      return items[index];
    }
    return null;
  }

  deleteItem(id) {
    const items = this.getItems();
    const item = items.find(i => i.id === id);
    const filtered = items.filter(i => i.id !== id);
    this.saveItems(filtered);
    if (item) {
      this.logActivity(`Menghapus data barang: ${item.name}`, 'delete');
    }
    return true;
  }

  // --- Students ---
  getStudents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  getStudentById(id) {
    return this.getStudents().find(s => s.id === id || s.nis === id);
  }

  addStudent(student) {
    const students = this.getStudents();
    students.unshift(student);
    this.saveStudents(students);
    this.logActivity(`Menambahkan siswa baru: ${student.name} (${student.nis})`, 'create');
    return student;
  }

  updateStudent(id, updatedFields) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students[index] = { ...students[index], ...updatedFields };
      this.saveStudents(students);
      this.logActivity(`Memperbarui data siswa: ${students[index].name}`, 'update');
      return students[index];
    }
    return null;
  }

  deleteStudent(id) {
    const students = this.getStudents();
    const student = students.find(s => s.id === id);
    const filtered = students.filter(s => s.id !== id);
    this.saveStudents(filtered);
    if (student) {
      this.logActivity(`Menghapus data siswa: ${student.name}`, 'delete');
    }
    return true;
  }

  // --- Staff ---
  getStaff() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
  }

  saveStaff(staff) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }

  addStaff(staffMember) {
    const staff = this.getStaff();
    staff.unshift(staffMember);
    this.saveStaff(staff);
    this.logActivity(`Menambahkan akun petugas: ${staffMember.name}`, 'create');
    return staffMember;
  }

  updateStaff(id, updatedFields) {
    const staff = this.getStaff();
    const index = staff.findIndex(s => s.id === id);
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updatedFields };
      this.saveStaff(staff);
      this.logActivity(`Memperbarui data petugas: ${staff[index].name}`, 'update');
      return staff[index];
    }
    return null;
  }

  deleteStaff(id) {
    const staff = this.getStaff();
    const target = staff.find(s => s.id === id);
    const filtered = staff.filter(s => s.id !== id);
    this.saveStaff(filtered);
    if (target) {
      this.logActivity(`Menghapus data petugas: ${target.name}`, 'delete');
    }
    return true;
  }

  // --- Transactions ---
  getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  }

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  getTransactionById(id) {
    return this.getTransactions().find(t => t.id === id);
  }

  createTransaction(transactionData) {
    const transactions = this.getTransactions();
    const newTx = {
      ...transactionData,
      id: transactionData.id || `TRX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toLocaleString('id-ID')
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    // If status is immediately 'Dipinjam', decrement available stock
    if (newTx.status === 'Dipinjam') {
      const item = this.getItemById(newTx.itemId);
      if (item && item.availableStock >= newTx.qty) {
        this.updateItem(item.id, {
          availableStock: Math.max(0, item.availableStock - newTx.qty),
          status: (item.availableStock - newTx.qty) <= 0 ? 'Habis' : 'Tersedia'
        });
      }
    }

    this.logActivity(`Transaksi baru: ${newTx.studentName} meminjam ${newTx.itemName} (${newTx.status})`, 'transaction');
    return newTx;
  }

  updateTransaction(id, updatedFields) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldTx = transactions[index];
      const newTx = { ...oldTx, ...updatedFields };
      transactions[index] = newTx;
      this.saveTransactions(transactions);
      return newTx;
    }
    return null;
  }

  approveLoan(id, officerName = 'Petugas Lab') {
    const tx = this.getTransactionById(id);
    if (!tx) return false;

    const item = this.getItemById(tx.itemId);
    if (!item) return false;

    if (item.availableStock < tx.qty) {
      return { success: false, message: `Stok barang ${item.name} tidak mencukupi (Tersisa: ${item.availableStock})` };
    }

    // Decrement stock
    this.updateItem(item.id, {
      availableStock: Math.max(0, item.availableStock - tx.qty),
      status: (item.availableStock - tx.qty) <= 0 ? 'Habis' : 'Tersedia'
    });

    // Update transaction
    this.updateTransaction(id, {
      status: 'Dipinjam',
      officer: officerName
    });

    this.logActivity(`${officerName} menyetujui peminjaman ${tx.itemName} untuk ${tx.studentName}`, 'approve');
    return { success: true };
  }

  rejectLoan(id, reason = 'Stok tidak mencukupi atau jadwal bentrok') {
    const tx = this.getTransactionById(id);
    if (!tx) return false;

    this.updateTransaction(id, {
      status: 'Ditolak',
      notes: (tx.notes ? tx.notes + ' | ' : '') + `Alasan Penolakan: ${reason}`
    });

    this.logActivity(`Peminjaman ${tx.itemName} oleh ${tx.studentName} ditolak (${reason})`, 'reject');
    return { success: true };
  }

  processReturn(id, returnData) {
    const { returnCondition, fineAmount, notes, officerName } = returnData;
    const tx = this.getTransactionById(id);
    if (!tx) return false;

    const returnDate = new Date().toISOString().slice(0, 10);
    const item = this.getItemById(tx.itemId);

    if (item) {
      // Restore stock
      const newStock = Math.min(item.totalStock, item.availableStock + tx.qty);
      const updatedCondition = returnCondition === 'Rusak Berat' ? 'Rusak' : (returnCondition === 'Rusak Ringan' ? 'Perlu Perbaikan' : item.condition);
      this.updateItem(item.id, {
        availableStock: newStock,
        condition: updatedCondition,
        status: newStock > 0 ? 'Tersedia' : item.status
      });
    }

    this.updateTransaction(id, {
      status: 'Dikembalikan',
      returnDate: returnDate,
      returnCondition: returnCondition,
      fineAmount: Number(fineAmount) || 0,
      notes: notes || tx.notes,
      officer: officerName || tx.officer
    });

    this.logActivity(`Pengembalian barang ${tx.itemName} oleh ${tx.studentName} selesai (Kondisi: ${returnCondition})`, 'return');
    return { success: true };
  }

  // --- Logs ---
  getLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  }

  logActivity(action, type = 'info') {
    const logs = this.getLogs();
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{"name":"Admin Lab","role":"Admin"}');
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      user: currentUser.name || 'Sistem',
      role: currentUser.role || 'Admin',
      action: action,
      type: type
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop(); // keep last 50 logs
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // --- Statistics helper ---
  getDashboardStats() {
    const items = this.getItems();
    const students = this.getStudents();
    const transactions = this.getTransactions();

    const totalItems = items.reduce((acc, curr) => acc + Number(curr.totalStock), 0);
    const totalAvailable = items.reduce((acc, curr) => acc + Number(curr.availableStock), 0);
    const totalBorrowed = totalItems - totalAvailable;

    const pendingRequests = transactions.filter(t => t.status === 'Menunggu Konfirmasi').length;
    const activeLoans = transactions.filter(t => t.status === 'Dipinjam').length;
    const overdueLoans = transactions.filter(t => t.status === 'Terlambat').length;
    const completedLoans = transactions.filter(t => t.status === 'Dikembalikan').length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLoans = transactions.filter(t => t.borrowDate === todayStr).length;

    return {
      totalItems,
      totalAvailable,
      totalBorrowed,
      activeStudents: students.length,
      pendingRequests,
      activeLoans,
      overdueLoans,
      completedLoans,
      todayLoans,
      totalTransactions: transactions.length
    };
  }
}

// Global instance
window.labDB = new LabStorage();

// Defensive Safeguards for Excel (.xlsx) and PDF (.pdf) Export
(function() {
  window.exportReportToExcelFallback = function() {
    if (typeof window.exportReportToExcel === 'function' && window.exportReportToExcel !== window.exportReportToExcelFallback) {
      return window.exportReportToExcel();
    }
    const transactions = window.labDB ? window.labDB.getTransactions() : [];
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }
    if (typeof XLSX === 'undefined') {
      alert('Modul Excel (SheetJS) sedang dimuat...');
      return;
    }
    const sheetData = transactions.map((t, idx) => ({
      'No': idx + 1,
      'ID Transaksi': t.id,
      'NIS': t.studentNis,
      'Nama Siswa': t.studentName,
      'Kelas': t.studentClass || '-',
      'Barang Lab': t.itemName,
      'Qty': t.qty || 1,
      'Tgl Pinjam': t.borrowDate,
      'Tenggat': t.dueDate,
      'Tgl Kembali': t.returnDate || '-',
      'Denda (Rp)': Number(t.fineAmount) || 0,
      'Status': t.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `Laporan_SIMPEL_LAB_${new Date().toISOString().slice(0, 10)}.xlsx`, { bookType: 'xlsx', type: 'binary' });
  };

  // Intercept exportToCSV so CSV is NEVER downloaded
  window.exportToCSV = function() {
    if (typeof window.exportReportToExcel === 'function' && window.exportReportToExcel !== window.exportToCSV) {
      return window.exportReportToExcel();
    }
    return window.exportReportToExcelFallback();
  };

  // DOM auto-enhancer: if any legacy "Export CSV" button renders, transform it to Excel (.xlsx) and add PDF (.pdf)
  function upgradeLegacyExportButtons() {
    const csvButtons = document.querySelectorAll('button[onclick*="exportToCSV"]');
    csvButtons.forEach(btn => {
      btn.setAttribute('onclick', 'exportReportToExcel()');
      btn.className = 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shadow-emerald-600/20 active:scale-95';
      btn.innerHTML = `<i data-lucide="file-spreadsheet" class="w-4 h-4"></i><span>Export Excel (.xlsx)</span>`;
      
      if (btn.parentElement && !btn.parentElement.querySelector('button[onclick*="exportReportToPDF"]')) {
        const pdfBtn = document.createElement('button');
        pdfBtn.setAttribute('onclick', 'exportReportToPDF()');
        pdfBtn.className = 'px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shadow-rose-600/20 active:scale-95';
        pdfBtn.innerHTML = `<i data-lucide="file-text" class="w-4 h-4"></i><span>Export PDF (.pdf)</span>`;
        btn.insertAdjacentElement('afterend', pdfBtn);
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  function setupObserver() {
    upgradeLegacyExportButtons();
    if (typeof MutationObserver !== 'undefined' && document.body) {
      const observer = new MutationObserver(upgradeLegacyExportButtons);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
})();
