// API Configuration
const API_STUDENTS = 'http://127.0.0.1:5001/api/students';
const API_COURSES = 'http://127.0.0.1:5002/api/courses';
const API_GRADES = 'http://127.0.0.1:5003/api/grades';
const API_IDENTITY = 'http://127.0.0.1:5004/api/login';
const API_USERS = 'http://127.0.0.1:5004/api/users';
const API_ENROLLMENTS_SVC = 'http://127.0.0.1:5006/api/enrollments';
const API_FACULTIES = 'http://127.0.0.1:5007/api/faculties';
const API_SCHOOL_FACULTIES = 'http://127.0.0.1:5007/api/schools'; // For getting faculties of a school
const API_MAJORS = 'http://127.0.0.1:5009/api/majors'; // New Major Service
const API_UNIS = 'http://127.0.0.1:5008/api/unis'; // New Uni Service
const API_NOTIFICATIONS = 'http://127.0.0.1:5010/api/notifications';

// Data Storage
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let students = [];
let courses = [];
let grades = []; // This will hold enrollments
let faculties = [];
let majors = [];
let schools = []; // Store schools data
let editingStudentId = null;
let editingCourseId = null;
let editingGradeId = null;
let editingFacultyId = null;
let editingMajorId = null;
let editingSchoolId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    console.log("App initialized. Current user:", currentUser);
    
    // Load notification count initially
    loadNotifications();

    if (currentUser) {
        checkStudentProfileAndShow();
    } else {
        showLogin();
    }
    
    // Add Login Form Listener
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Add Register Form Listeners
    const regForm1 = document.getElementById('register-form-step-1');
    if (regForm1) {
        regForm1.addEventListener('submit', handleRegisterStep1);
    }
    const regForm2 = document.getElementById('register-form-step-2');
    if (regForm2) {
        regForm2.addEventListener('submit', handleRegisterStep2);
    }
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    showRegStep(1);
}

function showRegStep(step) {
    const step1 = document.getElementById('reg-step-1');
    const step2 = document.getElementById('reg-step-2');
    const title = document.getElementById('register-title');
    const backBtn = document.getElementById('reg-back-btn');
    
    if (step === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
        title.textContent = 'Đăng ký tài khoản (1/2)';
        if (backBtn) backBtn.style.display = 'block';
    } else {
        step1.style.display = 'none';
        step2.style.display = 'block';
        title.textContent = 'Thông tin cá nhân (2/2)';
        
        // Populate email from session if possible
        if (currentUser) {
            const emailField = document.getElementById('reg-gmail');
            if (emailField) emailField.value = currentUser.email || currentUser.user;
            if (backBtn) backBtn.style.display = 'none';
        }
    }
}

async function checkStudentProfileAndShow() {
    if (!currentUser) return showLogin();

    if (currentUser.role === 'Student') {
        try {
            const res = await fetch(`${API_STUDENTS}/${currentUser.user || currentUser.email}`);
            if (res.status === 404) {
                // Info missing! Show Step 2
                showToast('Vui lòng hoàn tất thông tin cá nhân', 'info');
                showRegStep(2);
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('register-screen').style.display = 'flex';
                document.getElementById('app-container').style.display = 'none';
                return;
            }
        } catch (e) {
            console.error("Profile check failed:", e);
        }
    }
    showApp();
}

function showApp() {
    if (!currentUser) return showLogin();
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    updateUserDisplayName();
    
    applyRolePermissions();
    
    loadStudents();
    loadCourses();
    loadGrades();
    loadFaculties();
    loadMajors();
    loadGeneralInfo();
    
    // Default page based on role
    if (currentUser.role === 'Admin') {
        showPage('general-info');
    } else if (currentUser.role === 'Faculty') {
        showPage('grades');
    } else {
        showPage('general-info-view');
    }
}

function updateUserDisplayName() {
    const userNameDisplay = document.getElementById('display-user-name');
    if (userNameDisplay && currentUser) {
        // Find name from students list if it's a student
        let displayName = currentUser.user;
        if (currentUser.role === 'Student' && students.length > 0) {
            const student = students.find(s => String(s.id) === String(currentUser.user) || s.email === (currentUser.email || currentUser.user));
            if (student) {
                displayName = student.name;
                // Update the user identifier to actual Student ID for DB queries if it was an email
                if (String(currentUser.user) !== String(student.id)) {
                    console.log("Syncing currentUser.user from email to student ID:", student.id);
                    currentUser.user = student.id;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
        }
        userNameDisplay.textContent = `${displayName || 'Unknown'} (${currentUser.role || 'No Role'})`;
    }
}

function getCurrentStudentId() {
    if (!currentUser) return null;
    if (currentUser.role !== 'Student') return currentUser.user;
    
    // If students list is loaded, try to resolve email to ID
    if (students.length > 0) {
        const student = students.find(s => String(s.id) === String(currentUser.user) || s.email === (currentUser.email || currentUser.user));
        if (student) return student.id;
    }
    return currentUser.user;
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log("Attempting login for:", username);

    try {
        const res = await fetch(API_IDENTITY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Login success:", data);
            currentUser = data;
            
            localStorage.setItem('user', JSON.stringify(data));
            showToast('Đăng nhập thành công');
            checkStudentProfileAndShow();
        } else {
            const errData = await res.json();
            console.error("Login failed:", errData);
            showToast('Đăng nhập thất bại', 'error');
        }
    } catch (err) {
        console.error("Connection error:", err);
        showToast('Đăng nhập thất bại', 'error');
    }
}

async function handleRegisterStep1(e) {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (password.length < 3) {
        showToast('Mật khẩu phải có ít nhất 3 ký tự', 'warning');
        return;
    }

    try {
        // 1. Create Identity User immediately
        const resUser = await fetch(API_USERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: email, 
                password: password, 
                email: email,
                role: 'Student' 
            })
        });

        if (!resUser.ok) {
            const err = await resUser.json();
            throw new Error(err.error || 'Email này đã được sử dụng hoặc có lỗi xảy ra');
        }

        showToast('Đăng ký tài khoản thành công! Mời bạn đăng nhập.');
        showLogin();
    } catch (err) {
        console.error("Step 1 error:", err);
        showToast(err.message, 'error');
    }
}

async function handleRegisterStep2(e) {
    e.preventDefault();
    
    if (!currentUser) return showLogin();
    
    const email = currentUser.email || currentUser.user;
    
    // Data from Step 2
    const msv = document.getElementById('reg-msv').value.trim();
    const name = document.getElementById('reg-name').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const dob = document.getElementById('reg-dob').value;
    const cohort = document.getElementById('reg-cohort').value.trim();
    const studentClass = document.getElementById('reg-class').value.trim();

    try {
        // First, check if this MSV already exists to avoid duplicate error
        const checkMsv = await fetch(`${API_STUDENTS}/${msv}`);
        let method = 'POST';
        let url = API_STUDENTS;

        if (checkMsv.ok) {
            const existingData = await checkMsv.json();
            // If MSV exists and is linked to another email
            if (existingData.student_email && existingData.student_email !== email) {
                throw new Error('Mã sinh viên này đã được đăng ký bởi tài khoản khác!');
            }
            // If it matches or is empty, we update instead
            method = 'PUT';
            url = `${API_STUDENTS}/${msv}`;
        }

        // 2. Create or Update Student Record
        const resStudent = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: msv, 
                student_name: name,
                student_email: email,
                gender: gender,
                date_of_birth: dob,
                cohort: cohort,
                student_class: studentClass
            })
        });

        if (!resStudent.ok) {
            const err = await resStudent.json();
            throw new Error(err.error || 'Lỗi khi lưu thông tin sinh viên');
        }

        showToast('Cập nhật thông tin thành công!');
        
        // Update local session with the new MSV as 'user' if needed
        // but identity service still knows them by email/orig username.
        // For convenience, let's refresh page or current user.
        
        // Sync the MSV back to the Identity Service users table so login via MSV works too?
        // Let's at least update the local current student ID.
        currentUser.user = msv; 
        localStorage.setItem('user', JSON.stringify(currentUser));

        // Clear forms
        document.getElementById('register-form-step-1').reset();
        document.getElementById('register-form-step-2').reset();
        
        showApp();
        
    } catch (err) {
        console.error("Registration Phase 2 error:", err);
        showToast(err.message, 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    showLogin();
}

function applyRolePermissions() {
    if (!currentUser || !currentUser.role) {
        console.warn("No user or role found for permissions");
        return;
    }
    const role = currentUser.role;
    
    // Hide all role-specific items
    document.querySelectorAll('.admin-only, .faculty-only, .student-only, .common-view, .admin-faculty-only').forEach(el => {
        el.style.display = 'none';
    });

    if (role === 'Admin') {
        document.querySelectorAll('.admin-only, .common-view, .admin-faculty-only').forEach(el => el.style.display = 'block');
    } else if (role === 'Faculty') {
        document.querySelectorAll('.faculty-only, .common-view, .admin-faculty-only').forEach(el => el.style.display = 'block');
    } else if (role === 'Student') {
        document.querySelectorAll('.student-only, .common-view').forEach(el => el.style.display = 'block');
    }
    
    // Also update visibility of action buttons in tables
    const tableActions = document.querySelectorAll('.action-btns');
    tableActions.forEach(el => {
        // This is tricky because tables are re-rendered. 
        // Better to handle this inside render functions.
    });
}

// Map roles to CSS classes for hiding/showing Edit/Delete buttons in tables
function getActionButtonsVisibilityClass() {
    return currentUser && currentUser.role === 'Admin' ? '' : 'style="display:none"';
}



// Toast Notification
let confirmCallback = null;

function showConfirm(title, message, callback) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOkBtn');

    if (modal && titleEl && msgEl && okBtn) {
        titleEl.textContent = title;
        msgEl.textContent = message;
        modal.style.display = 'block';
        confirmCallback = callback;
        
        okBtn.onclick = () => {
            closeConfirmModal(true);
        };
    }
}

