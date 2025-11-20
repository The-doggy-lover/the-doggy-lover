<template>
  <div class="logout-wrapper">
    <h2>You have been logged out.</h2>
    <button @click="$emit('change-page', 'LandingPage')">Go to Login</button>
  </div>
</template>

<script>
export default {
  emits: ['change-page'],
  mounted() {
    // If you need to clear any localStorage/cookies/session, do it here
    // localStorage.removeItem('user');
    // document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log('User logged out');
  }
};
</script>

<style scoped>
.logout-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background-color: #c82333;
}
</style>
