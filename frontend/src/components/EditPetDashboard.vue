<template>
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
  <div class="signup-wrapper">
    <div class="edit-pet-dashboard">
      <h2>Edit Pet Dashboard</h2>
      <form @submit.prevent="updatePet">
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input v-model="form.pet_name" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">Breed:</label>
          <input v-model="form.breed" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">Birthday:</label>
          <input v-model="form.birthday" type="date" class="form-input" required />
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-option">
            <input v-model="form.vaccinated" type="checkbox" class="checkbox-input" />
            <span class="checkbox-label">Vaccinated</span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">Age Group:</label>
          <div class="radio-group">
            <label><input v-model="form.age" type="radio" value="Puppy" required /> Puppy (0 - 2 yrs)</label>
            <label><input v-model="form.age" type="radio" value="Adult" /> Adult (3 - 7 yrs)</label>
            <label><input v-model="form.age" type="radio" value="Senior" /> Senior (8+ yrs)</label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Gender:</label>
          <select v-model="form.gender" class="form-select" required>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Description:</label>
          <textarea v-model="form.description" class="form-textarea"></textarea>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <label class="form-label">Available days:</label>
            <label v-for="day in weekdays" :key="day" class="checkbox-option">
              <input type="checkbox" :value="day" v-model="form.available_days" class="checkbox-input" />
              <span class="checkbox-label">{{ day }}</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">From:</label>
          <input v-model="form.available_start_time" type="time" class="form-input" required />
          <label class="form-label">To:</label>
          <input v-model="form.available_end_time" type="time" class="form-input" required />
        </div>
        
        <button type="submit" class="submit-button">Save Changes</button>
      </form>

      <div v-if="successMessage" class="success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  name: 'EditPetDashboard',
  props: {
    pet: {
      type: Object,
      default: () => ({})
    },
    user: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'changePage', 'pet-updated'],
  data() {
    return {
      weekdays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      form: {
        pet_name:      this.pet.pet_name,
        breed:         this.pet.breed,
        birthday:      this.pet.birthday || '',
        vaccinated:    this.pet.vaccinated || false,
        age:           this.pet.age,
        gender:        this.pet.gender,
        description:   this.pet.description,
        available_days: this.pet.available_days
          ? (Array.isArray(this.pet.available_days)
            ? [...this.pet.available_days]
            : this.pet.available_days.split(',').map(day => day.trim()))
          : [],
        available_start_time:    this.pet.available_start_time || '09:00',
        available_end_time:      this.pet.available_end_time   || '17:00'
      },
      successMessage: '',
      errorMessage: '',
      sidebarOpen: false,
      
    };
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    async updatePet() {
      // ensure at least one day selected
      if (!this.form.available_days.length) {
        this.errorMessage = 'Please select at least one available day.';
        return;
      }
      // ensure valid time range
      if (this.form.available_end_time <= this.form.available_start_time) {
        this.errorMessage = 'End time must be after start time.';
        return;
      }
      try {
        const response = await axios.patch(
          `${backendUrl}api/pets/${this.pet.id}`,
          this.form,
          { withCredentials: true }
        );
        this.successMessage = response.data.message || 'Pet updated successfully';
        this.errorMessage = '';
        this.$emit('pet-updated', response.data.pet || this.form);
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Failed to update pet';
        this.successMessage = '';
      }
    }
  },
  watch: {
    user: {
      handler(newVal) {
        console.log("User updated:", newVal);
      },
      immediate: true,
      deep: true
    }
  }
};
</script>

<style scoped>
.signup-wrapper {
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9f9f9;
  padding: 2rem;
  min-height: 100vh;
}

/* Sidebar */
.sidebar-wrapper {
  position: relative;
}

.hamburger {
  position: fixed;
  top: 20px;
  left: 20px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1000;
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
    left: -300px;          /* 🆕 hide off-screen by default */
    height: 100%;
    transition: left 0.3s ease;
    z-index: 1000;
}

:deep(.sidebar.open) {
  left: 0;
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

/* Form container */
.edit-pet-dashboard {
  max-width: 700px;
  background-color: #fff;
  border-radius: 1rem;
  margin: 2rem auto;
  padding: 2rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

/* Section title */
.edit-pet-dashboard h2 {
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #333;
}

/* Form groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  background-color: #fff;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  outline: none;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.checkbox-label {
  font-size: 0.95rem;
}

/* Radio buttons */
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  background-color: #f9fafb;
  transition: background-color 0.2s, border-color 0.2s;
}

.radio-group label:hover {
  background-color: #e5f0ff;
  border-color: #3b82f6;
}

/* Time selection */
.form-group.time-range {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Button */
.submit-button {
  width: 100%;
  padding: 0.9rem;
  font-size: 1rem;
  font-weight: bold;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #2563eb;
}

/* Success and error messages */
.success,
.error {
  text-align: center;
  font-weight: 500;
  margin-top: 1.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #f87171;
}

/* Responsive */
@media (max-width: 768px) {
  .edit-pet-dashboard {
    padding: 1.5rem;
  }

  .radio-group {
    flex-direction: column;
  }

  .form-group.time-range {
    flex-direction: column;
    align-items: flex-start;
  }

  .sidebar {
    width: 80%;
  }
}
</style>
