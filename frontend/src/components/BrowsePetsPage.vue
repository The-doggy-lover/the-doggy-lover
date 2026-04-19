<template>
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
          <li v-if="user && user.user_type === 'Pet Lover'" @click="goToPage('PetRequestsPage')">My Bookings</li>
          <li @click="goToPage('UsersFavouritesPage')">My Favourites</li>
          <li @click="goToPage('CalendarPage')">My Calendar</li>
          <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('AddPetPage')">Add Pet</li>
          <li @click="goToPage('LogoutPage')">Log Out</li>
        </ul>
      </div>
    </div>
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
            <button class="view-profile" @click="$emit('view-pet-profile', pet)">View Profile</button>
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
      pets: [],
      breedOptions: [],    // ← NEW
      filters: {
        breed: '',
        age: '',
        gender: '',
        distance: 30
      },
      userCoords: null,
      sidebarOpen: false,
      favourites: [],
    };
  },
  computed: {
    filteredPets() {
      return this.pets.filter(pet => {
        if (!pet.isOnline) return false;
        const matchBreed = !this.filters.breed || pet.breed === this.filters.breed;
        const matchGender = !this.filters.gender || pet.gender === this.filters.gender;
        const matchAge   = !this.filters.age   || pet.age    === this.filters.age;

        // distance logic unchanged…
        if (!this.userCoords) return matchBreed && matchGender && matchAge;

        let lat, lon;
        if (typeof pet.location === 'string') {
          const [a,b] = pet.location.split(',').map(s=>s.trim());
          lat = parseFloat(a); lon = parseFloat(b);
        } else if (pet.location?.coordinates) {
          [lon, lat] = pet.location.coordinates;
        } else if (pet.location?.lat && pet.location?.lon) {
          lat = pet.location.lat; lon = pet.location.lon;
        }

        let matchDistance = true;
        if (!isNaN(lat) && !isNaN(lon)) {
          const d = this.calculateDistance(lat, lon);
          matchDistance = d <= this.filters.distance;
        }
        return matchBreed && matchGender && matchAge && matchDistance;
      });
    }
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    goToBooking(petId) {
      this.$emit('change-page', 'BookPetAppointmentPage', { petId });
    },
    async fetchPets() {
      try {
        const { data } = await axios.get(`${backendUrl}api/pets/pets`, { withCredentials: true }, {
          
        })
        this.pets = data
      } catch (err) {
        console.error('Error fetching pets:', err);
      }
    },
    async fetchBreedOptions() {
      try {
        const { data } = await axios.get(`${backendUrl}api/breeds/breeds`, { withCredentials: true });
        this.breedOptions = data;
      } catch (err) {
        console.error('Error fetching breeds:', err);
      }
    },
    calculateDistance(lat, lon) {
      if (!this.userCoords) return Infinity;
      const R = 6371;
      const dLat = this.deg2rad(lat  - this.userCoords.lat);
      const dLon = this.deg2rad(lon  - this.userCoords.lon);
      const a = Math.sin(dLat/2)**2
              + Math.cos(this.deg2rad(this.userCoords.lat))
              * Math.cos(this.deg2rad(lat))
              * Math.sin(dLon/2)**2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
    async toggleFavourite(petId) {
      try {
        const response = await axios.patch(
          `${backendUrl}api/pets/users/${this.user.id}/favourites`,
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
    async fetchFavourites() {
      try {
        const { data } = await axios.get(
          `${backendUrl}api/pets/users/${this.user.id}/favourites`,
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
  },
  mounted() {
    this.fetchBreedOptions();  // ← NEW
    this.fetchPets();
    this.detectLocation();
    this.fetchFavourites();
  },
  activated() {
  this.fetchFavourites(); // re-fetch favourites when component becomes active
  }
};
</script>

<style scoped>
.signup-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  background-color: white;
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


.pet-card{
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

@media (max-width: 600px) {
  .hamburger {
    font-size: 24px;
  }

  .pet-photo{
    width: 80px;
    height: 80px;
  }

  .pet-name {
    font-size: 14px;
  }

  .view-profile {
    font-size: 11px;
    padding: 6px 12px;
  }

  .pet-card{
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
