// Constants
const ADMIN_PASSWORD = 'admin123';
const STORAGE_KEY = 'hospitalAppointmentsData';

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setMinimumDate();
    loadDoctors();
    updateHeaderName();
});

// Initialize data structure
function initializeApp() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultData = {
            hospitalName: 'City Hospital',
            hospitalHours: {
                weekdayStart: '09:00',
                weekdayEnd: '17:00',
                saturdayStart: '10:00',
                saturdayEnd: '14:00'
            },
            doctors: [
                { id: 1, name: 'Dr. John Smith', specialty: 'General Medicine', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                { id: 2, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                { id: 3, name: 'Dr. Mike Davis', specialty: 'Orthopedics', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                { id: 4, name: 'Dr. Emily Wilson', specialty: 'Dermatology', startTime: '09:00', endTime: '17:00', slotDuration: 30 }
            ],
            appointments: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    }
}

// Get all data
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

// Save data
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Update header name
function updateHeaderName() {
    const data = getData();
    document.getElementById('hospitalNameDisplay').textContent = '🏥 ' + data.hospitalName;
}

// PAGE NAVIGATION
function showLoginPage() {
    hideAllPages();
    document.getElementById('loginPage').style.display = 'block';
    setActiveNav('');
}

function showBookingPage() {
    hideAllPages();
    document.getElementById('bookingPage').style.display = 'block';
    setActiveNav('navBooking');
}

function showDashboard() {
    if (!isAdminLoggedIn()) {
        showLoginPage();
        return;
    }
    hideAllPages();
    document.getElementById('dashboardPage').style.display = 'block';
    setActiveNav('navDashboard');
    loadDashboardData();
}

function showSettings() {
    if (!isAdminLoggedIn()) {
        showLoginPage();
        return;
    }
    hideAllPages();
    document.getElementById('settingsPage').style.display = 'block';
    setActiveNav('navSettings');
    loadSettingsPage();
}

function hideAllPages() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('bookingPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'none';
}

function setActiveNav(navId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    if (navId) {
        document.getElementById(navId)?.classList.add('active');
    }
}

// ADMIN LOGIN/LOGOUT
function adminLogin(event) {
    event.preventDefault();
    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
        updateAdminUI();
        showDashboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function adminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    updateAdminUI();
    showBookingPage();
}

function isAdminLoggedIn() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
}

function updateAdminUI() {
    const loggedIn = isAdminLoggedIn();
    document.getElementById('adminLoginBtn').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('adminLogoutBtn').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('navDashboard').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('navSettings').style.display = loggedIn ? 'block' : 'none';
}

// PATIENT BOOKING
function setMinimumDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.addEventListener('change', loadAvailableTimes);
    document.getElementById('doctor').addEventListener('change', loadAvailableTimes);
}

function loadDoctors() {
    const data = getData();
    const doctorSelect = document.getElementById('doctor');
    doctorSelect.innerHTML = '<option value="">-- Choose a Doctor --</option>';

    data.doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.name;
        option.textContent = `${doctor.name} (${doctor.specialty})`;
        doctorSelect.appendChild(option);
    });
}

function loadAvailableTimes() {
    const date = document.getElementById('date').value;
    const doctorName = document.getElementById('doctor').value;
    const timeSelect = document.getElementById('time');

    if (!date || !doctorName) {
        timeSelect.innerHTML = '<option value="">-- Select date and doctor first --</option>';
        return;
    }

    const data = getData();
    const doctor = data.doctors.find(d => d.name === doctorName);
    if (!doctor) return;

    const slots = generateTimeSlots(doctor.startTime, doctor.endTime, doctor.slotDuration);
    const bookedSlots = data.appointments
        .filter(apt => apt.date === date && apt.doctor === doctorName && apt.status === 'confirmed')
        .map(apt => apt.time);

    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));

    timeSelect.innerHTML = '<option value="">-- Select Time --</option>';
    if (availableSlots.length > 0) {
        availableSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSelect.appendChild(option);
        });
    } else {
        timeSelect.innerHTML = '<option value="">-- No available slots --</option>';
    }
}

