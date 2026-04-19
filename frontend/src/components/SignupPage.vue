<template>
  <div class="signup-wrapper body">
    <div class="sidebar-wrapper">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen">☰</button>

      <div class="sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-header">
          <button class="close-btn" @click="sidebarOpen = false">✖</button>
          <p>{{ user.fullname }}</p>
          <p>{{ user.phone_number }}</p>
        </div>
        <ul class="sidebar-menu">
          <li @click="goToPage('SignupPage')">Sign Up</li>
          <li @click="goToPage('WelcomePage')">Welcome</li>
        </ul>
      </div>
    </div>
    <div class="mobile-container">
      <div class="form-box">
        <div class="logo-section">
          <img class="logo" src="/logo.png">
        </div>
        <h2 class="header">Sign Up</h2>
        <form class="form-group" @submit.prevent="submitForm">
          <label class="form-label">Full Name</label>
          <input
            class="form-input"
            v-model="form.fullname"
            type="text"
            placeholder="Full Name"
            required
          />

          <label class="form-label">Phone Number</label>
          <input
            class="form-input"
            v-model="form.phone_number"
            type="text"
            placeholder="Phone Number"
            required
            pattern="\d{10}"
            title="Please enter exactly 10 digits"
          />

          <label class="form-label">Email</label>
          <input
            class="form-input"
            v-model="form.email"
            type="email"
            placeholder="Email"
            required
          />


          <label class="form-label" style="display: flex; align-items: center; white-space: nowrap;">
            <span>Enter location manually</span>
            <input style="width: 50px;" type="checkbox" v-model="manualLocation" />
          </label>



          <div v-if="manualLocation">
            <input
              class="form-input"
              v-model="manualPlace"
              type="text"
              placeholder="Enter city, place, or address"
            />
          </div>
          <div v-else>
            <button  class="form-input" type="button" @click="detectLocation">
              <span class="form-label">📍 Use My Location</span>
            </button>
            <p v-if="autoLocation">
              Location Detected
            </p>
          </div>

          <label class="form-label">User Type</label>
          <div>
            <button 
              class="form-input user-type-buttona"
              type="button" 
              :class="{ active: form.user_type === 'Pet Owner' }" 
              @click="form.user_type = 'Pet Owner'">
              Pet Owner
            </button>
            <button 
              class="form-input user-type-buttonb"
              type="button" 
              :class="{ active: form.user_type === 'Pet Lover' }" 
              @click="form.user_type = 'Pet Lover'">
              Pet Lover
            </button>
          </div>


          <button class="register-button"  type="submit">Register</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const backendUrl = process.env.VUE_APP_API_URL;

export default {
  name: 'SignupPage',
  props: {
    initialFullname: { type: String, default: '' },
    initialEmail: { type: String, default: '' },
    user: { 
      type: Object, 
      default: () => ({ fullname: '', phone_number: '' })
    }
  },
  emits: ['user-registered','change-page'],
  data() {
    return {
      form: {
        fullname: this.initialFullname,
        phone_number: '',
        email: this.initialEmail,
        user_type: '',
        location: '',
        location_coords: ''
      },
      manualLocation: false,
      manualPlace: '',
      autoLocation: null,
      sidebarOpen: false
    };
  },
  watch: {
    initialEmail(val) {
      this.form.email = val;
    },
    initialFullname(val) {
      this.form.fullname = val;
    }
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    detectLocation() {
      if (!navigator.geolocation) {
        return alert('Geolocation not supported');
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          this.autoLocation = { lat, lon };
          this.form.location_coords = `${lat},${lon}`;
          this.form.location = `${lat},${lon}`;
        },
        err => alert('Location error: ' + err.message)
      );
    },
    async getCoordsFromPlace(place) {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
      );
      const results = await resp.json();
      if (!results.length) throw new Error('Place not found');
      const { lat, lon } = results[0];
      return { lat, lon };
    },
    async submitForm() {
      const phone = this.form.phone_number.trim()
      if (!/^\d{10}$/.test(phone)) {
        return alert('Phone number must be exactly 10 digits and contain only numbers.')
      }
      // stick the trimmed value back
      this.form.phone_number = phone

      try {
        // Resolve location
        if (this.manualLocation) {
          if (!this.manualPlace.trim()) {
            return alert('Please enter a location');
          }
          const { lat, lon } = await this.getCoordsFromPlace(this.manualPlace);
          this.form.location_coords = `${lat},${lon}`;
          this.form.location = this.manualPlace;
        } else if (!this.autoLocation) {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              pos => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                this.autoLocation = { lat, lon };
                this.form.location_coords = `${lat},${lon}`;
                this.form.location = `${lat},${lon}`;
                resolve();
              },
              err => {
                alert('Location error: ' + err.message);
                reject(err);
              }
            );
          });
        }

        // Submit to backend
        const { data } = await axios.post(
          `${backendUrl}api/auth/signup`,
          this.form,
          { withCredentials: true }
        );

        alert('Signup successful!');
        this.$emit('user-registered', data.user);
        this.$emit('change-page', 'DashboardPage');
      } catch (err) {
        console.error('Signup error:', err.response?.data || err);
        alert(err.response?.data?.message || 'Signup failed');
      }
    }
  }
};
</script>

