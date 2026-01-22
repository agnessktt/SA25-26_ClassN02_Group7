// API Configuration
const API_STUDENTS = 'http://localhost:5001/api/students';
const API_COURSES = 'http://localhost:5002/api/courses';
const API_GRADES = 'http://localhost:5003/api/grades';
const API_ENROLLMENTS_SVC = 'http://localhost:5006/api/enrollments';
const API_FACULTIES = 'http://localhost:5007/api/faculties';
const API_SCHOOL_FACULTIES = 'http://localhost:5007/api/schools'; // For getting faculties of a school
const API_MAJORS = 'http://localhost:5009/api/majors'; // New Major Service
const API_UNIS = 'http://localhost:5008/api/unis'; // New Uni Service

// Data Storage
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

// Knowledge Blocks data structure
let majorKnowledgeBlocksData = {
    'cso_nganh': { name: 'Khối kiến thức cơ sở ngành', courses: [] },
    'bo_tro': { name: 'Khối kiến thức bổ trợ', courses: [] },
    'giao_duc_dai_cuong': { name: 'Khối kiến thức giáo dục đại cương', courses: [] },
    'chuyen_nganh': { name: 'Khối kiến thức chuyên ngành', courses: [] },
    'thuc_tap': { name: 'Khối thực tập', courses: [] }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadCourses();
    loadGrades();
    loadFaculties();
    loadMajors();
    loadGeneralInfo();
});


// Toast Notification
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
             // Find array index or select by id logic if needed, 
             // but simpler: just find the button that calls this pageId
             // This part was 'event.target.classList.add' in original which relies on global event
             const btn = document.querySelector(`button[onclick="showPage('${pageId}')"]`);
             if (btn) btn.classList.add('active');
        }
    } else {
         // Fallback for manual calls (initial load maybe?)
         const btn = document.querySelector(`button[onclick="showPage('${pageId}')"]`);
         if (btn) btn.classList.add('active');
    }
    
    if (pageId === 'home') {
        updateDashboard();
    } else if (pageId === 'grades') {
        updateGradeSelects();
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
        // Map API data to local structure if needed (API returns snake_case usually, but let's check keys)
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
    const courseToBlockModal = document.getElementById('courseToBlockModal');
    
    if (event.target == studentModal) closeStudentModal();
    if (event.target == courseModal) closeCourseModal();
    if (event.target == facultyModal) closeFacultyModal();
    if (event.target == schoolModal) closeSchoolModal();
    if (event.target == schoolDetailModal) closeSchoolDetailModal();
    if (event.target == majorModal) closeMajorModal();
    if (event.target == courseToBlockModal) closeCourseToBlockModal();
}

async function deleteStudent(id) {
    if (!confirm('Bạn có chắc muốn xóa sinh viên này?')) return;
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
}

