<template>
  <div class="requests-page">
    <div class="signup-wrapper">
      <div class="sidebar-wrapper">
        <button class="hamburger" @click="sidebarOpen = !sidebarOpen">☰</button>

        <div class="sidebar" :class="{ open: sidebarOpen }">
          <div class="sidebar-header">
            <button class="close-btn" @click="sidebarOpen = false">✖</button>
            <p>{{ user.fullname }}</p>
            <p>{{ user.phone_number }}</p>
          </div>
          <ul class="sidebar-menu">
            <li @click="goToPage('EditUserDashboard')">Account</li>
            <li @click="goToPage('DashboardPage')">Dashboard</li>
            <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('MeetingsPage')">My Bookings</li>
            <li @click="goToPage('UsersFavouritesPage')">My Favourites</li>
            <li @click="goToPage('CalendarPage')">My Calendar</li>
            <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('AddPetPage')">Add Pet</li>
            <li @click="goToPage('LogoutPage')">Log Out</li>
          </ul>
        </div>
      </div>
      <h2 class="title">Your Pet Meeting Requests</h2>
      <div v-if="requests.length === 0" class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-text">No meetings scheduled.</div>
      </div>
      <ul v-else>
        <li v-for="req in requests" :key="req.id" :class="['booking-card', getStatusClass(req.confirmation)]">
          <div class="booking-card-header">
            <div :class="['calendar-icon']"></div>
            <p class="booking-card-heading"><b>{{ req.pet_name }}</b> on {{ formatDate(req.date) }} at {{ formatTime(req.time) }}</p>
          </div>
          <!-- Show status: confirmed, denied, or pending -->
          <div
            class="booking-status"
            :class="statusColorClass(req.confirmation)"
          >
            {{ getStatusLabel(req.confirmation) }}
          </div>

        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  name: 'PetRequestsPage',
  props: {
    user: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return { 
      requests: [],
      sidebarOpen: false
    };
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    async load() {
      try {
        const { data } = await axios.get(`${backendUrl}api/meetings/user`, { withCredentials: true });
        this.requests = data;
      } catch (e) {
        console.error('Failed to load requests', e);
      }
    },
    formatDate(dateStr) {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2,'0');
      const month = String(d.getMonth()+1).padStart(2,'0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    },
    formatTime(timeStr) {
      const [h,m] = timeStr.split(':');
      let hour = parseInt(h,10);
      const minute = m;
      const ampm = hour>=12?'PM':'AM';
      hour = hour%12||12;
      return `${hour}:${minute} ${ampm}`;
    },
    getStatusClass(status) {
      if (status === 1) return 'accepted';
      if (status === 0) return 'pending';
      return 'completed';
    },
    statusColorClass(status) {
      if (status === 1) return 'status-accepted';
      if (status === 0) return 'status-pending';
      return 'status-completed';
    },
    getStatusLabel(status) {
      if (status === 1) return 'Accepted';
      if (status === 0) return 'Denied';
      else return 'Pending';
    },
  },
  mounted() {
    this.load();
  }
};
</script>

<style scoped>
.meeting-card {
   margin-bottom: 10px; 
}

.meetings-page button {
   margin-left: 6px; 
}

.signup-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  min-height: 100vh;
}

.hamburger {
  position: fixed;
  top: 20px;
  left: 20px;
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1000; /* above sidebar */
}

.sidebar {
    width: 240px;
    background-color: white;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0px;
    position: fixed;
    top: 0;
    left: -240px;          /* 🆕 hide off-screen by default */
    height: 100%;
    transition: left 0.3s ease;
    z-index: 1000;
}

.sidebar.open {
  left: 0;               /* already defined—brings it back on screen */
}

/* Header with blue background and paw prints */
.sidebar-header {
    background-color: #2196f3;
    padding: 20px;
    position: relative;
    overflow: hidden;
    color: white;
}

.title {
  margin-bottom: 10px;
}

/* Paw print patterns */
.sidebar-header::before,
.sidebar-header::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 30px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
}

.sidebar-header::before {
    top: 10px;
    left: 10px;
    transform: rotate(45deg);
}

.sidebar-header::after {
    top: 40px;
    right: 20px;
    transform: rotate(-15deg);
}

.sidebar ul {
  list-style: none;
}

.sidebar li {
  margin-bottom: 15px;
  cursor: pointer;
  font-size: 16px;
  color: #333;
}

.sidebar li:hover {
  color: #007BFF;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}

/* Additional paw prints */
.paw-print {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.paw-print::before,
.paw-print::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.paw-print:nth-child(1) {
    top: 15px;
    right: 40px;
}

.paw-print:nth-child(2) {
    bottom: 10px;
    left: 30px;
}

.paw-print::before {
    top: -8px;
    left: 2px;
}

.paw-print::after {
    top: -8px;
    right: 2px;
}

/* Navigation menu */
.sidebar-menu {
    flex: 1;
    padding: 20px;
}
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.calendar-container {
  width: 100%;
  max-width: 450px;
  min-height: 100vh;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.content {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 15px;
}

.booking-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.booking-card-header {
  display: flex;
}

.booking-card-heading {
  margin-top: 17px;
}

.accept-deny-button {
  display: flex;
  margin-bottom: 10px;
  gap: 40px;
}

.accept-button {
  background-color: #bcffbf;
  border: none;
  color: #2b752e;
  padding: 7px;
  border-radius: 10px;
}

.deny-button {
  background-color: #ffacac;
  border: none;
  color: #902121;
  padding: 7px;
  border-radius: 10px;
}

.calendar-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  position: relative;
}

.calendar-icon::before {
  content: '';
  width: 24px;
  height: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.calendar-icon.accepted {
  background-color: #e3f2fd;
}

.calendar-icon.pending {
  background-color: #ffebee;
}

.calendar-icon.completed {
  background-color: #e8f5e8;
}

.booking-details {
  flex: 1;
}

.pet-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 5px;
}

.booking-time,
.booking-location {
  font-size: 14px;
  color: #666;
}

.booking-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  text-align: center;
  min-width: 70px;
}

.status-accepted {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-pending {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-completed {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.sync-button {
  width: 100%;
  padding: 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sync-button:hover {
  background-color: #0056b3;
}

.sync-button:active {
  transform: translateY(1px);
}

.sync-icon {
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='23 4 23 10 17 10'%3E%3C/polyline%3E%3Cpolyline points='1 20 1 14 7 14'%3E%3C/polyline%3E%3Cpath d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 16px;
  color: #666;
}

/* Responsive */
@media (max-width: 350px) {
  .calendar-container {
    max-width: 100%;
  }

  .content {
    padding: 15px;
  }

  .booking-card {
    padding: 12px;
  }
}
</style>
