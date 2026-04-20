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
          <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('MeetingsPage')">My Bookings</li>
          <li @click="goToPage('UsersFavouritesPage')">My Favourites</li>
          <li @click="goToPage('CalendarPage')">My Calendar</li>
          <li v-if="user && user.user_type === 'Pet Owner'" @click="goToPage('AddPetPage')">Add Pet</li>
          <li @click="goToPage('LogoutPage')">Log Out</li>
        </ul>
      </div>
    </div>
    <!-- Heading -->
    <div class="wrapper">
      <h2 class="banner-title">Add Your Pet</h2>

      <!-- Pet Name -->
      <div class="form-group">
        <label class="form-label" for="pet_name">Pet's Name:</label>
        <input v-model="pet.pet_name" type="text" id="pet_name" required class="form-input">
      </div>

      <!-- Breed Dropdown -->
      <div class="form-group">
        <label class="form-label">Breed:</label>
        <select v-model="selectedBreed" class="form-select">
          <option disabled value="">Select a breed</option>
          <option v-for="breed in breeds" :key="breed.id" :value="breed.name">{{ breed.name }}</option>
          <option value="custom">Add my pet's breed</option>
        </select>
      </div>

      <!-- New Breed Input -->
      <div class="form-group" v-if="selectedBreed === 'custom'">
        <input type="text" v-model="newBreed" placeholder="Enter new breed" class="form-input">
        <button @click="addNewBreed" :disabled="!newBreed" class="submit-button" type="button">Add Breed</button>
      </div>

      <!-- Age -->
      <div class="form-group">
        <label class="form-label">Age:</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" v-model="pet.age" value="Puppy" class="radio-input" />
            <span>Puppy</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="pet.age" value="Adult" class="radio-input" />
            <span>Adult</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="pet.age" value="Senior" class="radio-input" />
            <span>Senior</span>
          </label>
        </div>
      </div>

      <!-- Gender -->
      <div class="form-group">
        <label class="form-label">Gender:</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" v-model="pet.gender" value="Male" class="radio-input" />
            <span>Male</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="pet.gender" value="Female" class="radio-input" />
            <span>Female</span>
          </label>
        </div>
      </div>


      <!-- Description -->
      <div class="form-group">
        <label class="form-label" for="description">Description:
          <button type="button" @click="generateDescription" class="upload-button">✨ Generate with AI</button>
        </label>
        <textarea v-model="pet.description" id="description" class="form-textarea" placeholder="Describe your pet..."></textarea>
      </div>

      <!-- Upload -->
      <div class="form-group">
        <label class="form-label" for="photo">Upload Pet Photo:</label>
        <input type="file" id="photo" accept="image/*" @change="handleFileUpload" class="form-input">
      </div>

      <!-- Visibility -->
      <div class="form-group checkbox-option">
        <input type="checkbox" v-model="pet.isOnline" class="checkbox-input" checked>
        <label class="checkbox-label">Make Pet Profile Visible</label>
      </div>

      <!-- Submit -->
      <button 
        class="submit-button" 
        type="button"
        :disabled="isLoading"
        @click="addPet"
      >
        <span v-if="isLoading">Adding...</span>
        <span v-else>Add Pet</span>
      </button>
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
      pet: {
        pet_name: '',
        breed: '',
        other_breed: '', // Add a new property to store the manually entered breed
        age: '',
        gender: '',
        description: '',
        photo: null, // Updated to handle file input
        isOnline: true,
        location: ''
      },
      isLoading: false,
      isAuthenticated: false, 
      breeds: [],
      selectedBreed: '',
      newBreed: '',
      sidebarOpen: false
    };
  },
  created() {
    this.fetchBreeds(); // Fetch breeds on page load
  },
  methods: {
    goToPage(pageName) {
      this.sidebarOpen = false;
      this.$emit('change-page', pageName);
    },
    async fetchBreeds() {
      const res = await axios.get(`${backendUrl}/breeds/breeds`, { withCredentials: true });
      this.breeds = res.data;
    },
    
    async addNewBreed() {
      if (!this.newBreed) return;
      try {
        const res = await axios.post(`${backendUrl}/api/breeds/breeds`, { name: this.newBreed }, { withCredentials: true },);
        this.breeds = (res.data);
        this.selectedBreed = this.newBreed;
        this.newBreed = '';
        this.showBreedInput = false;
      } catch (err) {
        alert('Could not add breed: ' + err.response?.data?.error || err.message);
      }
    },

    async generateDescription() {
      const name = this.pet.pet_name;
      const age = this.getAgeBracket(this.pet.age);
      const gender = this.pet.gender;

      // Correctly use selectedBreed and newBreed
      const selected = this.selectedBreed;
      const custom = this.newBreed.trim();
      const breed = selected === 'custom' ? custom : selected;

      if (!name || !breed || !age || !gender) {
        alert('Please fill in name, breed, age, and gender first.');
        return;
      }

      try {
        const response = await axios.post(
          `${backendUrl}/api/pets/generate-description`,
          {
            pet_name: name,
            selectedBreed: selected,
            newBreed: custom,
            age: age,
            gender: gender
          },
          { withCredentials: true }
        );


        this.pet.description = response.data.description;
      } catch (error) {
        console.error('Error generating description:', error);
        alert('Failed to generate description.');
      }
    },


    getAgeBracket(age) {
      if (age === 'Puppy') {
        return 'Puppy';
      } else if (age === 'Adult') {
        return 'Adult';
      } else if (age === 'Senior') {
        return 'Senior';
      }
      return '';
    },

    async addPet() {

      const finalBreed = this.selectedBreed === 'custom'
        ? this.newBreed.trim()
        : this.selectedBreed;
      if (!finalBreed) {
        alert('Please pick or enter a breed.');
        return;
      }
      // if you still want pet.breed populated:
      this.pet.breed = finalBreed;

      console.log('Sending pet data:', this.pet);

      // Check for required fields
      if (!this.pet.pet_name || !this.selectedBreed || !this.pet.age || !this.pet.gender || !this.pet.description || !this.pet.photo) {
        alert('Please fill in all the details.');
        return;
      }

      // URL validation for pet photo (this is now optional as you're uploading files, not URLs)
      if (this.pet.photo && !this.pet.photo.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
      }

      try {
        this.isLoading = true;

        // Create a FormData object to send the pet data, including the file
        const formData = new FormData();
        formData.append('pet_name', this.pet.pet_name);
        const finalBreed = this.selectedBreed === 'custom' ? this.newBreed.trim() : this.selectedBreed;
        formData.append('breed', finalBreed);
        formData.append('custom_breed', this.newBreed.trim()); // Optional — backend uses this as priority
        formData.append('age', this.pet.age);
        formData.append('gender', this.pet.gender);
        formData.append('description', this.pet.description);
        formData.append('photo', this.pet.photo);
        formData.append('isOnline', this.pet.isOnline);

        if (this.pet.breed === 'custom') {
          if (this.customBreed.trim()) {
            this.pet.breed = this.customBreed.trim(); // use the entered breed
          } else {
            alert("Please enter a custom breed name.");
            return;
          }
        }

        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }

        const response = await axios.post(`${backendUrl}/api/pets/add-pet`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }},
          { withCredentials: true }
        );

        console.log('✅ Pet added:', response.data);
        alert('Pet added successfully!');
        this.resetForm();
      } catch (err) {
        console.error('❌ Error adding pet:', err);
        alert('Error adding pet. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },

    resetForm() {
      this.pet = {
        pet_name: '',
        breed: '',
        age: '',
        gender: '',
        description: '',
        photo: null,
        isOnline: true
      };
    },
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.pet.photo = file; // Store the file in pet.photo
    }
  }
};
</script>