function closeConfirmModal(result) {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
    
    if (result && confirmCallback) {
        confirmCallback();
    }
    confirmCallback = null;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    let className = "show";
    
    if (type === 'error') {
        className += " error";
    } else if (type === 'warning') {
        className += " warning";
    }
    
    toast.className = className;
    toast.textContent = message;
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

// Notifications
function toggleNotificationBox() {
    const box = document.getElementById('notification-box');
    if (box) {
        if (box.style.display === 'block') {
            box.style.display = 'none';
        } else {
            box.style.display = 'block';
            loadNotifications();
        }
    }
}

function loadNotifications() {
    if (!currentUser) return;
    
    // Notifications are primary for students
    const studentId = (currentUser.role === 'Student') ? getCurrentStudentId() : null;
    if (!studentId) {
        // If not a student, maybe they don't have personal notifications yet
        const badge = document.getElementById('unread-count');
        if (badge) badge.style.display = 'none';
        return;
    }

    const list = document.getElementById('notif-list');
    if (!list) return;

    fetch(`${API_NOTIFICATIONS}?student_id=${studentId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            if (data.length === 0) {
                list.innerHTML = `<p class="text-center-muted" style="padding: 20px;">Không có thông báo mới</p>`;
            } else {
                list.innerHTML = data.map(n => `
                    <div class="notif-item ${!n.is_read ? 'unread' : ''}" onclick="markNotifRead(${n.id})">
                        <div class="notif-item-title">${n.title}</div>
                        <div class="notif-item-desc">${n.message}</div>
                        <div class="notif-item-time">${formatDate(n.created_at)}</div>
                    </div>
                `).join('');
            }

            // Update count
            const unreadCount = data.filter(n => !n.is_read).length;
            const badge = document.getElementById('unread-count');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        })
        .catch(err => {
            console.error("Failed to load notifications:", err);
            list.innerHTML = `<p class="text-center-muted" style="padding: 20px; color: var(--danger);">Lỗi tải thông báo</p>`;
        });
}

function markNotifRead(id) {
    fetch(`${API_NOTIFICATIONS}/read/${id}`, { method: 'POST' })
        .then(() => loadNotifications())
        .catch(err => console.error("Error marking read:", err));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    // Check if event exists (called from button click) or manual call
    if (window.event && window.event.target) {
        // If the click was on the button directly
        if (window.event.target.classList.contains('nav-btn')) {
             window.event.target.classList.add('active');
        } else {
             const btn = document.querySelector(`button[onclick="showPage('${pageId}')"]`);
             if (btn) btn.classList.add('active');
        }
    } else {
         const btn = document.querySelector(`button[onclick="showPage('${pageId}')"]`);
         if (btn) btn.classList.add('active');
    }
    
    if (pageId === 'home') {
        updateDashboard();
    } else if (pageId === 'grades') {
        updateGradeSelects();
    } else if (pageId === 'enrollment') {
        loadEnrollmentData();
    } else if (pageId === 'student-grades') {
        loadStudentResults();
    }
}

// Dashboard Updates
function updateDashboard() {
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalCoursesEl = document.getElementById('totalCourses');
    const avgGradeEl = document.getElementById('avgGrade');

    if (totalStudentsEl) animateValue(totalStudentsEl, 0, students.length, 1000);
    if (totalCoursesEl) animateValue(totalCoursesEl, 0, courses.length, 1000);

    let avg = 0.0;
    if (grades.length > 0) {
        const validGrades = grades.filter(g => g.grade !== null && g.grade !== undefined);
        if (validGrades.length > 0) {
            const sum = validGrades.reduce((acc, g) => acc + parseFloat(g.grade), 0);
            avg = sum / validGrades.length;
        }
    }
    // Animate Average Grade
    if (avgGradeEl) avgGradeEl.textContent = avg.toFixed(2);
}

function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}


// --- STUDENT SERVICE ---

function calculateTotalCredits() {
    const theory = parseInt(document.getElementById('theoryCredits').value) || 0;
    const practical = parseInt(document.getElementById('practicalCredits').value) || 0;
    document.getElementById('courseCredits').value = theory + practical;
}

async function loadStudents() {
    try {
        const res = await fetch(API_STUDENTS);
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();
        
        // Fetch users to filter only those who have an account
        let registeredEmails = new Set();
        let registeredUsernames = new Set();
        try {
            const resUsers = await fetch(API_USERS);
            if (resUsers.ok) {
                const usersData = await resUsers.json();
                usersData.forEach(u => {
                    if (u.email) registeredEmails.add(u.email.toLowerCase());
                    if (u.username) registeredUsernames.add(u.username.toLowerCase());
                });
            }
        } catch (uErr) {
            console.warn("Could not fetch user list for filtering:", uErr);
        }

        // Map API data
        students = data.map(s => ({
            id: s.student_id,
            // Support both old and new keys for transition or if service rolls back
            name: s.student_name || s.name, 
            dob: s.date_of_birth || s.dob || '',
            gender: s.gender || '',
            className: s.student_class || s.class_name || '',
            email: s.student_email || s.email || '',
            cohort: s.cohort || ''
        }));
            
        renderStudents();
        updateDashboard();
        updateUserDisplayName();
    } catch (err) {
        console.error(err);
        // alert('Cannot connect to Student Service');
    }
}

async function addStudent() {
    const id = document.getElementById('studentId').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const dob = document.getElementById('studentDob').value;
    const gender = document.getElementById('studentGender').value;
    const className = document.getElementById('studentClass').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const cohort = document.getElementById('studentCohort').value.trim();
    
    if (!id || !name) {
        showToast('Vui lòng điền Mã sinh viên và Tên', 'warning');
        return;
    }

    const payload = { 
        student_id: id, 
        student_name: name,
        date_of_birth: dob,
        gender: gender,
        student_class: className,
        student_email: email,
        cohort: cohort
    };

    try {
        let res;
        if (editingStudentId) {
            // Update mode
            res = await fetch(`${API_STUDENTS}/${editingStudentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create mode
            // Check duplicate ID locally specifically for CREATE
            if (students.some(s => s.id === id)) {
                showToast('Mã sinh viên đã tồn tại');
                return;
            }
            res = await fetch(API_STUDENTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        if (!res.ok) {
            const err = await res.json();
            showToast('Lỗi: ' + (err.error || 'Unknown error'));
            return;
        }

        showToast(editingStudentId ? 'Cập nhật thành công' : 'Thêm sinh viên thành công');
        closeStudentModal();
        loadStudents();
    } catch (err) {
        showToast('Connection Error: ' + err.message);
    }
}

// Modal Logic
function openAddStudentModal() {
    editingStudentId = null;
    document.querySelector('#studentModal h2').textContent = 'Thêm sinh viên mới';
    document.querySelector('#studentModal .btn-primary').textContent = 'Lưu thông tin';
    document.getElementById('studentId').disabled = false;
    clearStudentForm();
    document.getElementById('studentModal').style.display = 'block';
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
    clearStudentForm();
    editingStudentId = null;
}

window.onclick = function(event) {
    const studentModal = document.getElementById('studentModal');
    const courseModal = document.getElementById('courseModal');
    const facultyModal = document.getElementById('facultyModal');
    const schoolModal = document.getElementById('schoolModal');
    const schoolDetailModal = document.getElementById('schoolDetailModal');
    const majorModal = document.getElementById('majorModal');
    const enrolledDetailsModal = document.getElementById('enrolledDetailsModal');
    
    if (event.target == studentModal) closeStudentModal();
    if (event.target == courseModal) closeCourseModal();
    if (event.target == facultyModal) closeFacultyModal();
    if (event.target == schoolModal) closeSchoolModal();
    if (event.target == schoolDetailModal) closeSchoolDetailModal();
    if (event.target == majorModal) closeMajorModal();
    if (event.target == enrolledDetailsModal) closeEnrolledDetailsModal();
}

async function deleteStudent(id) {
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa sinh viên này?', async () => {
        try {
            const res = await fetch(`${API_STUDENTS}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Xóa sinh viên thành công');
                loadStudents();
            } else {
                showToast('Xóa thất bại', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    });
}

function renderStudents(data = students) {
    const tbody = document.getElementById('studentTableBody');
    const header = document.getElementById('studentActionHeader');
    const isAdmin = currentUser && currentUser.role === 'Admin';

    if (header) {
        header.style.display = isAdmin ? 'table-cell' : 'none';
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 8 : 7}" class="text-center-muted">Chưa có dữ liệu </td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(s => {
        let dobDisplay = s.dob;
        if (s.dob) {
            const date = new Date(s.dob);
            if (!isNaN(date.getTime())) {
                dobDisplay = date.toLocaleDateString('vi-VN'); // dd/mm/yyyy
            }
        }
        return `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${s.gender}</td>
            <td>${dobDisplay}</td>
            <td>${s.className}</td>
            <td>${s.cohort}</td>
            ${isAdmin ? `
            <td class="action-btns">
                <button class="action-btn btn-secondary" onclick="editStudent('${s.id}')">Sửa</button>
                <button class="action-btn btn-danger" onclick="deleteStudent('${s.id}')">Xóa</button>
            </td>` : ''}
        </tr>
    `}).join('');
}

function clearStudentForm() {
    document.getElementById('studentId').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentDob').value = '';
    document.getElementById('studentGender').value = '';
    document.getElementById('studentCohort').value = '';
    document.getElementById('studentClass').value = '';
    document.getElementById('studentEmail').value = '';
}

function editStudent(id) {
    const s = students.find(st => st.id === id);
    if (!s) return;

    editingStudentId = id;
    document.querySelector('#studentModal h2').textContent = 'Cập nhật sinh viên';
    document.querySelector('#studentModal .btn-primary').textContent = 'Cập nhật';
    
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentId').disabled = true; // Cannot change ID
    document.getElementById('studentName').value = s.name;
    document.getElementById('studentDob').value = s.dob ? s.dob.split('T')[0] : '';
    document.getElementById('studentGender').value = s.gender;
    document.getElementById('studentClass').value = s.className;
    document.getElementById('studentEmail').value = s.email;
    document.getElementById('studentCohort').value = s.cohort;

    document.getElementById('studentModal').style.display = 'block';
}

function searchStudents() {
    const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnStudent').value;
    
    const filtered = students.filter(s => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);
        
        if (filterCol === 'all') {
            return matchesTerm(s.id) || matchesTerm(s.name) || matchesTerm(s.email) || matchesTerm(s.className);
        } else if (filterCol === 'id') {
            return matchesTerm(s.id);
        } else if (filterCol === 'name') {
            return matchesTerm(s.name);
        } else if (filterCol === 'class') {
            return matchesTerm(s.className);
        } else if (filterCol === 'email') {
            return matchesTerm(s.email);
        }
        return true;
    });
    
    renderStudents(filtered);
}

// --- COURSE SERVICE ---

async function loadCourses() {
    try {
        const res = await fetch(API_COURSES);
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        courses = data.map(c => ({
            id: c.course_id,
            name: c.course_name,
            credits: c.total_credits,
            theory: c.theory_credits || 0,
            practical: c.practical_credits || 0,
            prerequisite: c.prerequisite || '',
            coRequisite: c.co_requisite || '',
            previous: c.previous || ''
        }));
        renderCourses();
        updateDashboard();
        updateGradeSelects(); // Sync course filter dropdown
    } catch (err) {
        console.error(err);
    }
}

async function addCourse() {
    const id = document.getElementById('courseId').value.trim();
    const name = document.getElementById('courseName').value.trim();
    const credits = document.getElementById('courseCredits').value;
    const theory = document.getElementById('theoryCredits').value;
    const practical = document.getElementById('practicalCredits').value;
    const prerequisite = document.getElementById('prerequisite').value.trim();
    const coRequisite = document.getElementById('coRequisite').value.trim();
    const previous = document.getElementById('previousCourse').value.trim();

    if (!id || !name) {
        showToast('Vui lòng điền Mã học phần và Tên học phần', 'warning');
        return;
    }

    if (!editingCourseId && courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Tên học phần đã tồn tại! Vui lòng chọn tên khác.', 'warning');
        return;
    }

    const payload = {
        course_id: id,
        course_name: name,
        total_credits: credits ? parseInt(credits) : 0,
        theory_credits: theory ? parseInt(theory) : 0,
        practical_credits: practical ? parseInt(practical) : 0,
        prerequisite: prerequisite,
        co_requisite: coRequisite,
        previous: previous
    };

    try {
        let res;
        if (editingCourseId) {
             res = await fetch(`${API_COURSES}/${editingCourseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
             res = await fetch(API_COURSES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            showToast(editingCourseId ? 'Cập nhật học phần thành công' : 'Thêm học phần thành công');
            closeCourseModal();
            loadCourses();
        } else {
            const err = await res.json();
            showToast('Lỗi: ' + err.error);
        }
    } catch (err) {
            showToast('Error: ' + err.message);
    }
}

function renderCourses(data = courses) {
    const tbody = document.getElementById('courseTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center-muted">Chưa có dữ liệu </td></tr>';
        return;
    }
    
    // Helper to find course name by ID
    const getName = (id) => {
        if (!id) return 'Không';
        const found = courses.find(c => c.id == id); // Always search in full list for names
        return found ? found.name : id;
    };

    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.credits}</td>
            <td>${c.theory}</td>
            <td>${c.practical}</td>
            <td>${getName(c.prerequisite)}</td>
            <td>${getName(c.coRequisite)}</td>
            <td>${getName(c.previous)}</td>
            ${currentUser.role === 'Admin' ? `
            <td class="action-btns">
                <button class="action-btn btn-secondary" onclick="editCourse('${c.id}')">Sửa</button>
                <button class="action-btn btn-danger" onclick="deleteCourse('${c.id}')">Xóa</button>
            </td>` : '<td></td>'}
        </tr>
    `).join('');
}

function clearCourseForm() {
    document.getElementById('courseId').value = '';
    document.getElementById('courseName').value = '';
    document.getElementById('courseCredits').value = '';
    document.getElementById('theoryCredits').value = '';
    document.getElementById('practicalCredits').value = '';
    document.getElementById('prerequisite').value = '';
    document.getElementById('coRequisite').value = '';
    document.getElementById('previousCourse').value = '';
}

function populateCourseSelects(excludeId = null) {
    const selects = ['prerequisite', 'coRequisite', 'previousCourse'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Preserve current selection if possible, otherwise reset
        const currentVal = select.value;
        
        select.innerHTML = '<option value="">-- Không có --</option>';
        
        courses.forEach(c => {
            if (excludeId && c.id == excludeId) return; // Cannot select itself

            const option = document.createElement('option');
            option.value = c.id; 
            option.textContent = `${c.name} (${c.id})`; 
            select.appendChild(option);
        });
    });
}

function openCourseModal() {
    editingCourseId = null;
    document.querySelector('#courseModal h2').textContent = 'Thêm học phần mới';
    document.querySelector('#courseModal .btn-primary').textContent = 'Thêm học phần';
    document.getElementById('courseId').disabled = false;
    clearCourseForm();
    populateCourseSelects(); // Populate dropdowns
    document.getElementById('courseModal').style.display = 'block';
}

function closeCourseModal() {
    document.getElementById('courseModal').style.display = 'none';
    clearCourseForm();
    editingCourseId = null;
}

function editCourse(id) {
    const c = courses.find(course => course.id == id); // Loose equality for number/string id
    if (!c) return;
    
    editingCourseId = id;
    document.querySelector('#courseModal h2').textContent = 'Cập nhật học phần';
    document.querySelector('#courseModal .btn-primary').textContent = 'Cập nhật';

    document.getElementById('courseId').value = c.id;
    document.getElementById('courseId').disabled = true;
    document.getElementById('courseName').value = c.name;
    document.getElementById('courseCredits').value = c.credits;
    document.getElementById('theoryCredits').value = c.theory;
    document.getElementById('practicalCredits').value = c.practical;

    populateCourseSelects(id); // Populate and exclude current course

    // Set selected values after populating
    document.getElementById('prerequisite').value = c.prerequisite || '';
    document.getElementById('coRequisite').value = c.coRequisite || '';
    document.getElementById('previousCourse').value = c.previous || '';
    
    document.getElementById('courseModal').style.display = 'block';
}
async function deleteCourse(id) { 
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa học phần này?', async () => {
        try {
            const res = await fetch(`${API_COURSES}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Xóa học phần thành công');
                loadCourses();
            } else {
                showToast('Xóa thất bại');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message);
        }
    });
}
function searchCourses() {
    const searchTerm = document.getElementById('searchCourse').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnCourse').value;

    const filtered = courses.filter(c => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);
        
        if (filterCol === 'all') {
            return matchesTerm(c.id) || matchesTerm(c.name);
        } else if (filterCol === 'id') {
            return matchesTerm(c.id);
        } else if (filterCol === 'name') {
            return matchesTerm(c.name);
        }
        return true;
    });

    renderCourses(filtered);
}

