<template>
  <div class="dashboard">
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
          <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('MeetingsPage')">My Bookings</li>
          <li @click="goToPage('UsersFavouritesPage')">My Favourites</li>
          <li @click="goToPage('CalendarPage')">My Calendar</li>
          <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('AddPetPage')">Add Pet</li>
          <li @click="goToPage('LogoutPage')">Log Out</li>
        </ul>
      </div>
    </div>

    <!-- Centered content wrapper -->
    <div class="signup-wrapper">

      <div class="welcome-banner">
        <div class="text-block">
          <h2 v-if="user" class="greeting">Welcome, {{ user.fullname }}</h2>
          <p class="main-content"><b>Spend time with pets near you!</b></p>
          <button @click="goToPage('BrowsePetsPage')" class="book-button">🐶 Book Now</button>
        </div>

        <img class="banner-pic" src="/banner-pic.png" alt="banner-pic" />
      </div>


      <!-- Meeting Section -->
      <div>
        <h2 class="greeting">Your Meetings</h2>
        <!-- Mobile View Button -->
        <div v-if="isMobile && upcomingMeetings.length > 0" class="mobile-meetings-button">
          <button @click="goToCalendar" class="mobile-meeting-btn">
            Your Meetings ({{ upcomingMeetings.length }})
          </button>
        </div>

        <div v-if="upcomingMeetings && upcomingMeetings.length > 0">
          <div v-if="!isMobile" class="meetings-grid">
            <div v-for="meeting in upcomingMeetings" :key="meeting.id" class="meeting-card">
              <div class="meet-details">
                <img class="calendar-icon" src="/calendar-icon.png" alt="calendar icon" />
                <div class="meeting-details">
                  <strong>{{ meeting.pet_name }}</strong>
                  on {{ formatDate(meeting.date) }} at {{ formatTime(meeting.time) }}
                  <span v-if="Number(meeting.confirmation) === 0" class="declined">(declined)</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="mobile-meetings-button">
            <button @click="goToCalendar" class="mobile-meeting-btn">
              Your Meetings ({{ upcomingMeetings.length }})
            </button>
          </div>
        </div>

        <div v-else>
          No upcoming meetings.
        </div>
      </div>


      <!-- Browse Pets -->
      <div class="browse-pets pet-list">
        <h2 class="greeting">Browse Pets</h2>
        <div class="filters">
          <select v-model="filters.breed">
            <option value="">All Breeds</option>
            <option
              v-for="breed in breedOptions"
              :key="breed.id"
              :value="breed.name"
            >
              {{ breed.name }}
            </option>
          </select>

          <select v-model="filters.age">
            <option value="">All Ages</option>
            <option value="Puppy">Puppy</option>
            <option value="Adult">Adult</option>
            <option value="Senior">Senior</option>
          </select>

          <select v-model="filters.gender">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <label class="distance-filter">
            Distance: {{ filters.distance }} km
            <input class="distance-option" type="range" min="1" max="30" v-model="filters.distance" />
          </label>
        </div>
        <div class="pet-grid">
          <div v-for="pet in filteredPets" :key="pet.id" class="pet-card">
            <img
              :src="backendUrl + '/pet-pics/' + pet.pet_photo"
              alt="Pet photo"
              class="pet-photo"
            />
            <div class="pet-details">
              <h3 class="pet-name">{{ pet.pet_name }}</h3>
              <p class="pet-breed">{{ pet.breed }} · {{ pet.age }} · {{ pet.gender }}</p>
              <button @click="toggleFavourite(pet.id)" class="favorite">
                <span class="heart-icon" v-if="isFavourite(pet.id)">❤️</span>
                <span class="heart-icon" v-else>🤍</span>
              </button>
              <button class="view-profile" @click="openProfile(pet)">View Profile</button>
            </div>
          </div>
        </div>
      </div>

      <!-- My Pets for Pet Owner -->
      <div v-if="user && user.user_type === 'Pet Owner'" class="pet-list">
        <h3 class="greeting">Your Pets</h3>
        <div v-if="myPets.length === 0">You have no pets yet.</div>
        <div v-else>
          <div v-for="pet in myPets" :key="pet.id" class="your-pet-card">
            <img
              v-if="pet.pet_photo"
              class="pet-photo"
              :src="backendUrl + '/pet-pics/' + pet.pet_photo"
              :alt="`Photo of ${pet.pet_name}`"
            />
            <div class="pet-details">
              <h3 class="pet-name">{{ pet.pet_name }}</h3>
              <p class="pet-breed">Breed: {{ pet.breed }}</p>
              <p class="pet-breed">Age: {{ pet.age }}</p>
              <p class="pet-breed">Gender: {{ pet.gender }}</p>
              <p class="pet-breed">Description: {{ pet.description }}</p>
              <p class="pet-breed" v-if="pet.location">Location: {{ pet.location }}</p>
              <p v-else>Location: Not Available</p>
              <p class="pet-breed">Status: {{ pet.isOnline ? 'Online' : 'Offline' }}</p>
              <button @click="togglePetStatus(pet)" class="view-profile">
                Set {{ pet.isOnline ? 'Offline' : 'Online' }}
              </button>
              <button @click="openEditPetDashboard(pet)" class="view-profile">
                Edit Pet Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script>
