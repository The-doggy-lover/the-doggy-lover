<template>
  <div class="signup-wrapper">
    <div>
      <div id="googleSignInDiv"></div>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';

export default {
  async mounted() {
    await nextTick();

    window.google.accounts.id.initialize({
      client_id: "452147930843-at6leqa9ruodie7fbuq2mbhvk5iafatu.apps.googleusercontent.com",
      callback: this.handleCredentialResponse,
    });

    const signInDiv = document.getElementById("googleSignInDiv");
    if (signInDiv) {
      window.google.accounts.id.renderButton(signInDiv, {
        theme: "outline",
        size: "large"
      });
    } else {
      console.warn("googleSignInDiv not found");
    }
  },
  methods: {
    async handleCredentialResponse(response) {
      const { credential } = response;
      const decoded = this.parseJwt(credential); // decode token

      const email = decoded.email;
      const name = decoded.name;

      try {
        const res = await fetch("http://localhost:3000/google-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, fullname: name }),
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          this.$emit('user-logged-in', data.user); // emit user to parent
          this.$emit('change-page', 'DashboardPage');
        } else {
          alert("Login failed: " + data.message);
        }
      } catch (err) {
        console.error("Login error", err);
      }
    },
    parseJwt(token) {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(atob(base64).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(jsonPayload);
    },
  },
};
</script>


<style scoped>
.signup-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  min-height: 100vh;
}

.top-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.top-buttons button {
  padding: 6px 14px;
  font-size: 14px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.top-buttons button:hover {
  background-color: #218838;
}

.form-box {
  width: 400px;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  background: white;
}

h2 {
  text-align: center;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
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

button[type="submit"] {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
  background-color: #218838;
}
</style>