// --- GRADE/ENROLLMENT SERVICE ---

async function loadGrades() {
    try {
        const res = await fetch(API_GRADES);
        if (!res.ok) throw new Error('Failed to fetch enrollments');
        const data = await res.json();
        // data is list of enrollments
        grades = data.map(e => {
            const scores = e.component_scores || {};
            return {
                id: e.grade_id || e.enrollment_id,
                studentId: e.student_id,
                courseId: e.course_id || e.course_code,
                grade: e.grade,
                attendance1: scores.attendance1,
                attendance2: scores.attendance2,
                midterm: scores.midterm,
                final: scores.final,
                created_at: e.enrollment_date
            };
        });
        renderGrades();
        updateDashboard();
    } catch (err) {
        console.error(err);
    }
}

async function addGrade() {
    const studentId = document.getElementById('gradeStudentId').value;
    const courseId = document.getElementById('gradeCourseId').value;
    const attendance1 = parseFloat(document.getElementById('gradeAttendance1').value) || 0;
    const attendance2 = parseFloat(document.getElementById('gradeAttendance2').value) || 0;
    const midterm = parseFloat(document.getElementById('gradeMidterm').value) || 0;
    const final = parseFloat(document.getElementById('gradeFinal').value);

    if (!studentId || !courseId) {
        showToast('Chọn sinh viên và học phần');
        return;
    }

    // Strategy: Check if enrollment exists
    let enrollmentId = null;
    const existing = grades.find(g => g.studentId === studentId && g.courseId === courseId);
    
    if (existing) {
        enrollmentId = existing.id;
    } else {
        // Creates new enrollment
        try {
            const res = await fetch(API_ENROLLMENTS_SVC, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ student_id: studentId, course_code: courseId })
            });
            if (!res.ok) {
                const err = await res.json();
                showToast('Lỗi đăng ký: ' + err.error);
                return;
            }
            const newEnroll = await res.json();
            enrollmentId = newEnroll.enrollment_id;
        } catch(e) {
            showToast('Lỗi kết nối: ' + e.message);
            return;
        }
    }

    // Now update grade
    if (enrollmentId && !isNaN(final)) {
        try {
            // Using weighted average logic from backend
            // Sending all 4 scores
            const payload = {
                scores: [attendance1, attendance2, midterm, final],
                weights: [5, 5, 40, 50] // Adjusted for 2 attendance scores
            };
            
            const res = await fetch(`${API_GRADES}/${enrollmentId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                showToast('Nhập điểm thành công!');
                closeGradeModal();
                loadGrades();
            } else {
                const err = await res.json();
                showToast('Lỗi nhập điểm: ' + err.error);
            }
        } catch(e) {
            showToast('Lỗi kết nối khi nhập điểm');
        }
    } else {
            showToast('Đăng ký môn thành công');
            closeGradeModal();
            loadGrades();
    }
}

function openGradeModal() {
    editingGradeId = null;
    clearGradeForm();
    updateGradeSelects();
    document.getElementById('gradeModal').style.display = 'block';
}

function closeGradeModal() {
    document.getElementById('gradeModal').style.display = 'none';
}

function editGrade(id) {
    editingGradeId = id;
    const g = grades.find(item => item.id == id);
    if (!g) return;

    updateGradeSelects();
    
    document.getElementById('gradeCourseId').value = g.courseId;
    onGradeCourseChange(); // Populate students for this course
    document.getElementById('gradeStudentId').value = g.studentId;
    
    document.getElementById('gradeAttendance1').value = g.attendance1 || '';
    document.getElementById('gradeAttendance2').value = g.attendance2 || '';
    document.getElementById('gradeMidterm').value = g.midterm || '';
    document.getElementById('gradeFinal').value = g.final || '';

    document.getElementById('gradeModal').style.display = 'block';
}

function renderGrades(data = grades) {
    const tbody = document.getElementById('gradeTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center-muted">Chưa có dữ liệu</td></tr>';
        return;
    }

    // Group by course
    const grouped = data.reduce((acc, g) => {
        if (!acc[g.courseId]) acc[g.courseId] = [];
        acc[g.courseId].push(g);
        return acc;
    }, {});

    let html = '';
    for (const courseId in grouped) {
        const course = courses.find(c => String(c.id) === String(courseId)) || { name: courseId };
        
        // Course Header Row
        html += `
        <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="8" style="color: var(--primary); padding: 12px 24px; border-left: 4px solid var(--primary);">
                <i class="fas fa-book-open"></i> Học phần: ${course.name} (${courseId}) - ${grouped[courseId].length} sinh viên
            </td>
        </tr>`;

        // Student Rows
        html += grouped[courseId].map(g => {
            const s = students.find(st => String(st.id) === String(g.studentId));
            const studentName = s ? s.name : `Chưa cập nhật (Mã: ${g.studentId})`;
            
            const isEntered = (val) => (val !== null && val !== undefined && parseFloat(val) !== 0);
            const formatScore = (val) => isEntered(val) ? val : '-';
            const gradeDisplay = isEntered(g.grade) ? parseFloat(g.grade).toFixed(2) : '-';
            
            return `
            <tr>
                <td>${g.studentId}</td>
                <td>${studentName}</td>
                <td>${formatScore(g.attendance1)}</td> 
                <td>${formatScore(g.attendance2)}</td> 
                <td>${formatScore(g.midterm)}</td> 
                <td>${formatScore(g.final)}</td>
                <td>${gradeDisplay}</td>
                ${(currentUser.role === 'Admin' || currentUser.role === 'Faculty') ? `
                <td class="action-btns">
                    <button class="action-btn btn-secondary" onclick="editGrade('${g.id}')">Sửa</button>
                    <button class="action-btn btn-danger" onclick="deleteGrade('${g.id}')">Hủy</button>
                </td>` : '<td></td>'}
            </tr>`;
        }).join('');
    }
    tbody.innerHTML = html;
}

async function deleteGrade(id) {
    showConfirm('Xác nhận', 'Hủy đăng ký học phần này?', async () => {
        try {
            const res = await fetch(`${API_ENROLLMENTS_SVC}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Hủy đăng ký thành công');
                loadGrades();
                // Refresh enrollment data to show the course back in available list
                setTimeout(loadEnrollmentData, 500);
                setTimeout(loadStudentResults, 500);
                
                // If enrolled details modal is open, refresh it
                const modal = document.getElementById('enrolledDetailsModal');
                if (modal && modal.style.display === 'block') {
                    setTimeout(showEnrolledDetails, 600); 
                }
            }
            else showToast('Lỗi khi hủy');
        } catch(e) { showToast('Lỗi kết nối'); }
    });
}