<style scoped>
.signup-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  background-color: #f9fafb;
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

.form-box {
  width: 500px;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  background: white;
  font-family: Verdana, sans-serif;

}

h2 {
  text-align: center;
  margin-bottom: 25px;
}


label {
  display: block;
  margin: 15px;
}

input,
select {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  box-sizing: border-box;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.google-signin {
  margin-top: 20px;
  text-align: center;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f8f9fa;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mobile-container {
    width: 550px;
    min-height: 812px;
    background-color: #f9fafb;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Header */
.header {
    display: flex;
    align-items: center;
    padding-left: 16px 20px;
    padding-right: 16px 20px;
    padding-top: 16px 20px;
    gap: 16px;
    color: rgb(3, 144, 252);
}


.logo-section {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    margin-right: 40px; /* Compensate for back button */
}

.logo {
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
    margin-left: 45px;
}

/* Form Styles */
.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
}

.form-input {
    width: 100%;
    padding: 13px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    background-color: none;
    transition: border-color 0.2s ease;
    width: 100%;
    box-sizing: border-box;
}

.form-input:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: white;
}

.form-input::placeholder {
    color: #9ca3af;
}

/* Phone Input */
.phone-input-container {
    display: flex;
    gap: 12px;
}

.country-code {
    width: 80px;
    padding: 16px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    background-color: #f9fafb;
    text-align: center;
}

.phone-input {
    flex: 1;
}

/* Radio Group */
.radio-group {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.radio-input {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    position: relative;
    cursor: pointer;
}

.radio-input:checked {
    border-color: #3b82f6;
}

.radio-input:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background-color: #3b82f6;
    border-radius: 50%;
}

.radio-label {
    font-size: 14px;
    color: #374151;
    cursor: pointer;
}

/* Location Section */
.location-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background-color: #f9fafb;
    cursor: pointer;
    margin-bottom: 12px;
}

.location-option:hover {
    background-color: #f3f4f6;
}

.location-text {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #374151;
}

.location-icon {
    width: 20px;
    height: 20px;
    background-color: #6b7280;
    border-radius: 50%;
    position: relative;
}

.location-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
}


.manual-entry {
    color: #3b82f6;
    font-size: 14px;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
}

.manual-entry:hover {
    text-decoration: underline;
}

.plus-icon {
    width: 16px;
    height: 16px;
    background-color: #3b82f6;
    border-radius: 50%;
    position: relative;
}

.plus-icon::before,
.plus-icon::after {
    content: '';
    position: absolute;
    background-color: white;
}

.plus-icon::before {
    top: 50%;
    left: 3px;
    right: 3px;
    height: 2px;
    transform: translateY(-50%);
}

.plus-icon::after {
    left: 50%;
    top: 3px;
    bottom: 3px;
    width: 2px;
    transform: translateX(-50%);
}

.user-type-buttona{
  width: 40%;
  height: 50px;
  margin-right: 55px;
  margin-left: 15px;
}

.user-type-buttonb{
  width: 40%;
  height: 50px;
}

/* Register Button */
.register-button {
    width: 100%;
    padding: 14px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 20px 0;
    margin-bottom: 0;
    transition: background-color 0.2s ease;
}

.register-button:hover {
    background-color: #2563eb;
}

.register-button:active {
    transform: translateY(1px);
}

/* Footer */
.footer-text {
    text-align: center;
    font-size: 14px;
    color: #6b7280;
}

.login-link {
    color: #fbbf24;
    text-decoration: none;
    font-weight: 600;
}

.login-link:hover {
    text-decoration: underline;
}

@media (max-width: 375px) {
    .mobile-container {
        width: 100%;
        min-height: 100vh;
    }
}
</style>
