/**
 * SIMPEL-LAB Authentication & Session Management
 * Handles Login, Register, Session Storage, and Role Route Guarding
 */

const AUTH_STORAGE_KEY = 'SIMPEL_LAB_USERS_V1';
const SESSION_STORAGE_KEY = 'SIMPEL_LAB_SESSION_V1';

const DEFAULT_USERS = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'admin123',
    name: 'Budi Santoso, S.Kom',
    role: 'admin',
    refId: 'STF-001'
  },
  {
    id: 'USR-002',
    username: 'petugas',
    password: 'petugas123',
    name: 'Dian Safitri, A.Md',
    role: 'petugas',
    refId: 'STF-002'
  },
  {
    id: 'USR-003',
    username: '20241001',
    password: 'siswa123',
    name: 'Naufal Martino Adistama',
    role: 'siswa',
    refId: 'SIS-001',
    nis: '20241001'
  },
  {
    id: 'USR-004',
    username: '20241002',
    password: 'siswa123',
    name: 'Ahmad Fauzi',
    role: 'siswa',
    refId: 'SIS-002',
    nis: '20241002'
  },
  {
    id: 'USR-005',
    username: '20241003',
    password: 'siswa123',
    name: 'Siti Nurhaliza',
    role: 'siswa',
    refId: 'SIS-003',
    nis: '20241003'
  }
];

class AuthService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
  }

  saveUsers(users) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  }

  login(identifier, password) {
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();

    const users = this.getUsers();
    const user = users.find(u => 
      (u.username.toLowerCase() === cleanId || (u.nis && u.nis === cleanId)) &&
      u.password === cleanPass
    );

    if (user) {
      const sessionData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        refId: user.refId,
        nis: user.nis || null,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      
      // Also sync active role in lab storage
      localStorage.setItem('SIMPEL_LAB_ACTIVE_ROLE', user.role);
      if (user.role === 'siswa' && user.refId) {
        localStorage.setItem('SIMPEL_LAB_ACTIVE_STUDENT', user.refId);
      }

      if (window.labDB) {
        window.labDB.logActivity(`Pengguna ${user.name} berhasil masuk sebagai ${user.role.toUpperCase()}`, 'login');
      }

      return { success: true, user: sessionData };
    }

    return { success: false, message: 'Username / NIS atau Password salah!' };
  }

  registerStudent(formData) {
    const { nis, name, grade, major, phone, password } = formData;

    const users = this.getUsers();
    // Check if NIS or username already exists
    if (users.some(u => u.username === nis || (u.nis && u.nis === nis))) {
      return { success: false, message: `NIS ${nis} sudah terdaftar dalam sistem!` };
    }

    // 1. Add to Students database in labDB
    let newStudentId = `SIS-${Date.now().toString().slice(-4)}`;
    if (window.labDB) {
      const newStudent = window.labDB.addStudent({
        id: newStudentId,
        nis: nis,
        name: name,
        grade: grade,
        major: major,
        phone: phone,
        email: `${nis}@smk.sch.id`,
        status: 'Aktif',
        joinDate: new Date().toISOString().slice(0, 10)
      });
      newStudentId = newStudent.id;
    }

    // 2. Add to Auth Users list
    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: nis,
      password: password,
      name: name,
      role: 'siswa',
      refId: newStudentId,
      nis: nis
    };
    users.push(newUser);
    this.saveUsers(users);

    return { success: true, message: 'Registrasi berhasil! Silakan login menggunakan NIS Anda.', user: newUser };
  }

  getSession() {
    try {
      const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return this.getSession() !== null;
  }

  logout(redirectUrl = 'login.html') {
    const session = this.getSession();
    if (session && window.labDB) {
      window.labDB.logActivity(`Pengguna ${session.name} keluar dari sistem`, 'logout');
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.href = redirectUrl;
  }

  /**
   * Route Guard: Ensure user has valid session and role
   */
  requireRole(expectedRole, loginPath = '../login.html') {
    const session = this.getSession();
    if (!session) {
      window.location.href = `${loginPath}?message=Silakan login terlebih dahulu`;
      return false;
    }

    if (session.role !== expectedRole) {
      alert(`Akses ditolak! Halaman ini khusus untuk ${expectedRole.toUpperCase()}. Anda masuk sebagai ${session.role.toUpperCase()}.`);
      // Redirect to user's rightful dashboard
      if (session.role === 'admin') window.location.href = '../admin/index.html';
      else if (session.role === 'petugas') window.location.href = '../petugas/index.html';
      else window.location.href = '../siswa/index.html';
      return false;
    }

    return true;
  }

  /**
   * Quick 1-Click Login for Demo & Testing
   */
  quickLogin(role, customRefId = null) {
    const users = this.getUsers();
    let user;

    if (role === 'admin') {
      user = users.find(u => u.role === 'admin');
    } else if (role === 'petugas') {
      user = users.find(u => u.role === 'petugas');
    } else {
      if (customRefId) {
        user = users.find(u => u.refId === customRefId);
      }
      if (!user) {
        user = users.find(u => u.role === 'siswa');
      }
    }

    if (user) {
      return this.login(user.username, user.password);
    }
    return { success: false, message: 'Akun demo tidak ditemukan.' };
  }
}

// Global Auth Instance
window.authService = new AuthService();
