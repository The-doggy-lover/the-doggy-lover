<template>
  <div class="container">
    <header class="header">
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
      <h1 class="page-title">My Favourites</h1>
    </header>

    <main class="content">
      <div v-if="pets.length === 0" class="distance-info">
        You have no favourites yet.
      </div>

      <div v-else class="fav-list">
        <div v-for="pet in pets" :key="pet.id" class="fav-card">
          <div class="pet-image-container">
            <img
              :src="backendUrl + '/pet-pics/' + pet.pet_photo"
              alt="Photo of {{ pet.pet_name }}"
              class="pet-image"
            />
            <div
              class="favorite-heart"
              @click="$emit('toggle-favourite', pet.id)"
            >
              <span class="heart-icon"
                >❤️</span
              >
            </div>
          </div>

          <div class="pet-details">
            <div class="pet-name">{{ pet.pet_name }}</div>
            <div class="pet-breed">{{ pet.breed }}</div>
          </div>

          <div class="pet-attributes">
            <span v-if="pet.gender === 'Male'" class="attribute-tag attribute-male">{{ pet.gender }}</span>
            <span v-else class="attribute-tag attribute-female">{{ pet.gender }}</span>
            <span class="attribute-tag attribute-age">{{ pet.age }}</span>
          </div>

          <button
            class="view-profile-btn"
            @click="$emit('view-pet-profile', pet)"
          >
            View Profile
          </button>
        </div>
      </div>
    </main>
  </div>
</template>


<script>
import axios from 'axios';
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      pets: [],
      sidebarOpen: false,
      favourites: [],
      backendUrl: process.env.VUE_APP_API_URL
    }
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    isFavourite(petId) {
      return Array.isArray(this.favourites) && this.favourites.includes(petId);
    }
  },
  watch: {
    user: {
      immediate: true,
      handler(newUser) {
        if (newUser && newUser.id) {
          axios.get(`${backendUrl}/api/pets/users/${newUser.id}/favourites`, {
            withCredentials: true
          })
          .then(res => {
            this.pets = res.data;
          })
          .catch(err => {
            console.error('Failed to load favourites:', err);
          });
        }
      }
    }
  }
}
</script>

<style>
.fav-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px,1fr));
  gap: 20px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.pet-card {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  margin: 10px;
  /* Removed fixed width */
}

.pet-photo {
  width: 100%;
  max-width: 300px;
  height: auto;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
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
  width: 80vw; /* or keep 240px if preferred */
  max-width: 300px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: -100%;  /* ✅ Fix: fully offscreen on any screen width */
  height: 100%;
  transition: left 0.3s ease;
  z-index: 1000;
}


.sidebar.open {
  left: 0;               /* already defined—brings it back on screen */
}

.sidebar-menu {
    flex: 1;
    padding: 20px;
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

body {
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 0;
}

.container {
  width: 100%;
  width: 425px;
  min-height: 100vh;
  position: relative;
}

/* Header */
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

/* Main Content */
.content {
  padding: 20px;
}

/* Pet Card */
.fav-card {
  background-color: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  margin-bottom: 20px;
  height: 275px;
}

.pet-image-container {
  position: relative;
  margin-bottom: 20px;
}

.pet-image {
  width: 70px;
  height: 70px;
  border-radius: 15px;
  object-fit: cover;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.favorite-heart {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.heart-icon {
  color: #ff3b30;
  font-size: 20px;
}

/* Pet Details */
.pet-details {
  margin-bottom: 15px;
}

.pet-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 5px;
}

.pet-breed {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

/* Pet Attributes */
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
  font-weight: 500;
}

.attribute-male {
  background-color: #d7d7fd;
  color: #6464f4;
}

.attribute-female {
  background-color: #fdd7fd;
  color: #f464d2;
}

.attribute-age {
  background-color: #fff3cd;
  color: #856404;
}

.attribute-weight {
  background-color: #d1ecf1;
  color: #0c5460;
}

/* View Profile Button */
.view-profile-btn {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 10px;
}

.view-profile-btn:hover {
  background-color: #0056b3;
}

.view-profile-btn:active {
  transform: translateY(1px);
}

/* Distance Info */
.distance-info {
  text-align: center;
  font-size: 14px;
  color: #ffc107;
  font-weight: 600;
}

@media (max-width: 425px) {
  .container {
    width: 100%;
    padding: 0 10px;
  }

  .page-title {
    font-size: 22px;
  }

  .fav-card {
    height: auto;
    padding: 15px;
  }

  .pet-name {
    font-size: 18px;
  }

  .pet-breed {
    font-size: 14px;
  }

  .attribute-tag {
    font-size: 11px;
    padding: 5px 10px;
  }

  .view-profile-btn {
    font-size: 15px;
    padding: 10px;
  }

  .distance-info {
    font-size: 13px;
  }
}

@media (max-width: 375px) {
  .fav-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }

  .pet-image {
    width: 60px;
    height: 60px;
  }

  .favorite-heart {
    width: 36px;
    height: 36px;
  }

  .heart-icon {
    font-size: 18px;
  }

  .sidebar {
    width: 85vw;
  }

  .sidebar-menu {
    padding: 15px;
  }

  .sidebar li {
    font-size: 15px;
  }
}

@media (max-width: 320px) {
  .page-title {
    font-size: 20px;
  }

  .pet-name {
    font-size: 16px;
  }

  .view-profile-btn {
    font-size: 14px;
  }

  .attribute-tag {
    font-size: 10px;
    padding: 4px 8px;
  }

  .sidebar {
    width: 90vw;
  }

  .sidebar li {
    font-size: 14px;
  }
}
</style>
