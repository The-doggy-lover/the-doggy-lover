<template>
  <div id="app">
    <LandingPage
      v-if="currentPage==='LandingPage'"
      @user-logged-in="handleGoogleSuccess"
    />
    <SignupPage
      v-if="currentPage === 'SignupPage'"
      :initialFullname="googleFullname"
      :initialEmail="googleEmail"
      :user="loggedInUser"
      @user-registered="handleUserRegistered"
      @change-page="changePage"
    />
    <KeepAlive>
      <DashboardPage
        v-if="currentPage === 'DashboardPage' && loggedInUser && loggedInUser.user_type"
        :user="loggedInUser"
        @change-page="changePage"
        @edit-pet="openEditPetPage" 
        @view-pet-profile="viewPetProfile"
        @profile-updated="user = $event"
      />
    </KeepAlive>
    <AddPetPage 
      v-if="currentPage === 'AddPetPage'" 
      :user="currentUser" 
      @change-page="changePage" 
    />
    <LoginPage 
      v-if="currentPage === 'LoginPage'" 
      @change-page="changePage" 
      @user-logged-in="loggedInUser = $event"
    />
    <WelcomePage 
      v-if="currentPage === 'WelcomePage'" 
      :user="loggedInUser"
      @change-page="changePage" 
    />
    <LogoutPage
      v-if="currentPage === 'LogoutPage'"
      :user="loggedInUser"
      @change-page="changePage"
    />
    <KeepAlive>
      <BrowsePetsPage
        v-if="currentPage === 'BrowsePetsPage'"
        :user="loggedInUser"
        @change-page="changePage"
        @view-pet-profile="viewPetProfile"
      />
    </KeepAlive>
    <EditPetDashboard 
      v-if="currentPage === 'EditPetDashboard'"
      :pet="selectedPet"
      :user="loggedInUser"
      @close="changePage('DashboardPage')"
      @changePage="changePage"
    />
    <BookPetAppointmentPage
      v-if="currentPage === 'BookPetAppointmentPage'"
      :pet-id="pageProps.pet.id"
      :user="loggedInUser"
      @change-page="changePage"
      @close="changePage('DashboardPage')"
    />
    <MeetingsPage
      v-if="currentPage === 'MeetingsPage'"
      :user="loggedInUser"
      @change-page="changePage"
    />
    <CalendarPage
      v-if="currentPage === 'CalendarPage'"
      :user="loggedInUser"
      @change-page="changePage"
    />
    <PetRequestsPage
      v-if="currentPage==='PetRequestsPage'"
      :user="loggedInUser"
      @change-page="changePage"
    />
    <EditUserDashboard
      v-if="currentPage === 'EditUserDashboard'"
      :user="loggedInUser"
      :pets="userPets"
      @change-page="changePage"
    />
    <PetDescriptionPage
      v-if="currentPage === 'PetDescriptionPage'"
      :pet="pageProps.pet"
      :user="loggedInUser"
      @change-page="changePage"
      @close="changePage('DashboardPage')"
    />
    <UsersFavouritesPage
      v-if="currentPage === 'UsersFavouritesPage'"
      :user="loggedInUser"
      @view-pet-profile="viewPetProfile"
      @change-page="changePage"
    />

  </div>
</template>

<script>
import LandingPage from './components/LandingPage.vue';
import SignupPage from './components/SignupPage.vue';
import DashboardPage from './components/DashboardPage.vue';
import AddPetPage from './components/AddPetPage.vue';
import LoginPage from './components/LoginPage.vue';
import WelcomePage from './components/WelcomePage.vue';
import LogoutPage from './components/LogoutPage.vue';
import BrowsePetsPage from './components/BrowsePetsPage.vue';
import EditPetDashboard from './components/EditPetDashboard.vue';
import BookPetAppointmentPage from './components/BookPetAppointmentPage.vue';
import MeetingsPage from './components/MeetingsPage.vue';
import CalendarPage from './components/CalendarPage.vue';
import PetRequestsPage from './components/PetRequestsPage.vue';
import EditUserDashboard from './components/EditUserDashboard.vue';
import PetDescriptionPage from './components/PetDescriptionPage.vue';
import UsersFavouritesPage from './components/UsersFavouritesPage.vue';
import axios from 'axios';

export default {
  components: {
    LandingPage,
    SignupPage,
    DashboardPage,
    AddPetPage,
    LoginPage,
    WelcomePage,
    LogoutPage,
    BrowsePetsPage,
    EditPetDashboard,
    BookPetAppointmentPage,
    MeetingsPage,
    CalendarPage,
    UsersFavouritesPage,
    PetRequestsPage,
    EditUserDashboard,
    PetDescriptionPage
  },
  data() {
    return {
      currentPage: 'LandingPage',
      currentUser: null,
      selectedPet: null,
      loggedInUser: null, 
      pageProps: {}, // ✅ Fix: Add this to prevent undefined error
      userPets: [],
      googleFullname: '',
      googleEmail: '',
      editMode: false 
    };
  },
  methods: {
    viewPetProfile(pet) {
      this.changePage('PetDescriptionPage', { pet });
    },
    handleGoogleSuccess(response) {
      console.log('✅ Google login response:', response);
      this.onLogin(response);
    },
    onLogin(payload) {
      console.log('✅ onLogin payload:', payload);
      this.googleEmail =
        payload.email ||
        (payload.user && payload.user.email) ||
        '';
      this.googleFullname =
        payload.fullname || // for your emitted object
        (payload.user && payload.user.fullname)
        '';
        this.currentUser = payload;
        this.loggedInUser = payload;

      // // ✅ Redirect logic
      // if (!payload.user_type || !payload.email) {
      //   this.changePage('SignupPage');
      // } else {
      //   this.changePage('DashboardPage');
      // }
      axios
      .get(`${process.env.VUE_APP_API_URL}/api/auth/users/email/${this.googleEmail}`, { withCredentials: true })
      .then(res => {
        this.loggedInUser = res.data.user; // ✅ will now include phone_number
        if (!this.loggedInUser?.user_type) {
          return this.changePage("SignupPage");
        }
        this.changePage('DashboardPage');
      })
      .catch(err => {
        console.error('Error fetching user by email:', err);
      });
    },
    changePage(page, props = {}) {
      this.currentPage = page;
      this.pageProps = props; // ✅ Fix: Capture props like petId
    },
    setUser(user) {
      this.currentUser = user;
      this.currentPage = 'DashboardPage';
    },
    openEditPetPage(pet) {
      this.selectedPet = pet;
      this.currentPage = 'EditPetDashboard';
    },
    closePetDashboard() {
      this.selectedPet = null;
    },
    handleUserRegistered(user) {
      console.log('✅ handleUserRegistered got user:', user);
      // Store it so DashboardPage sees it
      this.loggedInUser = user;
      // Immediately navigate
      this.changePage('DashboardPage');
    },
  }
};
</script>