import axios from 'axios';
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  props: {
    user: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      backendUrl,
      myPets: [],
      recentPets: [],
      editMode: false,
      pets: [],
      breedOptions: [],    // ← NEW
      filters: {
        breed: '',
        age: '',
        gender: '',
        distance: 30
      },
      userCoords: null,
      meetings: [],
      userType: null,
      sidebarOpen: false,
      currentPage: 'DashboardPage',
      selectedPet: null,
      favourites: [],
      activeTab: 'upcoming',
      windowWidth: window.innerWidth,
    };
  },
  computed: {
    filteredPets() {
      const maxDist = Number(this.filters.distance);
      return this.pets.filter(pet => {
        if (!pet.isOnline) return false;
        if (this.filters.breed && pet.breed !== this.filters.breed) return false;
        if (this.filters.gender && pet.gender !== this.filters.gender) return false;
        if (this.filters.age && pet.age !== this.filters.age) return false;

        // if we haven’t got coords or user hasn’t granted location yet, skip distance check
        if (!this.userCoords || !pet.location_coords) return true;

        // parse real coords
        const [lat, lon] = pet.location_coords
          .split(',')
          .map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lon)) return true;  

        // compute distance and compare
        const d = this.calculateDistance(lat, lon);
        return d <= maxDist;
      });
    },
    filteredMeetings() {
      return Array.isArray(this.meetings) ? this.meetings : [];
    },
    upcomingMeetings() {
      const now = new Date();

      console.log("Raw meetings:", this.meetings);

      return (Array.isArray(this.meetings) ? this.meetings : [])
        .filter(meeting => {
          if (!meeting.date || !meeting.time) return false;

          const dateStr = String(meeting.date).slice(0, 10);   // YYYY-MM-DD
          const timeStr = String(meeting.time).slice(0, 5);    // HH:MM

          const meetingTime = new Date(`${dateStr}T${timeStr}`);
          return !isNaN(meetingTime) && meetingTime >= now;
        })
        .sort((a, b) => {
          const aDate = new Date(`${String(a.date).slice(0, 10)}T${String(a.time).slice(0, 5)}`);
          const bDate = new Date(`${String(b.date).slice(0, 10)}T${String(b.time).slice(0, 5)}`);
          return aDate - bDate;
        });
        
    },
    isMobile() {
      return this.windowWidth <= 768;
    }
  },
  methods: {
    filterUpcomingMeetings() {
      const now = new Date();

      this.upcomingMeetings = this.meetings.filter(meeting => {
        const [year, month, day] = meeting.date.split('-');
        const [hour, minute] = meeting.time.split(':');
        const meetingDateTime = new Date(year, month - 1, day, hour, minute);

        console.log("Checking meeting:", meetingDateTime.toString());
        console.log("Now is:", now.toString());

        return meetingDateTime > now;
      });
    },
    openProfile(pet) {
      this.$emit('view-pet-profile', pet);  // send to App.vue
    },
    async fetchFavourites() {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/pets/users/${this.user.id}/favourites`,
          { withCredentials: true }
        );
        // previously you did:
        // this.favourites = data.favourites
        // but your GET now returns an array of pet objects, not { favourites: [...] }
        // so you need to map out their IDs:
        this.favourites = Array.isArray(data)
          ? data.map(pet => pet.id)
          : (data.favourites || []);
      } catch (err) {
        console.error('Error fetching favourites:', err);
      }
    },
    async fetchMeetings() {
      const { data: user } = await axios.get(
        `${backendUrl}/api/auth/me`,
        { withCredentials: true }
      );
      if (user.user_type === 'Pet Owner') {
        await this.fetchOwnerMeetings();
      } else {
        await this.fetchLoverMeetings();
      }
    },
    async fetchOwnerMeetings() {
      const { data } = await axios.get(`${backendUrl}/api/meetings/requests`, { withCredentials:true });
      this.meetings = data;
    },
    async fetchLoverMeetings() {
      const { data } = await axios.get(`${backendUrl}/api/meetings/user`, { withCredentials:true });
      this.meetings = data;
    },
    async toggleFavourite(petId) {
      try {
        const response = await axios.patch(
          `${backendUrl}/api/pets/users/${this.user.id}/favourites`,
          { petId },
          { withCredentials: true }
        );
        this.favourites = response.data.favourites;

        localStorage.setItem('favourites', JSON.stringify(this.favourites));
      } catch (error) {
        console.error('Error toggling favourite:', error);
      }
    },
    isFavourite(petId) {
      return Array.isArray(this.favourites) && this.favourites.includes(petId);
    },
    viewPetProfile(pet) {
      this.selectedPet = pet;
      this.currentPage = 'PetDescriptionPage';
    },
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    async initialize() {
      try {
        const userResponse = await fetch(`${backendUrl}/api/auth/check-auth`, { credentials: 'include' });
        const userData = await userResponse.json();
        this.userId = userData.id;

        const { data: me } = await axios.get(`${backendUrl}/api/auth/me`, { withCredentials: true });
        this.userType = me.user_type;

        const petsResponse = await fetch(`${backendUrl}/api/pets/pets`);
        this.pets = await petsResponse.json();

        await this.fetchMyPets();
        await this.fetchBreedOptions();
        await this.fetchMeetings();
        await this.fetchFavourites();
      } catch (e) {
        console.error('Initialization error:', e);
      }

      // Poll every 30s
      setInterval(this.load, 30000);
    },
    handleProfileUpdate(updatedUser) {
      this.$emit('profile-updated', updatedUser);
    },
    async fetchMyPets() {
      const { data } = await axios.get(`${backendUrl}/api/pets/my-pets`, { withCredentials: true });
      this.myPets = data;
    },
    async fetchRecentPets() {
      // Pets added in the past week, random limit
      const { data } = await axios.get(`${backendUrl}/api/pets/recent`, { withCredentials: true });
      this.recentPets = data;
    },
    async togglePetStatus(pet) {
      const newIsOnline = !pet.isOnline;
      await axios.patch(
        `${backendUrl}/api/pets/${pet.id}/visibility`,
        { isOnline: newIsOnline },
        { withCredentials: true }
      );
      pet.isOnline = newIsOnline;
    },
    openEditPetDashboard(pet) {
      this.$emit('edit-pet', pet);
    },
    goToBooking(petId) {
      this.$emit('change-page', 'BookPetAppointmentPage', { petId });
    },
    async fetchPets() {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/pets/browse`,
          { withCredentials: true }
        );
        this.pets = data;
      } catch (err) {
        console.error('Error fetching pets:', err);
      }
    },
    async fetchBreedOptions() {
      try {
        const { data } = await axios.get(`${backendUrl}/api/breeds/breeds`, { withCredentials: true });
        this.breedOptions = data;
      } catch (err) {
        console.error('Error fetching breeds:', err);
      }
    },
    calculateDistance(lat, lon) {
      if (!this.userCoords) return Infinity;
      const R = 6371;
      const dLat = this.deg2rad(lat - this.userCoords.lat);
      const dLon = this.deg2rad(lon - this.userCoords.lon);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(this.deg2rad(this.userCoords.lat)) *
                Math.cos(this.deg2rad(lat)) *
                Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    deg2rad(d) { return d * Math.PI/180; },
    detectLocation() {
      navigator.geolocation.getCurrentPosition(
        pos => this.userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude },
        err => console.error('Location error:', err)
      );
    },
    applyFilters() {
      // just re-assign to trigger reactivity
      this.filters = { ...this.filters };
    },
    async load() {
      const url = backendUrl + (this.userType === 'Pet Lover' ? '/api/meetings/user' : '/api/meetings/requests');

      try {
        const { data } = await axios.get(`${url}`, {
          withCredentials: true
        });
        this.meetings = data;
      } catch (e) {
        console.error('Failed to load meetings', e);
      }
    },

    formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString();
    },

    formatTime(timeStr) {
      let [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m.toString().padStart(2,'0')} ${ampm}`;
    },
    checkMobile() {
      this.windowWidth = window.innerWidth; // this triggers isMobile to recalculate
    },
    goToCalendar() {
      this.$emit('change-page', 'CalendarPage');
    },
    handleResize() {
      this.$forceUpdate(); // re-trigger computed property
    }
  },
  watch: {
    user(newUser) {
      if (newUser && newUser.user_type) {
        console.log('Now got user_type =', newUser.user_type);
        this.userType = newUser.user_type;
        this.fetchMyPets();
        this.fetchRecentPets();
      }
    }
  },
  mounted() {
    const favs = localStorage.getItem('favourites');
    if (favs) {
      this.favourites = JSON.parse(favs);
    }
    this.initialize();
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth;
    });
  },
  activated() {
  this.fetchFavourites(); // re-fetch favourites when component becomes active
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

body,
html{
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9f9f9;
}

/* Dashboard Layout */
.dashboard {
  width: 100%;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
  margin-top: 0;
}

/* Wrapper */
.signup-wrapper {
  width: 100%;
  max-width: 100vw;
  padding: 0px 10px 20px;
  min-height: 100vh;
  margin-top: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Greeting */
.greeting {
  margin-bottom: 20px;
  margin-top: 10px;
  text-align: center;
}

/* Hamburger */
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

/* Pet Cards Shared Styles */

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px 0;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}


.pet-card,
.your-pet-card {
  width: 100%;
  max-width: 100%;
  background-color: white;
  border-radius: 15px;
  margin: 10px 0;
  padding: 15px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  position: relative;
  overflow: hidden;
  flex-direction: row;
}

.meeting-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.meeting-item {
  background-color: #ffffff;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  line-height: 1.4;
  transition: transform 0.2s ease;
}

.meeting-item:hover {
  transform: scale(1.02);
}

.mobile-meetings-button {
  text-align: center;
  margin: 20px 0;
}

.mobile-meeting-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.mobile-meeting-button button:hover {
  background-color: #0056b3;
}


@media (max-width: 600px) {
  .meeting-container {
    grid-template-columns: 1fr;
  }
}

/* Pet Image */
.pet-photo,
.calendar-icon {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  margin-right: 15px;
}

/* Pet Details */
.pet-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pet-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.pet-breed {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.pet-attributes {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.attribute {
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
}

/* Meeting Details */
.meeting-details {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.meet-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Buttons */
.view-profile {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 10px;
  width: fit-content;
}

.favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.heart-icon {
  color: #ff3b30;
  font-size: 16px;
}

.filters {
  position: sticky;
  top: 5px; /* Adjust based on your header */
  z-index: 1000;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;

  padding: 10px 16px;
  margin: 20px auto;
  max-width: 1200px;

  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.welcome-banner {
  display: flex;
  flex-direction: row;      /* row: text on left, image on right */
  align-items: center; 
  justify-content: space-between;
  gap: 20px;

  padding: 10px;
  margin-bottom: 20px;

  border: 1px solid #ffd900;
  border-radius: 10px;
  background-color: #ffe96c;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  width: 100%;
  height: 160px;            /* thin strip */
}

.text-block {
  display: flex;
  flex-direction: column;   /* stack greeting, text, button */
  justify-content: center;
  gap: 5px;
  
}

.greeting {
  font-size: 1.2rem;
  margin: 0;
}

.main-content {
  font-size: 1rem;
  margin: 0;
}

.book-button {
  padding: 8px 14px;
  font-size: 0.9rem;
  border: 1px solid #ffcc00;
  border-radius: 10px;
  background-color: #f4cf00;
  color: white;
  cursor: pointer;
  width: fit-content;
}

.book-button:hover {
  background-color: #e68900;
}

.banner-pic {
  width: 70px;
  height: 70px;
}


.filters label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-width: 120px;
}

.filters select,
.filters input[type="number"] {
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background-color: white;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.filters select:focus,
.filters input[type="number"]:focus {
  border-color: #007bff;
  outline: none;
}

.filters button {
  padding: 8px 16px;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  align-self: flex-end;
  margin-left: auto;
}

.filters button:hover {
  background-color: #0056b3;
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters label {
    min-width: unset;
    width: 100%;
  }

  .filters button {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .pet-grid {
    grid-template-columns: 1fr !important;
  }
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .signup-wrapper {
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (max-width: 600px) {
  .hamburger {
    font-size: 24px;
  }

  .pet-photo,
  .calendar-icon {
    width: 80px;
    height: 80px;
  }

  .meeting-details,
  .pet-name {
    font-size: 14px;
  }

  .view-profile {
    font-size: 11px;
    padding: 6px 12px;
  }

  .pet-card,
  .your-pet-card,
  .meeting-item {
    flex-direction: column;
    align-items: center;
  }

  .pet-details {
    align-items: center;
    text-align: center;
    padding: 10px 0 0;
  }
}
</style>