function generateTimeSlots(startTime, endTime, durationMinutes) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    while (currentTime < endTimeMinutes) {
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        currentTime += durationMinutes;
    }

    return slots;
}

function bookAppointment(event) {
    event.preventDefault();

    const patientName = document.getElementById('patientName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const doctor = document.getElementById('doctor').value;
    const reason = document.getElementById('reason').value;

    if (!patientName || !email || !phone || !date || !time || !doctor) {
        document.getElementById('errorMessage').textContent = '✗ Please fill all required fields';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }

    const data = getData();
    const appointment = {
        id: Date.now().toString(),
        patientName,
        email,
        phone,
        date,
        time,
        doctor,
        reason: reason || '',
        status: 'confirmed',
        bookedAt: new Date().toISOString()
    };

    data.appointments.push(appointment);
    saveData(data);

    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('appointmentForm').reset();
    document.getElementById('time').innerHTML = '<option value="">-- Select date and doctor first --</option>';

    setTimeout(() => {
        document.getElementById('successMessage').style.display = 'none';
    }, 5000);
}

// ADMIN DASHBOARD
function loadDashboardData() {
    const data = getData();
    const appointments = data.appointments;
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('totalAppointments').textContent = appointments.length;
    document.getElementById('confirmedCount').textContent = appointments.filter(a => a.status === 'confirmed').length;
    document.getElementById('cancelledCount').textContent = appointments.filter(a => a.status === 'cancelled').length;
    document.getElementById('todayCount').textContent = appointments.filter(a => a.date === today && a.status === 'confirmed').length;

    const appointmentsList = document.getElementById('appointmentsList');
    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<div class="empty-message">No appointments yet</div>';
        return;
    }

    const sorted = [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date));

    appointmentsList.innerHTML = sorted.map(apt => `
        <div class="appointment-item">
            <div class="appointment-header">
                <div class="appointment-name">${apt.patientName}</div>
                <span class="appointment-status ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}">
                    ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </span>
            </div>
            <div class="appointment-details">
                <div class="appointment-detail"><strong>Email:</strong> ${apt.email}</div>
                <div class="appointment-detail"><strong>Phone:</strong> ${apt.phone}</div>
                <div class="appointment-detail"><strong>Doctor:</strong> ${apt.doctor}</div>
                <div class="appointment-detail"><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</div>
                <div class="appointment-detail"><strong>Time:</strong> ${apt.time}</div>
                <div class="appointment-detail"><strong>Reason:</strong> ${apt.reason || '-'}</div>
            </div>
            ${apt.status === 'confirmed' ? `
                <div class="appointment-actions">
                    <button class="btn-cancel" onclick="cancelAppointment('${apt.id}')">Cancel Appointment</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    const data = getData();
    const apt = data.appointments.find(a => a.id === id);
    if (apt) {
        apt.status = 'cancelled';
        saveData(data);
        loadDashboardData();
    }
}

