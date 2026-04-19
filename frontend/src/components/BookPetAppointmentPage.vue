<template>
  <div class="book-page">
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
      <h2 v-if="pet">Book Appointment with {{ pet.pet_name }}</h2>
      <h2 v-else>Loading pet details...</h2>

      <div class="form-group">
        <label>Date:</label>
        <input
          type="date"
          v-model="date"
          :min="minDate"
          :max="maxDate"
          @change="loadBookedSlots"
        />
      </div>

      <div v-if="date">
        <label>Time Slots:</label>
        <div class="slots">
          <button
            v-for="hour in hours"
            :key="hour"
            :disabled="booked.includes(hour)"
            :class="{ selected: time === hour }"
            @click="time = hour"
          >
            {{ hour.slice(0,5) }} <!-- show HH:mm only -->
          </button>
        </div>
      </div>

      <button
        class="submit"
        :disabled="!date || !time"
        @click="submitBooking"
      >
        Book {{ time ? `at ${time.slice(0,5)}` : '' }}
      </button>

      <p class="message" v-if="message">{{ message }}</p>
    </div>
  </div>
</template>

<script>
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  props: {
    petId: {
      type: [String, Number],  // ✅ Accepts either string or number
      required: true           // Optional but recommended
    },
    user: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      date: '',
      time: '',
      message: '',
      pet: null,
      booked: [],
      sidebarOpen: false,
      pets: []
    }
  },
  mounted() {
    fetch(`${backendUrl}api/pets/${this.petId}`, {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.id) {
        this.pet = data;
      } else {
        this.message = 'Could not load pet details.';
      }
    })
    .catch(() => {
      this.message = 'Error loading pet details.';
    });
  },
  computed: {
    hours() {
      if (!this.pet) return [];
      const start = this.pet.available_start_time;  // expect HH:mm:ss
      const end   = this.pet.available_end_time;
      if (!start || !end) return [];

      const [sh] = start.split(':').map(Number);
      const [eh] = end.split(':').map(Number);
      const arr = [];
      for (let h = sh; h <= eh; h++) {
        arr.push(String(h).padStart(2, '0') + ':00:00'); // HH:mm:ss format
      }
      return arr;
    },
    minDate() {
      return new Date().toISOString().split('T')[0]
    },
    maxDate() {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d.toISOString().split('T')[0]
    }
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    isTimeBetween(time, start, end) {
      const toMinutes = t => {
        const [h, m, s = "0"] = t.split(':').map(Number);
        return h * 60 + m + s / 60;
      }
      const timeMin = toMinutes(time);
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);
      return timeMin >= startMin && timeMin <= endMin;
    },
    async submitBooking() {
      this.message = '';

      if (!this.date) {
        this.message = 'Please select a date.';
        return;
      }

      const selectedDate = new Date(this.date);
      const min = new Date(this.minDate);
      const max = new Date(this.maxDate);

      if (selectedDate < min || selectedDate > max) {
        this.message = `Please pick a date between ${this.minDate} and ${this.maxDate}.`;
        return;
      }

      if (!this.time) {
        this.message = 'Please select a time.';
        return;
      }

      if (!this.pet) {
        this.message = 'Pet data not loaded.';
        return;
      }

      if (!this.isTimeBetween(this.time, this.pet.available_start_time, this.pet.available_end_time)) {
        this.message = `Please pick a time between ${this.pet.available_start_time} and ${this.pet.available_end_time}.`;
        return;
      }

      try {
        const response = await fetch(`${backendUrl}api/meetings/book-appointment`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_id: this.petId,
            date: this.date,
            time: this.time
          })
        });
        const data = await response.json();
        this.message = data.message || data.error || 'Booking response received.';
        if (data.message) {
          this.time = ''; // reset selected time after successful booking
          this.loadBookedSlots(); // reload booked slots
        }
      } catch (err) {
        this.message = 'Error booking appointment.';
      }
    },

    async loadBookedSlots() {
      if (!this.date) return;
      try {
        const res = await fetch(`${backendUrl}api/meetings/booked-slots?pet_id=${this.petId}&date=${this.date}`, {
          credentials: 'include'
        });
        const data = await res.json();
        this.booked = data.booked || [];
      } catch (err) {
        this.message = 'Error loading booked slots.';
      }
    }
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
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.book-page {
  width: 100%;
  max-width: 375px;
  min-height: 100vh;
  position: relative;
}

/* Sidebar and Hamburger */
.sidebar-wrapper {
  position: relative;
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
}

.sidebar-menu {
  list-style: none;
  padding: 20px;
}

.sidebar-menu li {
  margin-bottom: 15px;
  cursor: pointer;
  font-size: 16px;
  color: #333;
}

.sidebar-menu li:hover {
  color: #007bff;
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

/* Main Wrapper */
.signup-wrapper {
  padding: 80px 20px 40px;
}

/* Headline */
.signup-wrapper h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1a1a1a;
}

/* Form Group */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8px;
}

.form-group input[type="date"] {
  width: 100%;
  padding: 14px 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input[type="date"]:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

/* Time Slots */
.slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 10px;
  margin-bottom: 25px;
}

.slots button {
  padding: 12px 8px;
  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #f9f9f9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slots button:hover:not(:disabled) {
  border-color: #007bff;
  background-color: #f0f8ff;
  color: #007bff;
}

.slots button.selected {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.slots button:disabled {
  background-color: #f0f0f0;
  color: #bbb;
  cursor: not-allowed;
}

/* Submit Button */
.submit {
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
}

.submit:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Message */
.message {
  margin-top: 15px;
  font-size: 14px;
  font-weight: 500;
  color: green;
}

/* Responsive Design */
@media (max-width: 375px) {
  .signup-wrapper {
    padding: 70px 15px 40px;
  }

  .slots {
    gap: 10px;
  }

  .slots button {
    padding: 10px 6px;
    font-size: 13px;
  }
}
</style>