<style scoped>
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

body{
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 0;
}

.container {
  width: 100%;
  max-width: 375px;
  background-color: white;
  min-height: 100vh;
  position: relative;
}

.wrapper {
  background-color: white;
  padding: 1.5rem;
  border-radius: 1rem;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}

.back-button {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.back-arrow {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 12px solid #333;
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

/* Banner Section */
.banner {
  text-align: center;
  margin-bottom: 30px;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.banner-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.4;
}

.pet-illustrations {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.pet-illustration {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.cat-illustration {
  background-color: #f0f0f0;
}

.dog-illustration {
  background-color: #fff3e0;
}

/* Upload Section */
.upload-section {
  margin-bottom: 25px;
}

.section-label {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.upload-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.upload-icon {
  width: 30px;
  height: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'%3E%3C/path%3E%3Ccircle cx='12' cy='13' r='3'%3E%3C/circle%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}

.upload-button {
  padding: 5px 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-button:hover {
  background-color: #e9ecef;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8px;
}

.form-input[type="text"] {
  width: 100%;
  padding: 14px 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-input[type="text"]:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

/* Select Dropdown */
.form-select {
  width: 100%;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  background-color: #f9f9f9;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
  padding-right: 45px;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

/* Radio Groups */
.radio-group {
  display: flex;
  gap: 20px;
}

.radio-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.radio-option:hover {
  background-color: #e9ecef;
}

.radio-input:checked + span {
  border-color: #007bff;
  color: #007bff;
  font-weight: 600;
  border-radius: 12px;
  display: inline-block;
}

.radio-input {
  display: none;
}

/* Age Selection */
.age-group {
  display: flex;
  gap: 10px;
}

.age-option {
  flex: 1;
  text-align: center;
  padding: 15px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.age-option:hover {
  background-color: #e9ecef;
}

.age-option.selected {
  background-color: #e3f2fd;
  border-color: #007bff;
  color: #007bff;
  font-weight: 600;
}

.age-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.age-range {
  font-size: 12px;
  color: #666;
}

/* Textarea */
.form-textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  background-color: #f9f9f9;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

/* Checkboxes */
.checkbox-group {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  appearance: none;
  background-color: white;
}

.checkbox-input:checked {
  background-color: #007bff;
  border-color: #007bff;
}

.checkbox-input:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  font-size: 14px;
  color: #333;
}

/* Add Another Pet Link */
.add-another {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 25px;
}

.add-another:hover {
  text-decoration: underline;
}

.plus-icon {
  width: 16px;
  height: 16px;
  background-color: #007bff;
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

/* Submit Button */
.submit-button {
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

.submit-button:hover {
  background-color: #0056b3;
}

.submit-button:active {
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
  
  .radio-group {
      gap: 10px;
  }
  
  .age-group {
      gap: 8px;
  }
}
</style>