// ADMIN SETTINGS
function loadSettingsPage() {
    const data = getData();

    // Load hospital info
    document.getElementById('hospitalName').value = data.hospitalName;
    document.getElementById('weekdayStart').value = data.hospitalHours.weekdayStart;
    document.getElementById('weekdayEnd').value = data.hospitalHours.weekdayEnd;
    document.getElementById('saturdayStart').value = data.hospitalHours.saturdayStart;
    document.getElementById('saturdayEnd').value = data.hospitalHours.saturdayEnd;

    // Load doctors
    loadDoctorsList();
    loadTimingsDoctorSelect();

    // Show first tab
    showTab('hospital-tab');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.getElementById(tabId).style.display = 'block';

    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function updateHospitalInfo(event) {
    event.preventDefault();
    const data = getData();

    data.hospitalName = document.getElementById('hospitalName').value;
    data.hospitalHours = {
        weekdayStart: document.getElementById('weekdayStart').value,
        weekdayEnd: document.getElementById('weekdayEnd').value,
        saturdayStart: document.getElementById('saturdayStart').value,
        saturdayEnd: document.getElementById('saturdayEnd').value
    };

    saveData(data);
    updateHeaderName();

    document.getElementById('hospitalSuccess').style.display = 'block';
    setTimeout(() => {
        document.getElementById('hospitalSuccess').style.display = 'none';
    }, 3000);
}

function addDoctor(event) {
    event.preventDefault();
    const data = getData();

    const doctor = {
        id: Date.now(),
        name: document.getElementById('doctorName').value,
        specialty: document.getElementById('doctorSpecialty').value,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
    };

    data.doctors.push(doctor);
    saveData(data);

    document.getElementById('doctorName').value = '';
    document.getElementById('doctorSpecialty').value = '';

    loadDoctorsList();
    loadDoctors();
    loadTimingsDoctorSelect();
}

function loadDoctorsList() {
    const data = getData();
    const doctorsList = document.getElementById('doctorsList');
    const noDoctorsMsg = document.getElementById('noDoctorsMsg');

    if (data.doctors.length === 0) {
        doctorsList.innerHTML = '';
        noDoctorsMsg.style.display = 'block';
        return;
    }

    noDoctorsMsg.style.display = 'none';
    doctorsList.innerHTML = data.doctors.map(doctor => `
        <div class="doctor-item">
            <div class="doctor-info">
                <h4>${doctor.name}</h4>
                <p>${doctor.specialty}</p>
            </div>
            <div class="doctor-actions">
                <button class="btn-delete" onclick="deleteDoctor(${doctor.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function deleteDoctor(id) {
    if (!confirm('Are you sure you want to delete this doctor? This will also delete all their appointments.')) return;

    const data = getData();
    const doctor = data.doctors.find(d => d.id === id);
    if (!doctor) return;

    data.doctors = data.doctors.filter(d => d.id !== id);
    data.appointments = data.appointments.filter(apt => apt.doctor !== doctor.name);
    saveData(data);

    loadDoctorsList();
    loadDoctors();
    loadTimingsDoctorSelect();
}

function loadTimingsDoctorSelect() {
    const data = getData();
    const select = document.getElementById('timingDoctor');
    select.innerHTML = '<option value="">-- Choose a Doctor --</option>';

    data.doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = `${doctor.name} (${doctor.specialty})`;
        select.appendChild(option);
    });
}

function loadDoctorTimingDetails() {
    const doctorId = document.getElementById('timingDoctor').value;
    if (!doctorId) {
        document.getElementById('timingDetails').style.display = 'none';
        return;
    }

    const data = getData();
    const doctor = data.doctors.find(d => d.id === parseInt(doctorId));

    if (doctor) {
        document.getElementById('startTime').value = doctor.startTime;
        document.getElementById('endTime').value = doctor.endTime;
        document.getElementById('slotDuration').value = doctor.slotDuration;
        document.getElementById('timingDetails').style.display = 'block';
    }
}

function updateDoctorTimings(event) {
    event.preventDefault();
    const doctorId = document.getElementById('timingDoctor').value;

    if (!doctorId) {
        alert('Please select a doctor');
        return;
    }

    const data = getData();
    const doctor = data.doctors.find(d => d.id === parseInt(doctorId));

    if (doctor) {
        doctor.startTime = document.getElementById('startTime').value;
        doctor.endTime = document.getElementById('endTime').value;
        doctor.slotDuration = parseInt(document.getElementById('slotDuration').value);
        saveData(data);

        alert('Doctor timings updated successfully!');
        loadAvailableTimes();
    }
}

// Initialize admin UI on page load
updateAdminUI();
showBookingPage();