function clearGradeForm() {
    document.getElementById('gradeStudentId').value = '';
    document.getElementById('gradeCourseId').value = '';
    document.getElementById('gradeAttendance1').value = '';
    document.getElementById('gradeAttendance2').value = '';
    document.getElementById('gradeMidterm').value = '';
    document.getElementById('gradeFinal').value = '';
}

function updateGradeSelects() {
    const studentSelect = document.getElementById('gradeStudentId');
    const courseSelect = document.getElementById('gradeCourseId');
    const filterCourseSelect = document.getElementById('filterGradeByCourse');
    
    const courseOptions = courses.map(c => `<option value="${c.id}">${c.id} - ${c.name}</option>`);
    
    // Always show all courses
    const commonPrefix = '<option value="">-- Chọn học phần --</option>';
    courseSelect.innerHTML = commonPrefix + courseOptions.join('');

    // Update filter dropdown too
    if (filterCourseSelect) {
        filterCourseSelect.innerHTML = '<option value="">-- Tất cả học phần --</option>' + courseOptions.join('');
    }

    // Students will be populated based on selected course
    onGradeCourseChange();
}

function onGradeCourseChange() {
    const courseId = document.getElementById('gradeCourseId').value;
    const studentSelect = document.getElementById('gradeStudentId');
    
    if (!courseId) {
        studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
        return;
    }

    // Filter students who registered for this course
    const enrolledStudentIds = grades
        .filter(g => String(g.courseId) === String(courseId))
        .map(g => g.studentId);
    
    const filteredStudents = students.filter(s => enrolledStudentIds.includes(s.id));

    if (filteredStudents.length === 0) {
        studentSelect.innerHTML = '<option value="">-- Chưa có SV đăng ký HP này --</option>';
    } else {
        studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>' + 
            filteredStudents.map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`).join('');
    }
}

function searchGrades() {
    const searchTerm = document.getElementById('searchGrade').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnGrade').value;
    const filterCourse = document.getElementById('filterGradeByCourse').value;

    const filtered = grades.filter(g => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);
        const matchesCourse = !filterCourse || String(g.courseId) === String(filterCourse);
        
        if (!matchesCourse) return false;

        if (filterCol === 'all') {
            return matchesTerm(g.studentId);
        } else if (filterCol === 'studentId') {
            return matchesTerm(g.studentId);
        }
        return true;
    });

    renderGrades(filtered);
}

// Enrollment functions removed

// Simple Tab switching
window.showPage = showPage;

// University Info
async function loadGeneralInfo() {
    try {
        const res = await fetch(API_UNIS);
        if(!res.ok) throw new Error("Failed to fetch schools");
        const rawSchools = await res.json();
        
        // Map Uni Service format to frontend friendly format
        const schoolsData = rawSchools.map(s => ({
            id: s.mem_school_id,
            name: s.mem_school_name,
            website: s.mem_school_website
        }));
        
        schools = schoolsData; // Update global
        
        renderSchoolSection('school-info-section', schoolsData, true);
        renderSchoolSection('school-info-section-view', schoolsData, false);

    } catch(e) {
        console.error("Error loading general info:", e);
        const container = document.getElementById('school-info-section');
        if(container) container.innerHTML = '<p class="text-center-muted">Không thể tải thông tin trường</p>';
    }
}

function renderSchoolSection(containerId, data, isManagement) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-center-muted">Chưa có thông tin trường</p>';
        return;
    }

    container.innerHTML = data.map(s => `
        <div style="background: white; padding: 25px; border-radius: var(--radius); box-shadow: var(--shadow-sm); margin-bottom: 20px; border-left: 5px solid var(--secondary);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h2 style="margin: 0 0 15px 0; color: var(--primary); font-size: 1.5rem;">${s.name}</h2>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="viewSchoolDetails('${s.id}', '${s.name}')">Xem chi tiết</button>
                    ${(isManagement && currentUser.role === 'Admin') ? `
                    <button class="btn btn-secondary btn-sm" onclick="editSchool('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSchool('${s.id}')"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; color: var(--text-secondary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-globe" style="color: var(--secondary);"></i> 
                    <span>Website: <a href="${s.website}" target="_blank" style="color: var(--primary); text-decoration: none;">${s.website || '---'}</a></span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-id-card" style="color: var(--secondary);"></i> 
                    <span>Mã trường: <strong>${s.id}</strong></span>
                </div>
            </div>
        </div>
    `).join('');
}

// --- SCHOOL MANAGEMENT ---

function openAddSchoolModal() {
    editingSchoolId = null;
    document.querySelector('#schoolModal h2').textContent = 'Thêm thông tin trường';
    document.querySelector('#schoolModal .btn-primary').textContent = 'Lưu thông tin';
    document.getElementById('schoolId').disabled = false;
    document.getElementById('schoolId').value = '';
    document.getElementById('schoolName').value = '';
    document.getElementById('schoolWebsite').value = '';
    document.getElementById('schoolModal').style.display = 'block';
}

function closeSchoolModal() {
    document.getElementById('schoolModal').style.display = 'none';
    editingSchoolId = null;
}

async function editSchool(id) {
    try {
        const res = await fetch(`${API_UNIS}/${id}`);
        if (!res.ok) throw new Error('Cannot fetch school details');
        const s = await res.json();
        
        editingSchoolId = id;
        document.querySelector('#schoolModal h2').textContent = 'Cập nhật trường';
        document.querySelector('#schoolModal .btn-primary').textContent = 'Cập nhật';

        document.getElementById('schoolId').value = s.mem_school_id;
        document.getElementById('schoolId').disabled = true;
        document.getElementById('schoolName').value = s.mem_school_name;
        document.getElementById('schoolWebsite').value = s.mem_school_website || '';
        document.getElementById('schoolModal').style.display = 'block';

    } catch (e) {
        showToast('Lỗi: ' + e.message);
    }
}

async function deleteSchool(id) {
    showConfirm('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa trường này?', async () => {
        try {
            const res = await fetch(`${API_UNIS}/${id}`, { method: 'DELETE' });
            if(res.ok) {
                showToast('Xóa thành công');
                loadGeneralInfo();
                loadSchoolsIntoFacultyFilter();
            } else {
                const err = await res.json();
                if (err.error && (err.error.includes('1451') || err.error.includes('foreign key'))) {
                    showToast('Không thể xóa: Trường này đang có các khoa trực thuộc. Vui lòng xóa các khoa trước.', 'error');
                } else {
                    showToast('Lỗi xóa: ' + (err.error || 'Unknown'), 'error');
                }
            }
        } catch(e) {
            showToast('Lỗi kết nối: ' + e.message, 'error');
        }
    });
}

async function addSchool() {
    const id = document.getElementById('schoolId').value.trim();
    const name = document.getElementById('schoolName').value.trim();
    const website = document.getElementById('schoolWebsite').value.trim();

    if (!id || !name) {
        showToast('Vui lòng điền ID và Tên trường', 'warning');
        return;
    }

    try {
        const payload = {
            mem_school_id: parseInt(id),
            mem_school_name: name,
            mem_school_website: website
        };

        let res;
        if (editingSchoolId) {
            // Update
             res = await fetch(`${API_UNIS}/${editingSchoolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            res = await fetch(API_UNIS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            showToast(editingSchoolId ? 'Cập nhật thành công!' : 'Thêm trường thành công!');
            closeSchoolModal();
            loadGeneralInfo();
            loadSchoolsIntoFacultyFilter(); 
        } else {
            const err = await res.json();
            showToast('Lỗi: ' + (err.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        showToast('Lỗi kết nối: ' + e.message, 'error');
    }
}

async function viewSchoolDetails(schoolId, schoolName) {
    document.getElementById('detailSchoolName').textContent = 'Chi tiết trường: ' + schoolName;
    const listContainer = document.getElementById('schoolFacultiesList');
    listContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
    document.getElementById('schoolDetailModal').style.display = 'block';

    try {
        // Use API_SCHOOL_FACULTIES (on Faculty Service 5007)
        const res = await fetch(`${API_SCHOOL_FACULTIES}/${schoolId}/faculties`);
        if (!res.ok) throw new Error('Failed to load faculties');
        const faculties = await res.json();

        if (faculties.length === 0) {
            listContainer.innerHTML = '<p class="text-center-muted">Chưa có dữ liệu</p>';
        } else {
            let html = '<ul style="list-style: none; padding: 0;">';
            faculties.forEach(f => {
                html += `
                    <li style="background: var(--bg-body); padding: 10px; margin-bottom: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <strong>${f.fac_name}</strong> (ID: ${f.fac_id})<br>
                        <small><i class="fa-solid fa-location-dot"></i> ${f.fac_address || '---'}</small>
                    </li>
                `;
            });
            html += '</ul>';
            listContainer.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<p class="text-danger">Không thể tải thông tin chi tiết.</p>';
    }
}

function closeSchoolDetailModal() {
    document.getElementById('schoolDetailModal').style.display = 'none';
}

// --- FACULTY SERVICE ---

async function loadFaculties() {
    try {
        const res = await fetch(API_FACULTIES);
        if (!res.ok) throw new Error('Failed to fetch faculties');
        faculties = await res.json();
        // renderFacultyList(); // Not showing faculty on general info anymore
        renderFacultyGrid();
        loadSchoolsIntoFacultyFilter(); // Load schools vào filter
    } catch (err) {
        console.error(err);
        // Error handling for grid mainly
    }
}

async function loadSchoolsIntoFacultyFilter() {
    try {
        const res = await fetch(API_UNIS);
        if (!res.ok) throw new Error('Failed to fetch schools');
        schools = await res.json(); // Lưu vào biến global

        const select = document.getElementById('filterSchool');
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Tất cả trường --</option>';
        
        // Add option for separate faculties
        const optIndependent = document.createElement('option');
        optIndependent.value = 'none';
        optIndependent.textContent = '-- Khoa riêng biệt --';
        select.appendChild(optIndependent);
        
        schools.forEach(s => {
            const option = document.createElement('option');
            option.value = s.mem_school_id || s.id;
            option.textContent = s.mem_school_name || s.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading schools for filter:', err);
    }
}

function filterFacultiesBySchool() {
    const schoolId = document.getElementById('filterSchool').value;
    
    let filtered = faculties;
    if (schoolId === 'none') {
        filtered = faculties.filter(f => !f.mem_school_id);
    } else if (schoolId) {
        filtered = faculties.filter(f => f.mem_school_id == schoolId);
    }
    
    renderFacultyGrid(filtered);
}

function renderFacultyList() {
    // This renders the "General Info" page public view
    const container = document.getElementById('university-info-container');
    if (!faculties || faculties.length === 0) {
        container.innerHTML = '<p class="text-center-muted">Chưa có thông tin khoa</p>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;">';

    faculties.forEach(fac => {
        html += `
            <div class="stat-card" style="padding: 24px; border-left: 4px solid var(--primary); transition: transform 0.2s; cursor: pointer;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
                    ${fac.fac_name}
                </h3>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; gap: 16px; align-items: flex-start;">
                        <div style="width: 24px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-location-dot"></i></div>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">ĐỊA CHỈ</div>
                            <div style="color: #ea580c; font-weight: 500; font-size: 0.95rem;">${fac.fac_address || '---'}</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: flex-start;">
                        <div style="width: 24px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-envelope"></i></div>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">EMAIL</div>
                            <div style="color: #ea580c; font-weight: 500; font-size: 0.95rem;">${fac.fac_email || '---'}</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: flex-start;">
                        <div style="width: 24px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-phone"></i></div>
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">ĐIỆN THOẠI</div>
                            <div style="color: #ea580c; font-weight: 500; font-size: 0.95rem;">${fac.fac_number || '---'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderFacultyGrid(data = faculties) {
    const container = document.getElementById('facultyGrid');
    if (!container) return; 

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-center-muted" style="grid-column: 1/-1;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = data.map(f => {
        // Get school name from schools list
        let schoolName = f.school_name || 'Khoa riêng biệt';
        if (!f.school_name && f.mem_school_id && schools.length > 0) {
            const school = schools.find(s => (s.mem_school_id || s.id) == f.mem_school_id);
            if (school) {
                schoolName = school.mem_school_name || school.name;
            }
        }
        
        return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                 <div style="margin-bottom: 8px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">${schoolName}</span>
                 </div>
                 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--primary);">${f.fac_name}</h3>
                    <span style="font-size: 0.8rem; background: var(--bg-body); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary);">ID: ${f.fac_id}</span>
                </div>
                
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-location-dot" style="width: 16px;"></i> ${f.fac_address || '---'}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                         <i class="fa-solid fa-envelope" style="width: 16px;"></i> ${f.fac_email || '---'}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-phone" style="width: 16px;"></i> ${f.fac_number || '---'}
                    </div>
                </div>
            </div>
            
            ${currentUser.role === 'Admin' ? `
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
                <button class="action-btn btn-secondary" onclick="editFaculty('${f.fac_id}')">
                    <i class="fa-solid fa-pen"></i> Sửa
                </button>
                <button class="action-btn btn-danger" onclick="deleteFaculty('${f.fac_id}')">
                    <i class="fa-solid fa-trash"></i> Xóa
                </button>
            </div>` : ''}
        </div>
    `}).join('');
}

// --- FACULTY SERVICE ---

async function loadFacultiesForSchools() {
    try {
        const res = await fetch(API_FACULTIES);
        if (!res.ok) throw new Error('Failed to fetch faculties');
        faculties = await res.json();
    } catch (err) {
        console.error(err);
    }
}

async function addFaculty() {
    const id = document.getElementById('facultyId').value.trim();
    const name = document.getElementById('facultyName').value.trim();
    const address = document.getElementById('facultyAddress').value.trim();
    const email = document.getElementById('facultyEmail').value.trim();
    const phone = document.getElementById('facultyPhone').value.trim();
    const schoolId = document.getElementById('facultySchoolId').value;

    if (!id || !name) {
        showToast('Vui lòng điền Mã khoa và Tên khoa', 'warning');
        return;
    }

    const payload = {
        fac_id: id,
        fac_name: name,
        fac_address: address,
        fac_email: email,
        fac_number: phone,
        mem_school_id: schoolId || null
    };

    try {
        let res;
        if (editingFacultyId) {
            res = await fetch(`${API_FACULTIES}/${editingFacultyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            if (faculties.some(f => f.fac_id == id)) {
                showToast('Mã khoa đã tồn tại');
                return;
            }
            res = await fetch(API_FACULTIES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const err = await res.json();
            showToast('Lỗi: ' + (err.error || 'Unknown error'));
            return;
        }

        showToast(editingFacultyId ? 'Cập nhật thành công' : 'Thêm khoa thành công');
        closeFacultyModal();
        loadFaculties();
    } catch (err) {
        showToast('Lỗi kết nối: ' + err.message);
    }
}

async function deleteFaculty(id) {
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa khoa này?', async () => {
        try {
            const res = await fetch(`${API_FACULTIES}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Xóa thành công');
                loadFaculties();
            } else {
                const err = await res.json();
                showToast('Lỗi xóa: ' + (err.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    });
}

async function openAddFacultyModal() {
    editingFacultyId = null;
    document.querySelector('#facultyModal h2').textContent = 'Thêm khoa mới';
    document.querySelector('#facultyModal .btn-primary').textContent = 'Lưu thông tin';
    document.getElementById('facultyId').disabled = false;
    clearFacultyForm();
    // Đảm bảo load schools trước khi hiển thị modal
    if (schools.length === 0) {
        await loadSchoolsForFaculty();
    } else {
        // Nếu đã có schools, chỉ populate dropdown
        const select = document.getElementById('facultySchoolId');
        select.innerHTML = '<option value="">-- Chọn Trường --</option>';
        schools.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.mem_school_id;
            opt.textContent = s.mem_school_name;
            select.appendChild(opt);
        });
    }
    document.getElementById('facultyModal').style.display = 'block';
}

function closeFacultyModal() {
    document.getElementById('facultyModal').style.display = 'none';
    clearFacultyForm();
}

function clearFacultyForm() {
    document.getElementById('facultyId').value = '';
    document.getElementById('facultyName').value = '';
    document.getElementById('facultyAddress').value = '';
    document.getElementById('facultyEmail').value = '';
    document.getElementById('facultyPhone').value = '';
    document.getElementById('facultySchoolId').value = '';
}

function editFaculty(id) {
    const f = faculties.find(fac => fac.fac_id == id);
    if (!f) return;

    editingFacultyId = id;
    document.querySelector('#facultyModal h2').textContent = 'Cập nhật khoa';
    document.querySelector('#facultyModal .btn-primary').textContent = 'Cập nhật';

    document.getElementById('facultyId').value = f.fac_id;
    document.getElementById('facultyId').disabled = true;
    document.getElementById('facultyName').value = f.fac_name;
    document.getElementById('facultyAddress').value = f.fac_address || '';
    document.getElementById('facultyEmail').value = f.fac_email || '';
    document.getElementById('facultyPhone').value = f.fac_number || '';
    
    loadSchoolsForFaculty(f.mem_school_id);
    document.getElementById('facultyModal').style.display = 'block';
}

async function loadSchoolsForFaculty(selectedId = null) {
    try {
        const res = await fetch(API_UNIS);
        if (!res.ok) throw new Error('Failed to fetch schools');
        const schoolsList = await res.json();

        const select = document.getElementById('facultySchoolId');
        select.innerHTML = '<option value="">-- Không có (Khoa riêng biệt) --</option>';
        
        schoolsList.forEach(s => {
            const option = document.createElement('option');
            option.value = s.mem_school_id || s.id;
            option.textContent = s.mem_school_name || s.name;
            if (selectedId && (s.mem_school_id == selectedId || s.id == selectedId)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading schools:', err);
    }
}

/* ... omitted loadSchools ... */

function searchFaculties() {
    const searchTerm = document.getElementById('searchFaculty').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnFaculty').value;
    const selectedSchool = document.getElementById('filterSchool').value;
    
    // Check if container exists
    const container = document.getElementById('facultyGrid');
    if (!container) return;
    
    // Filter locally
    let filtered = faculties;
    
    // Filter by school first
    if (selectedSchool) {
        filtered = filtered.filter(f => f.mem_school_id == selectedSchool);
    }
    
    // Then filter by search term
    filtered = filtered.filter(f => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);

        if (filterCol === 'all') {
             return matchesTerm(f.fac_id) || matchesTerm(f.fac_name) || matchesTerm(f.fac_address);
        } else if (filterCol === 'id') {
             return matchesTerm(f.fac_id);
        } else if (filterCol === 'name') {
             return matchesTerm(f.fac_name);
        } else if (filterCol === 'address') {
             return matchesTerm(f.fac_address);
        }
        return true;
    });
    
    renderFacultyGrid(filtered);
}

// --- MAJOR SERVICE ---

async function loadMajors() {
    try {
        const res = await fetch(API_MAJORS);
        if (!res.ok) throw new Error('Failed to fetch majors');
        const data = await res.json();
        
        majors = data.map(m => ({
            id: m.major_id,
            name: m.major_name,
            credits: m.major_credits,
            facId: m.fac_id,
            facName: m.fac_name // Assuming backend returns fac_name if available or joined
        }));
        
        renderMajors();
    } catch (err) {
        console.error('Error loading majors:', err);
    }
}

function renderMajors(data = majors) {
    const tbody = document.getElementById('majorTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center-muted">Chưa có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(m => {
        // Find faculty name if not provided directly
        let fName = m.facName;
        let sName = '---';
        if (faculties.length > 0) {
            const f = faculties.find(fac => fac.fac_id == m.facId);
            if (f) {
                fName = f.fac_name;
                // Get school name from its id
                if (schools.length > 0) {
                    const s = schools.find(sch => (sch.mem_school_id || sch.id) == f.mem_school_id);
                    if (s) sName = s.mem_school_name || s.name;
                } else if (f.school_name) {
                    sName = f.school_name;
                }
            }
        }
        
        return `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.credits || '-'}</td>
                <td>${sName}</td>
                <td>${fName || m.facId || '-'}</td>
                <td class="action-btns">
                    <button class="action-btn btn-primary" onclick="openMajorKnowledgeBlocks('${m.id}')">Xem chi tiết</button>
                    ${currentUser.role === 'Admin' ? `
                    <button class="action-btn btn-secondary" onclick="editMajor('${m.id}')">Sửa</button>
                    <button class="action-btn btn-danger" onclick="deleteMajor('${m.id}')">Xóa</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

async function addMajor() {
    const id = document.getElementById('majorId').value.trim();
    const name = document.getElementById('majorName').value.trim();
    const facId = document.getElementById('majorFacId').value;

    if (!id || !name) {
        showToast('Vui lòng điền Mã ngành và Tên ngành', 'warning');
        return;
    }

    // Tính tổng tín chỉ từ các khối kiến thức
    let totalCredits = 0;
    Object.values(majorKnowledgeBlocksData).forEach(block => {
        block.courses.forEach(course => {
            totalCredits += parseInt(course.credits) || 0;
        });
    });

    const payload = {
        major_id: id,
        major_name: name,
        major_credits: totalCredits,
        fac_id: facId ? parseInt(facId) : null,
        courses: getMajorCoursesDataFromKnowledgeBlocks() // Thu thập danh sách học phần từ knowledge blocks
    };

    try {
        let res;
        if (editingMajorId) {
            res = await fetch(`${API_MAJORS}/${editingMajorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            if (majors.some(m => m.id == id)) {
                showToast('Mã ngành đã tồn tại');
                return;
            }
            res = await fetch(API_MAJORS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const err = await res.json();
            showToast('Lỗi: ' + (err.error || 'Unknown error'));
            return;
        }

        showToast(editingMajorId ? 'Cập nhật thành công' : 'Thêm ngành thành công');
        closeMajorModal();
        loadMajors();
    } catch (err) {
        showToast('Lỗi kết nối: ' + err.message);
    }
}

async function deleteMajor(id) {
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa ngành học này?', async () => {
        try {
            const res = await fetch(`${API_MAJORS}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Xóa thành công');
                loadMajors();
            } else {
                showToast('Xóa thất bại', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    });
}

async function loadFacultiesForSelect(selectedId = null) {
    try {
        // Reuse existing faculties list if loaded, or fetch if empty
        if (!faculties || faculties.length === 0) {
            const res = await fetch(API_FACULTIES);
            if (res.ok) faculties = await res.json();
        }

        const select = document.getElementById('majorFacId');
        select.innerHTML = '<option value="">-- Chọn khoa --</option>';
        
        faculties.forEach(f => {
            const option = document.createElement('option');
            option.value = f.fac_id;
            option.textContent = `${f.fac_name} (ID: ${f.fac_id})`;
            if (selectedId && f.fac_id == selectedId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading faculties for select:', err);
    }
}

function openAddMajorModal() {
    editingMajorId = null;
    document.querySelector('#majorModal h2').textContent = 'Thêm ngành học mới';
    document.querySelector('#majorModal .btn-primary').textContent = 'Lưu thông tin';
    document.getElementById('majorId').disabled = false;
    
    clearMajorForm();
    loadFacultiesForSelect();
    renderMajorKnowledgeBlocks();
    document.getElementById('majorModal').style.display = 'block';
}

function closeMajorModal() {
    document.getElementById('majorModal').style.display = 'none';
    clearMajorForm();
    editingMajorId = null;
}

function clearMajorForm() {
    document.getElementById('majorId').value = '';
    document.getElementById('majorName').value = '';
    document.getElementById('majorFacId').value = '';
    
    // Reset knowledge blocks to empty
    majorKnowledgeBlocksData = {
        'cso_nganh': { name: 'Khối kiến thức cơ sở ngành', courses: [] },
        'bo_tro': { name: 'Khối kiến thức bổ trợ', courses: [] },
        'giao_duc_dai_cuong': { name: 'Khối kiến thức giáo dục đại cương', courses: [] },
        'chuyen_nganh': { name: 'Khối kiến thức chuyên ngành', courses: [] },
        'thuc_tap': { name: 'Khối thực tập', courses: [] }
    };
}

function renderMajorKnowledgeBlocks() {
    const container = document.getElementById('majorKnowledgeBlocks');
    if (!container) return;
    
    let html = '';
    let totalCredits = 0;

    Object.entries(majorKnowledgeBlocksData).forEach(([blockId, blockData]) => {
        const blockCredits = blockData.courses.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0);
        totalCredits += blockCredits;

        html += `
        <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="margin: 0; color: var(--primary);">${blockData.name}</h4>
                <span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                    ${blockCredits} tín chỉ
                </span>
            </div>

            <div id="block-${blockId}" style="background: white; padding: 10px; border-radius: 6px; margin-bottom: 10px; min-height: 30px;">
                ${blockData.courses.length > 0 ? blockData.courses.map((course, idx) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 8px 12px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid var(--primary);">
                        <div>
                            <strong>${course.id}</strong> - ${course.name} <span style="color: #999;">(${course.credits} tín)</span>
                        </div>
                        <button type="button" class="action-btn btn-danger" onclick="removeKnowledgeBlockCourse('${blockId}', ${idx})" 
                                style="padding: 4px 8px; font-size: 0.75rem;">
                            Xóa
                        </button>
                    </div>
                `).join('') : '<div style="color: #ccc; text-align: center; padding: 20px;">Chưa có học phần</div>'}
            </div>

            <button type="button" class="btn btn-outline" onclick="showAddCourseForm('${blockId}')" 
                    style="font-size: 0.85rem; padding: 6px 12px; width: 100%;">
                + Thêm học phần
            </button>

            <div id="add-form-${blockId}" style="display: none; margin-top: 10px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.85rem; display: block; margin-bottom: 5px;">Chọn học phần *</label>
                    <select id="course-select-${blockId}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem;">
                        <option value="">-- Chọn học phần --</option>
                        ${courses.length > 0 ? courses.map(c => `<option value="${c.id}">${c.id} - ${c.name}</option>`).join('') : '<option disabled>Không có học phần nào</option>'}
                    </select>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button type="button" class="btn btn-primary" onclick="addKnowledgeBlockCourse('${blockId}')" 
                            style="flex: 1; padding: 8px; font-size: 0.85rem;">Thêm</button>
                    <button type="button" class="btn btn-secondary" onclick="hideAddCourseForm('${blockId}')" 
                            style="flex: 1; padding: 8px; font-size: 0.85rem;">Hủy</button>
                </div>
            </div>
        </div>
        `;
    });

    html += `
    <div style="background: var(--primary); color: white; padding: 15px; border-radius: 8px; margin-top: 10px; text-align: center;">
        <h3 style="margin: 0;">Tổng cộng: <strong id="totalCreditsDisplay">0</strong> tín chỉ</h3>
    </div>
    `;

    container.innerHTML = html;
    updateTotalCreditsDisplay();
}

function showAddCourseForm(blockId) {
    document.getElementById(`add-form-${blockId}`).style.display = 'block';
    document.getElementById(`course-id-${blockId}`).focus();
}

function hideAddCourseForm(blockId) {
    document.getElementById(`add-form-${blockId}`).style.display = 'none';
    document.getElementById(`course-select-${blockId}`).value = '';
}

function addKnowledgeBlockCourse(blockId) {
    const courseId = document.getElementById(`course-select-${blockId}`).value.trim();
    
    if (!courseId) {
        showToast('Vui lòng chọn một học phần');
        return;
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) {
        showToast('Không tìm thấy học phần');
        return;
    }

    if (!majorKnowledgeBlocksData[blockId]) return;
    
    // Kiểm tra xem học phần này đã có trong khối chưa
    const isDuplicate = majorKnowledgeBlocksData[blockId].courses.some(c => c.id === course.id);
    if (isDuplicate) {
        showToast('Học phần này đã được thêm vào khối này rồi');
        return;
    }

    majorKnowledgeBlocksData[blockId].courses.push({
        id: course.id,
        name: course.name,
        credits: course.credits || 3
    });

    hideAddCourseForm(blockId);
    renderMajorKnowledgeBlocks();
}

function removeKnowledgeBlockCourse(blockId, courseIndex) {
    if (!majorKnowledgeBlocksData[blockId]) return;
    majorKnowledgeBlocksData[blockId].courses.splice(courseIndex, 1);
    renderMajorKnowledgeBlocks();
}

function updateTotalCreditsDisplay() {
    let total = 0;
    Object.values(majorKnowledgeBlocksData).forEach(block => {
        block.courses.forEach(course => {
            total += parseInt(course.credits) || 0;
        });
    });
    const display = document.getElementById('totalCreditsDisplay');
    if (display) display.textContent = total;
}

function getMajorCoursesDataFromKnowledgeBlocks() {
    const courses = [];
    Object.entries(majorKnowledgeBlocksData).forEach(([blockId, blockData]) => {
        blockData.courses.forEach(course => {
            courses.push({
                course_id: course.id,
                course_name: course.name,
                course_credits: parseInt(course.credits) || 0,
                block_type: blockId
            });
        });
    });
    return courses;
}

function editMajor(id) {
    const m = majors.find(mj => mj.id == id);
    if (!m) return;

    editingMajorId = id;
    document.querySelector('#majorModal h2').textContent = `Cập nhật ngành: ${m.name}`;
    document.querySelector('#majorModal .btn-primary').textContent = 'Cập nhật';

    document.getElementById('majorId').value = m.id;
    document.getElementById('majorId').disabled = true;
    document.getElementById('majorName').value = m.name;
    
    loadFacultiesForSelect(m.facId);
    
    // Load knowledge blocks for editing
    loadMajorKnowledgeBlocksForEdit(id);

    document.getElementById('majorModal').style.display = 'block';
}

async function loadMajorKnowledgeBlocksForEdit(majorId) {
    try {
        const res = await fetch(`${API_MAJORS}/${majorId}`);
        if (!res.ok) {
            majorKnowledgeBlocksData = initializeMajorKnowledgeBlocks();
            renderMajorKnowledgeBlocks();
            return;
        }
        
        const data = await res.json();
        
        // Reset blocks
        majorKnowledgeBlocksData = initializeMajorKnowledgeBlocks();

        // Populate blocks with existing courses
        if (data.knowledge_blocks) {
            Object.entries(data.knowledge_blocks).forEach(([blockId, coursesList]) => {
                if (majorKnowledgeBlocksData[blockId]) {
                    majorKnowledgeBlocksData[blockId].courses = coursesList.map(c => ({
                        id: c.course_id,
                        name: c.course_name,
                        credits: c.course_credits
                    }));
                }
            });
        }
        
        renderMajorKnowledgeBlocks();
    } catch (err) {
        console.error('Error loading major knowledge blocks:', err);
        majorKnowledgeBlocksData = initializeMajorKnowledgeBlocks();
        renderMajorKnowledgeBlocks();
    }
}

function initializeMajorKnowledgeBlocks() {
    return {
        'cso_nganh': { name: 'Khối kiến thức cơ sở ngành', courses: [] },
        'bo_tro': { name: 'Khối kiến thức bổ trợ', courses: [] },
        'giao_duc_dai_cuong': { name: 'Khối kiến thức giáo dục đại cương', courses: [] },
        'chuyen_nganh': { name: 'Khối kiến thức chuyên ngành', courses: [] },
        'thuc_tap': { name: 'Khối thực tập', courses: [] }
    };
}

function searchMajors() {
    const searchTerm = document.getElementById('searchMajor').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnMajor').value;

    const filtered = majors.filter(m => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);
        
        // Resolve Faculty Name
        let fName = m.facName;
        if (!fName && faculties.length > 0) {
            const f = faculties.find(fac => fac.fac_id == m.facId);
            if (f) fName = f.fac_name;
        }

        if (filterCol === 'all') {
            return matchesTerm(m.id) || matchesTerm(m.name) || matchesTerm(fName);
        } else if (filterCol === 'id') {
            return matchesTerm(m.id);
        } else if (filterCol === 'name') {
            return matchesTerm(m.name);
        } else if (filterCol === 'faculty') {
            return matchesTerm(fName) || matchesTerm(m.facId);
        }
        return true;
    });

    renderMajors(filtered);
}

// ===== KNOWLEDGE BLOCKS FUNCTIONS =====
let selectedMajorForBlocks = null;
let assignedCourseIdsInMajor = new Set();

function openMajorKnowledgeBlocks(majorId) {
    selectedMajorForBlocks = majorId;
    
    const major = majors.find(m => m.id == majorId);
    if (major) {
        document.getElementById('majorDetailTitle').textContent = `Ngành học: ${major.name}`;
        document.getElementById('majorInfoSummary').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><i class="fa-solid fa-barcode"></i> <strong>Mã ngành:</strong> ${major.id}</div>
                <div><i class="fa-solid fa-building"></i> <strong>Khoa:</strong> ${major.facName || 'Chưa cập nhật'}</div>
            </div>
        `;
    }

    loadKnowledgeBlocks(majorId);
    document.getElementById('majorDetailModal').style.display = 'block';
}

function closeMajorDetailModal() {
    document.getElementById('majorDetailModal').style.display = 'none';
}

async function loadKnowledgeBlocks(majorId) {
    try {
        const res = await fetch(`${API_MAJORS}/${majorId}/knowledge-blocks`);
        if (!res.ok) {
            console.error('Error loading knowledge blocks:', res.status);
            return;
        }
        
        const data = await res.json();
        
        // Sync total credits back to the main majors list
        const majorIndex = majors.findIndex(m => String(m.id) === String(majorId));
        if (majorIndex !== -1) {
            majors[majorIndex].credits = data.total_credits;
            renderMajors(); // Refresh the main table to reflect new credit count
        }
        
        // Track assigned courses to hide them from the add list
        assignedCourseIdsInMajor = new Set();
        Object.values(data.knowledge_blocks).forEach(courseList => {
            courseList.forEach(c => assignedCourseIdsInMajor.add(String(c.course_id)));
        });

        renderKnowledgeBlocks(data.knowledge_blocks, data.total_credits);
    } catch (err) {
        console.error('Error loading knowledge blocks:', err);
        showToast('Lỗi tải khối kiến thức');
    }
}

function renderKnowledgeBlocks(blocks, totalCredits) {
    const container = document.getElementById('knowledgeBlocksContainerModal');
    if (!container) return;
    
    const blockNames = {
        'cso_nganh': 'Khối kiến thức cơ sở ngành',
        'bo_tro': 'Khối kiến thức bổ trợ',
        'giao_duc_dai_cuong': 'Khối kiến thức giáo dục đại cương',
        'chuyen_nganh': 'Khối kiến thức chuyên ngành',
        'thuc_tap': 'Khối thực tập'
    };

    container.innerHTML = Object.entries(blocks).map(([blockKey, courses]) => {
        const blockCredits = courses.reduce((sum, c) => sum + (c.course_credits || 0), 0);
        const blockName = blockNames[blockKey];
        
        return `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #f9f9f9;">
                <h4 style="margin-top: 0; color: var(--primary);">${blockName}</h4>
                <div style="margin-bottom: 10px; font-weight: bold;">Tín chỉ: <span style="color: var(--primary);">${blockCredits}</span></div>
                <div style="overflow-y: auto; max-height: 300px; margin-bottom: 10px;">
                    ${courses.length === 0 ? 
                        '<p style="color: #999; margin: 0;">Chưa có học phần</p>' :
                        `<ul style="margin: 0; padding-left: 20px;">
                            ${courses.map(course => `
                                <li style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span>${course.course_name} (${course.course_id}) - ${course.course_credits} tín chỉ</span>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>`
                    }
                </div>
            </div>
        `;
    }).join('');

    // Update total credits display
    if (document.getElementById('totalCreditsDisplayModal')) {
        document.getElementById('totalCreditsDisplayModal').textContent = totalCredits;
    }
}

async function removeCourseFromBlock(majorId, blockType, courseId) {
    showConfirm('Xác nhận xóa', 'Bạn có chắc muốn xóa học phần này khỏi khối kiến thức?', async () => {
        try {
            const res = await fetch(`${API_MAJORS}/${majorId}/knowledge-blocks/${blockType}/courses/${courseId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.json();
                showToast('Lỗi: ' + (err.error || 'Unknown error'));
                return;
            }

            showToast('Xóa học phần thành công');
            loadKnowledgeBlocks(majorId);
        } catch (err) {
            showToast('Lỗi kết nối: ' + err.message);
        }
    });
}

// ===== END KNOWLEDGE BLOCKS FUNCTIONS =====
 
// --- KKT Logic Removed ---

// --- STUDENT FEATURES ---

function showEnrolledDetails() {
    const currentId = getCurrentStudentId();
    const myEnrollments = grades.filter(g => String(g.studentId) === String(currentId));
    const tbody = document.getElementById('enrolledCoursesTableBody');
    
    if (!tbody) return;
    
    if (myEnrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center-muted">Chưa đăng ký học phần nào</td></tr>';
    } else {
        tbody.innerHTML = myEnrollments.map(g => {
            const course = courses.find(c => String(c.id) === String(g.courseId));
            return `
                <tr>
                    <td>${g.courseId}</td>
                    <td>${course ? course.name : 'Unknown'}</td>
                    <td>${course ? course.credits : '-'}</td>
                    <td>
                        <button class="action-btn btn-danger" onclick="deleteGrade('${g.id}')">Hủy</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    document.getElementById('enrolledDetailsModal').style.display = 'block';
}

function closeEnrolledDetailsModal() {
    const modal = document.getElementById('enrolledDetailsModal');
    if (modal) modal.style.display = 'none';
}

async function loadEnrollmentData() {
    const tbody = document.getElementById('enrollmentTableBody');
    if (!tbody) return;

    const currentId = getCurrentStudentId();
    // Filter courses that students can enroll in
    const studentGrades = grades.filter(g => String(g.studentId) === String(currentId));
    const enrolledCourseIds = studentGrades.map(g => String(g.courseId));

    // Calculate stats
    let totalCredits = 0;
    let enrolledCount = 0;

    courses.forEach(c => {
        if (enrolledCourseIds.includes(String(c.id))) {
            totalCredits += (parseInt(c.credits) || 0);
            enrolledCount++;
        }
    });

    // Update UI stats
    const countEl = document.getElementById('enrolled-classes-count');
    const creditsEl = document.getElementById('enrolled-credits-sum');
    if (countEl) countEl.innerText = enrolledCount;
    if (creditsEl) creditsEl.innerText = totalCredits;

    // Filter OUT enrolled courses from the list
    const availableCourses = courses.filter(c => !enrolledCourseIds.includes(String(c.id)));

    if (availableCourses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center-muted">Bạn đã đăng ký tất cả học phần hiện có</td></tr>';
    } else {
        tbody.innerHTML = availableCourses.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td><span class="badge badge-secondary">Chưa đăng ký</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="enrollCourse('${c.id}')">Đăng ký</button>
                </td>
            </tr>
        `).join('');
    }
}

async function enrollCourse(courseId) {
    const course = courses.find(c => c.id == courseId);
    const courseName = course ? course.name : courseId;
    
    // Resolve actual Student ID (MSV)
    let targetStudentId = currentUser.user;
    const student = students.find(s => s.id === currentUser.user || s.email === (currentUser.email || currentUser.user));
    if (student) {
        targetStudentId = student.id;
        // Also sync it to currentUser for future calls in this session
        if (currentUser.user !== student.id) {
            currentUser.user = student.id;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserDisplayName();
        }
    }
    
    const studentName = student ? student.name : targetStudentId;

    showConfirm('Xác nhận đăng ký', `Bạn có chắc chắn muốn đăng ký học phần "${courseName}"?`, async () => {
        try {
            const res = await fetch(API_ENROLLMENTS_SVC, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: targetStudentId,
                    course_code: courseId
                })
            });

            if (res.ok) {
                showToast(`Đăng ký học phần ${courseName} thành công`);
                loadGrades();
                setTimeout(loadEnrollmentData, 500); 
                setTimeout(loadStudentResults, 500);
            } else {
                const err = await res.json().catch(() => ({}));
                showToast('Lỗi khi đăng ký: ' + (err.error || 'Có thể bạn đã đăng ký học phần này rồi'), 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối', 'error');
        }
    });
}

function loadStudentResults() {
    const tbody = document.getElementById('studentGradesTableBody');
    if (!tbody) return;

    const currentId = getCurrentStudentId();
    const myGrades = grades.filter(g => String(g.studentId) === String(currentId));
    if (myGrades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center-muted">Chưa có kết quả học tập</td></tr>';
        return;
    }

    tbody.innerHTML = myGrades.map(g => {
        const c = courses.find(co => co.id === g.courseId) || { name: g.courseId, credits: 0 };
        
        // Helper to check if a score is actually entered (not null/undefined/0)
        const isEntered = (val) => (val !== null && val !== undefined && parseFloat(val) !== 0);

        const hasGrade = isEntered(g.grade);
        let avg = hasGrade ? parseFloat(g.grade).toFixed(2) : '-';
        let letter = '-';
        
        if (hasGrade) {
            // Rule: Nếu điểm giữa kì hoặc cuối kì bằng 0 thì đánh giá F
            // Chỉ áp dụng nếu đã có điểm thành phần (giá trị 0 thực sự)
            if (parseFloat(g.midterm) === 0 || parseFloat(g.final) === 0) {
                letter = 'F';
                avg = '0.00 (Liệt GK/CK)';
            } else {
                letter = convertToLetter(parseFloat(g.grade));
            }
        }

        const formatScore = (val) => isEntered(val) ? val : '-';

        return `
            <tr>
                <td>${g.courseId}</td>
                <td>${c.name}</td>
                <td>${c.credits}</td>
                <td>${formatScore(g.attendance1)}</td>
                <td>${formatScore(g.attendance2)}</td>
                <td>${formatScore(g.midterm)}</td>
                <td>${formatScore(g.final)}</td>
                <td><strong>${avg}</strong></td>
                <td><span class="badge ${letter === '-' ? 'badge-secondary' : (letter === 'F' ? 'badge-danger' : 'badge-success')}">${letter}</span></td>
            </tr>
        `;
    }).join('');
}

function convert10To4(gpa10) {
    if (gpa10 >= 8.5) return 4.0;
    if (gpa10 >= 8.0) return 3.5;
    if (gpa10 >= 7.0) return 3.0;
    if (gpa10 >= 6.5) return 2.5;
    if (gpa10 >= 5.5) return 2.0;
    if (gpa10 >= 5.0) return 1.5;
    if (gpa10 >= 4.0) return 1.0;
    return 0.0;
}

function calculateComponentGrade() {
    const method = document.getElementById('calcWeightMethod').value;
    const s1 = parseFloat(document.getElementById('calcScore1').value) || 0;
    const s2 = parseFloat(document.getElementById('calcScore2').value) || 0;
    const s3 = parseFloat(document.getElementById('calcScore3').value) || 0;
    const s4 = parseFloat(document.getElementById('calcScore4').value) || 0;

    let weights = [];
    if (method === '5-5-40-50') {
        weights = [0.05, 0.05, 0.40, 0.50];
    } else if (method === '5-5-30-60') {
        weights = [0.05, 0.05, 0.30, 0.60];
    }

    const final10 = (s1 * weights[0]) + (s2 * weights[1]) + (s3 * weights[2]) + (s4 * weights[3]);
    
    // Nếu điểm giữa kì hoặc cuối kì bằng 0 thì đánh giá F và hệ 4 là 0.0
    let final4, letterGrade;
    if (s3 === 0 || s4 === 0) {
        final4 = 0.0;
        letterGrade = "F";
    } else {
        final4 = convert10To4(final10);
        letterGrade = convertToLetter(final10);
    }

    const resultDiv = document.getElementById('component-calc-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h4 style="margin-bottom: 10px; color: var(--primary);">Kết quả dự kiến:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>Điểm hệ 10: <span style="font-size: 1.2rem; font-weight: bold;">${final10.toFixed(2)}</span></div>
            <div>Điểm hệ 4: <span style="font-size: 1.2rem; font-weight: bold;">${final4.toFixed(1)}</span></div>
            <div>Điểm chữ: <span style="font-size: 1.2rem; font-weight: bold;">${letterGrade}</span></div>
        </div>
    `;
}

function convertToLetter(gpa10) {
    if (gpa10 >= 8.5) return "A";
    if (gpa10 >= 8.0) return "B+";
    if (gpa10 >= 7.0) return "B";
    if (gpa10 >= 6.5) return "C+";
    if (gpa10 >= 5.5) return "C";
    if (gpa10 >= 5.0) return "D+";
    if (gpa10 >= 4.0) return "D";
    return "F";
}

function updateWeightLabels() {
    // Currently labels are the same for both methods (CC1, CC2, GK, CK)
}


