<template>
  <div class="edit-user-dashboard">
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

    <div class="container">
      <div class="header">
        <div class="page-title">Edit Profile</div>
      </div>

      <div class="content">
        <form @submit.prevent="updateUser">
          <div class="form-group">
            <label class="form-label">Full Name:</label>
            <input v-model="form.fullname" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email:</label>
            <input v-model="form.email" type="email" class="form-input" required />
          </div>

          <div class="form-group phone-container">
            <input v-model="form.phone_number" type="text" class="phone-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">User Type:</label>
            <select v-model="form.user_type" class="form-input" required>
              <option disabled value="">Select</option>
              <option value="Pet Owner">Pet Owner</option>
              <option value="Pet Lover">Pet Lover</option>
            </select>
          </div>

          <button type="submit" class="update-button">Save Changes</button>
          <button type="button" class="update-button" @click="$emit('close')">Cancel</button>
        </form>

        <div v-if="successMessage" class="success">{{ successMessage }}</div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

        <div v-if="user.user_type === 'Pet Owner'" class="pet-list">
          <h3>Your Pets</h3>
          <ul>
            <li v-for="pet in pets" :key="pet.id">{{ pet.pet_name }}</li>
          </ul>
          <button @click="$emit('add-pet')" class="update-button">Add Pet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  name: 'EditUserDashboard',
  props: ['user', 'pets'],
  data() {
    return {
      form: {
        fullname: this.user.fullname,
        email: this.user.email,
        phone_number: this.user.phone_number,
        user_type: this.user.user_type
      },
      successMessage: '',
      errorMessage: '',
      sidebarOpen: false,
    };
  },
  methods: {
    async updateUser() {
      try {
        const response = await axios.patch(
          `${backendUrl}api/auth/users/${this.user.id}`,
          this.form,
          { withCredentials: true }
        );
        this.successMessage = 'Profile updated successfully. To see the changes, log out';
        this.errorMessage = '';
        this.$emit('profile-updated', response.data.user);
      } catch (err) {
        this.errorMessage = err.response?.data?.error || 'Failed to update profile';
        this.successMessage = '';
      }
    },
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    }
  },
  mounted() {
  console.log('User prop:', this.user);
  console.log('phone_number:', this.user.phone_number);
  console.log('fullname:', this.user.fullname);
  console.log('email:', this.user.email);
  console.log('user_type:', this.user.user_type);
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

.edit-user-dashboard {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.container {
  padding: 10px;
  max-width: 375px;
  min-height: 100vh;
  position: relative;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 18px 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Main Content */
.content {
  padding: 24px 20px 20px;
}

/* Form Groups */
.form-group {
  margin-bottom: 22px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
}

.form-input,
select.form-input {
  width: 100%;
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  background-color: #f9f9f9;
  transition: border-color 0.2s ease;
}

.form-input:focus,
select.form-input:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

.form-input::placeholder {
  color: #999;
}

/* Phone Input */
.phone-container {
  display: flex;
  gap: 10px;
}

.phone-input {
  flex: 1;
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  background-color: #f9f9f9;
}

.phone-input:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

/* Buttons */
.update-button {
  width: 100%;
  padding: 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 18px;
}

.update-button:hover {
  background-color: #005fcc;
}

.update-button:active {
  transform: translateY(1px);
}

/* Sidebar */
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

/* Feedback Messages */
.success,
.error {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

/* Pet List */
.pet-list {
  margin-top: 26px;
}

.pet-list h3 {
  font-size: 17px;
  margin-bottom: 8px;
}

.pet-list ul {
  list-style: none;
  padding-left: 0;
  margin-bottom: 10px;
}

.pet-list li {
  padding: 9px 0;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}

/* Responsive tweaks */
@media (max-width: 360px) {
  .page-title {
    font-size: 20px;
  }

  .form-label {
    font-size: 14px;
  }

  .form-input,
  .phone-input,
  select.form-input {
    font-size: 14px;
    padding: 12px;
  }

  .update-button {
    font-size: 14px;
    padding: 12px;
  }

  .sidebar-menu li {
    font-size: 14px;
  }
}
</style>
