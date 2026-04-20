<template>
  <div class="container">
    <div class="card">

      <!-- Header with logo and brand -->
      <header class="header">
        <div class="logo-wrapper">
          <div>
            <img id="logo" src="/logo.png">
          </div>
        </div>
      </header>

      <!-- Main Illustration -->
      <div class="illustration-wrapper">
        <img id="centre-piece" src="/centre.png">
      </div>

      <!-- Heading -->
      <div class="heading">
        <h1>Find Your <span>New Furry</span><br />Best Friend</h1>
      </div>

      <!-- Subtitle -->
      <p class="subtitle">Connect to Pets in your location</p>

      <!-- Button -->
      <div class="button-group">
        <div id="googleSignInButton" class="google-btn"></div>
      </div>

    </div>
  </div>
</template>

<script>
const backendUrl = process.env.VUE_APP_API_URL;

export default {
  name: 'LandingPage',
  mounted() {
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = this.initGoogleLogin
      document.head.appendChild(script)
    } else {
      this.initGoogleLogin()
    }
  },
  methods: {
    initGoogleLogin() {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: '452147930843-at6leqa9ruodie7fbuq2mbhvk5iafatu.apps.googleusercontent.com',
          callback: this.handleCredentialResponse,
          ux_mode: 'popup'
        })

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 300
          }
        )
      }
    },
    async handleCredentialResponse(response) {
      console.log('🟢 Google callback fired');

      try {
        const { credential } = response;
        const payload = JSON.parse(atob(credential.split('.')[1]));
        const email = payload.email;
        const fullname = payload.name;

        console.log('📤 Sending to backend:', email, fullname);

        const res = await fetch(`${backendUrl}/api/auth/google-login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullname })
        });

        console.log('📥 Raw response:', res);

        const data = await res.json();
        console.log('🟢 Backend response:', data);

        console.log('🟢 Emitting user-logged-in NOW');
        this.$emit('user-logged-in', {
          ...data.user,
          isNew: data.isNew
        });

      } catch (err) {
        console.error('💥 Google login FAILED:', err);
      }
    },
    handleSignUp() {
      this.$emit('change-page', 'SignupPage')
    },
    handleLogin() {
      this.$emit('change-page', 'LoginPage')
    }
  }
}
</script>

<style scoped>
/* Container and card */
.container {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: Verdana, sans-serif;
}


/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem 1rem 1.5rem;
}

.heading {
  text-align: center;
}

.heading span {
  color: rgb(3, 144, 252);
}

.subtitle {
  color: grey;
  text-align: center;
  padding-bottom: 1rem;
}

.logo-wrapper {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
}

#logo{
  width: 5rem;
  height: 5rem;
}

.google-btn{
  border-radius: 50%;
}

/* Illustration */
.illustration-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0 1.5rem;
}

#centre-piece {
  width: 15rem;
  height: 15rem;
  padding: 1.5rem;
}
/* Responsive layout */
@media (max-width: 640px) {
  .signup-container {
    padding: 1.5rem;
  }
  .heading {
    font-size: 1.5rem;
  }
  .subtitle {
    font-size: 0.875rem;
  }
  .button-group {
    gap: 0.75rem;
  }
  .pet1, .pet2, .pet3, .pet4 {
    width: 2rem;
    height: 2rem;
  }
  .pet1 {
    top: 3rem;
    left: 2rem;
  }
  .pet2 {
    top: 4rem;
    right: 3rem;
  }
  .pet3 {
    bottom: 2rem;
    left: 3rem;
  }
  .pet4 {
    bottom: 1.5rem;
    right: 2rem;
  }
}

/* Accessibility focus states */
.signup-btn:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.login-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