function renderStudents(data = students) {
    const tbody = document.getElementById('studentTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center-muted">Chưa có dữ liệu </td></tr>';
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
            <td class="action-btns">
                <button class="action-btn btn-secondary" onclick="editStudent('${s.id}')">Sửa</button>
                <button class="action-btn btn-danger" onclick="deleteStudent('${s.id}')">Xóa</button>
            </td>
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

    if (!id || !name || !credits) {
        showToast('Thiếu thông tin bắt buộc');
        return;
    }

    if (!editingCourseId && courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Tên học phần đã tồn tại! Vui lòng chọn tên khác.');
        return;
    }

    const payload = {
        course_id: id,
        course_name: name,
        total_credits: parseInt(credits),
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
            <td class="action-btns">
                <button class="action-btn btn-secondary" onclick="editCourse('${c.id}')">Sửa</button>
                <button class="action-btn btn-danger" onclick="deleteCourse('${c.id}')">Xóa</button>
            </td>
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
    if (!confirm('Bạn có chắc muốn xóa học phần này?')) return;
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
        grades = data.map(e => ({
            id: e.enrollment_id, // Important for PUT
            studentId: e.student_id,
            courseId: e.course_code,
            grade: e.grade, // Final grade
            created_at: e.enrollment_date
            // Note: scores components might be in e.component_scores dict
        }));
        renderGrades();
        updateDashboard();
    } catch (err) {
        console.error(err);
    }
}

async function addGrade() {
    const studentId = document.getElementById('gradeStudentId').value;
    const courseId = document.getElementById('gradeCourseId').value;
    const attendance = parseFloat(document.getElementById('gradeAttendance').value) || 0;
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
            // Using weighted average logic from backend: needs 'scores' and 'weights'
            // Or just 'grade' if we want to override final directly. 
            // Let's send components to let backend calculate? 
            // Backend supports 'scores' list. Let's say [attendance, midterm, final]
            // And weights [10, 40, 50]
            const payload = {
                scores: [attendance, midterm, final],
                weights: [10, 40, 50]
            };
            
            const res = await fetch(`${API_GRADES}/${enrollmentId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                showToast('Nhập điểm thành công!');
                clearGradeForm();
                loadGrades();
            } else {
                const err = await res.json();
                showToast('Lỗi nhập điểm: ' + err.error);
            }
        } catch(e) {
            showToast('Lỗi kết nối khi nhập điểm');
        }
    } else {
            showToast('Đăng ký môn thành công (Chưa có điểm final để tính)');
            loadGrades();
    }
}

function renderGrades(data = grades) {
    const tbody = document.getElementById('gradeTableBody');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center-muted">Chưa có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(g => {
        // Local lookup for names (optimization: could fetching names be better?)
        const s = students.find(st => st.id === g.studentId) || { name: g.studentId };
        const c = courses.find(co => co.id === g.courseId) || { name: g.courseId };
        const gradeDisplay = (g.grade !== null) ? parseFloat(g.grade).toFixed(2) : '-';
        
        return `
        <tr>
            <td>${g.studentId}</td>
            <td>${s.name}</td>
            <td>${g.courseId}</td>
            <td>${c.name}</td>
            <td>-</td> 
            <td>-</td> 
            <td>-</td> 
            <td>${gradeDisplay}</td>
            <td class="action-btns">
                <button class="action-btn btn-danger" onclick="deleteGrade('${g.id}')">Hủy</button>
            </td>
        </tr>
        `;
    }).join('');
}

async function deleteGrade(id) {
        if (!confirm('Hủy đăng ký học phần này?')) return;
        try {
        const res = await fetch(`${API_ENROLLMENTS_SVC}/${id}`, { method: 'DELETE' });
        if (res.ok) loadGrades();
        else showToast('Lỗi khi hủy');
        } catch(e) { showToast('Lỗi kết nối'); }
}

function clearGradeForm() {
    document.getElementById('gradeStudentId').value = '';
    document.getElementById('gradeCourseId').value = '';
    document.getElementById('gradeAttendance').value = '';
    document.getElementById('gradeMidterm').value = '';
    document.getElementById('gradeFinal').value = '';
}

function updateGradeSelects() {
    const studentSelect = document.getElementById('gradeStudentId');
    const courseSelect = document.getElementById('gradeCourseId');
    
    studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>' + 
        students.map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`).join('');
        
    courseSelect.innerHTML = '<option value="">-- Chọn học phần --</option>' + 
        courses.map(c => `<option value="${c.id}">${c.id} - ${c.name}</option>`).join('');
}

function searchGrades() {
    const searchTerm = document.getElementById('searchGrade').value.toLowerCase();
    const filterCol = document.getElementById('filterColumnGrade').value;

    const filtered = grades.filter(g => {
        const matchesTerm = (val) => val && String(val).toLowerCase().includes(searchTerm);
        
        if (filterCol === 'all') {
            return matchesTerm(g.studentId) || matchesTerm(g.courseId);
        } else if (filterCol === 'studentId') {
            return matchesTerm(g.studentId);
        } else if (filterCol === 'courseId') {
            return matchesTerm(g.courseId);
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
        const schools = rawSchools.map(s => ({
            id: s.mem_school_id,
            name: s.mem_school_name,
            website: s.mem_school_websit
        }));
        
        const container = document.getElementById('school-info-section');
        if (!container) return;

        if (!schools || schools.length === 0) {
            container.innerHTML = '<p class="text-center-muted">Chưa có thông tin trường</p>';
            return;
        }

        container.innerHTML = schools.map(s => `
            <div style="background: white; padding: 25px; border-radius: var(--radius); box-shadow: var(--shadow-sm); margin-bottom: 20px; border-left: 5px solid var(--secondary);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <h2 style="margin: 0 0 15px 0; color: var(--primary); font-size: 1.5rem;">${s.name}</h2>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="viewSchoolDetails('${s.id}', '${s.name}')">Xem chi tiết</button>
                        <button class="btn btn-secondary btn-sm" onclick="editSchool('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSchool('${s.id}')"><i class="fa-solid fa-trash"></i></button>
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

    } catch(e) {
        console.error("Error loading general info:", e);
        const container = document.getElementById('school-info-section');
        if(container) container.innerHTML = '<p class="text-center-muted">Không thể tải thông tin trường</p>';
    }
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
        document.getElementById('schoolWebsite').value = s.mem_school_websit || '';
        document.getElementById('schoolModal').style.display = 'block';

    } catch (e) {
        showToast('Lỗi: ' + e.message);
    }
}

async function deleteSchool(id) {
    if(!confirm('Bạn có chắc chắn muốn xóa trường này?')) return;
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
            mem_school_websit: website
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
    if (schoolId) {
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
        let schoolName = f.school_name || '---';
        if (!f.school_name && f.mem_school_id && schools.length > 0) {
            const school = schools.find(s => (s.mem_school_id || s.id) == f.mem_school_id);
            if (school) {
                schoolName = school.mem_school_name || school.name;
            }
        }
        
        return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
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
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-university" style="width: 16px;"></i> <strong>${schoolName}</strong>
                    </div>
                </div>
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
                <button class="action-btn btn-secondary" onclick="editFaculty('${f.fac_id}')">
                    <i class="fa-solid fa-pen"></i> Sửa
                </button>
                <button class="action-btn btn-danger" onclick="deleteFaculty('${f.fac_id}')">
                    <i class="fa-solid fa-trash"></i> Xóa
                </button>
            </div>
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

    if (!schoolId) {
        showToast('Vui lòng chọn Trường cho khoa này');
        return;
    }

    const payload = {
        fac_id: id,
        fac_name: name,
        fac_address: address,
        fac_email: email,
        fac_number: phone,
        mem_school_id: schoolId
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
    if (!confirm('Bạn có chắc muốn xóa khoa này?')) return;
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
        select.innerHTML = '<option value="">-- Chọn Trường --</option>';
        
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
        if (!fName && faculties.length > 0) {
            const f = faculties.find(fac => fac.fac_id == m.facId);
            if (f) fName = f.fac_name;
        }
        
        return `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.credits || '-'}</td>
                <td>${fName || m.facId || '-'}</td>
                <td class="action-btns">
                    <button class="action-btn btn-primary" onclick="openMajorKnowledgeBlocks('${m.id}')">Xem chi tiết</button>
                    <button class="action-btn btn-secondary" onclick="editMajor('${m.id}')">Sửa</button>
                    <button class="action-btn btn-danger" onclick="deleteMajor('${m.id}')">Xóa</button>
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
    if (!confirm('Bạn có chắc muốn xóa ngành học này?')) return;
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

function openAddCourseToBlockModal() {
    // Populate major select
    const select = document.getElementById('blockMajorId');
    select.innerHTML = '<option value="">-- Chọn ngành học --</option>';
    majors.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.name} (ID: ${m.id})`;
        select.appendChild(option);
    });
    
    // Set to selected major if any
    if (selectedMajorForBlocks) {
        select.value = selectedMajorForBlocks;
    }
    
    document.getElementById('courseToBlockModal').style.display = 'block';
}

function closeCourseToBlockModal() {
    document.getElementById('courseToBlockModal').style.display = 'none';
    clearCourseToBlockForm();
}

function clearCourseToBlockForm() {
    document.getElementById('blockMajorId').value = '';
    document.getElementById('blockType').value = '';
    document.getElementById('blockCourseId').value = '';
    document.getElementById('blockCourseName').value = '';
    document.getElementById('blockCourseCredits').value = '';
}

async function addCourseToBlock() {
    const majorId = document.getElementById('blockMajorId').value.trim();
    const blockType = document.getElementById('blockType').value.trim();
    const courseId = document.getElementById('blockCourseId').value.trim();
    const courseName = document.getElementById('blockCourseName').value.trim();
    const courseCredits = document.getElementById('blockCourseCredits').value.trim();

    if (!majorId || !blockType || !courseId || !courseName) {
        showToast('Vui lòng điền tất cả thông tin bắt buộc', 'warning');
        return;
    }

    const payload = {
        course_id: courseId,
        course_name: courseName,
        course_credits: courseCredits ? parseInt(courseCredits) : 0
    };

    try {
        const res = await fetch(`${API_MAJORS}/${majorId}/knowledge-blocks/${blockType}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            showToast('Lỗi: ' + (err.error || 'Unknown error'));
            return;
        }

        showToast('Thêm học phần thành công');
        closeCourseToBlockModal();
        loadKnowledgeBlocks(majorId);
    } catch (err) {
        showToast('Lỗi kết nối: ' + err.message);
    }
}

async function removeCourseFromBlock(majorId, blockType, courseId) {
    if (!confirm('Bạn có chắc muốn xóa học phần này khỏi khối kiến thức?')) return;

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
}

// ===== END KNOWLEDGE BLOCKS FUNCTIONS =====
 
// --- KKT Logic Removed ---


