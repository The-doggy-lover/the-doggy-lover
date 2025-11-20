<!-- PetDescriptionPage.vue -->
<template>
  <div class="container">
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
    <!-- Hero Section with Image and Buttons -->
    <div class="hero-section">
      <img :src="backendUrl +  '/pet-pics/' + pet?.pet_photo" alt="Pet photo" class="hero-image" />
    </div>

    <!-- Content Section -->
    <div class="content" v-if="pet">
      <!-- Pet Info -->
      <div class="pet-info">
        <div style="padding: 10px;" class="pet-name">{{ pet.pet_name }}</div>
        <div class="pet-breed">{{ pet.breed }}</div>
        <div class="pet-attributes">
          <div class="attribute-tag attribute-age">{{ pet.age }}</div>
          <div class="attribute-tag" :class="pet.gender === 'Female' ? 'attribute-female' : 'attribute-weight'">{{ pet.gender }}</div>
        </div>

        <div class="location">
          <span class="location-text">Location: {{ pet.location }}</span>
        </div>
      </div>

      <!-- Description -->
      <div class="description-section">
        <div class="section-title">About</div>
        <div class="description-text">{{ pet.description }}</div>
      </div>

      <!-- Feature Badges -->
      <div class="feature-badges">
        <div class="feature-badge badge-vaccinated" v-if="pet.vaccinated">
          ✅ Vaccinated
        </div>
      </div>

      <!-- Available Time -->
      <div v-if="pet.available_start_time" class="time-section">
        <div class="section-title">Available Time</div>
        <div class="time-slots">
          <div class="time-slot selected">
            {{ pet.available_start_time }}
          </div>
          <div class="time-slot selected">
            {{ pet.available_end_time }}
          </div>
        </div>
      </div>

      <!-- Book Now -->
      <button class="book-button" @click="bookAppointment">
        Book an Appointment with the Pet
      </button>
    </div>

    <div v-else class="content">
      <p>Loading pet details...</p>
    </div>
  </div>
</template>


<script>
  const backendUrl = process.env.VUE_APP_API_URL
export default {
  props: ['pet', 'user'],
  data() {
    return {
      backendUrl,
      sidebarOpen: false,
    };
  },
  methods: {
    bookAppointment() {
      this.$emit('change-page', 'BookPetAppointmentPage', { pet: this.pet });
    },
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    }
  },
  mounted() {
    console.log('Pet received in description page:', this.pet);
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

body {
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.container {
  width: 100%;
  max-width: 375px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Hero Image Section */
.hero-section {
  position: relative;
  height: 300px;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hamburger {
  position: fixed;
  top: 20px;
  left: 20px;
  font-size: 28px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1000;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  position: fixed;
  top: 0;
  left: -240px;
  height: 100%;
  transition: left 0.3s ease;
  z-index: 1000;
}

.sidebar.open {
  left: 0;
}

.sidebar-header {
  background-color: #2196f3;
  padding: 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

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

.sidebar-menu {
  list-style: none;
  padding: 20px;
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

.favorite-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.heart-icon {
  color: #ff3b30;
  font-size: 18px;
}

/* Content Section */
.content {
  padding: 20px;
  border-radius: 20px 20px 0 0;
  margin-top: -20px;
  position: relative;
  z-index: 2;
}

/* Pet Info */
.pet-info {
  margin-bottom: 20px;
}

.pet-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 5px;
}

.pet-breed {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

.pet-attributes {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.attribute-tag {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.attribute-female {
  background-color: #ffeef0;
  color: #d63384;
}

.attribute-age {
  background-color: #fff3cd;
  color: #856404;
}

.attribute-weight {
  background-color: #d1ecf1;
  color: #0c5460;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.location-icon {
  width: 16px;
  height: 16px;
  color: #999;
}

.location-text {
  font-size: 14px;
  color: #999;
}

/* Description Section */
.description-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.description-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

/* Feature Badges */
.feature-badges {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.feature-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-vaccinated {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.badge-kid-friendly {
  background-color: #ffeef0;
  color: #d63384;
}

.badge-icon {
  font-size: 14px;
}

/* Available Time Section */
.time-section {
  margin-bottom: 30px;
}

.time-slots {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.time-slot {
  flex: 1;
  padding: 12px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f9f9f9;
}

.time-slot:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
  color: #007bff;
}

.time-slot.selected {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

/* Book Now Button */
.book-button {
  width: 100%;
  padding: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 20px;
}

.book-button:hover {
  background-color: #0056b3;
}

.book-button:active {
  transform: translateY(1px);
}

/* Responsive Design */
@media (max-width: 375px) {
  .container {
      max-width: 100%;
  }
  
  .content {
      padding: 15px;
  }
  
  .time-slots {
      gap: 8px;
  }
  
  .time-slot {
      padding: 10px 6px;
      font-size: 13px;
  }
}
</style>