export function initAuthUI() {
  const getStartedBtn = document.getElementById("getStartedBtn");
  const getStartedBtn2 = document.getElementById("getStartedBtn2");
  const Section = document.getElementById("section");
  const authSection = document.getElementById("authSection");

  const formTitle = document.getElementById("formTitle");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const openRegister = document.getElementById("openRegister");
  const openLogin = document.getElementById("openLogin");
  const themeToggle = document.getElementById("themeToggle");

  function showAuth() {
    Section.classList.add("hidden");
    authSection.classList.remove("hidden");

    const authCard = document.getElementById("authCard");
    if (authCard) {
      // Animate
      setTimeout(() => {
        authCard.classList.remove("scale-90", "translate-y-10", "opacity-0");
        authCard.classList.add("scale-100", "translate-y-0", "opacity-100");
      }, 50); // small timeout to trigger transition
    }

    showLogin(); // default view
  }

  function showLogin() {
    if (formTitle) formTitle.textContent = "Welcome Back";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  }

  function showRegister() {
    if (formTitle) formTitle.textContent = "Create An Account";
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }

  // Event Listeners
  if (getStartedBtn) getStartedBtn.onclick = showAuth;
  if (getStartedBtn2) getStartedBtn2.onclick = showAuth;
  if (openRegister) openRegister.onclick = showRegister;
  if (openLogin) openLogin.onclick = showLogin;

  // -----------------------------
  // THEME TOGGLE WITH LOCALSTORAGE
  // -----------------------------
  function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains("dark");
    if (themeToggle) {
      themeToggle.innerHTML = isDark
        ? '<i data-lucide="sun" class="w-5 h-5 stroke-yellow-400"></i>'
        : '<i data-lucide="moon" class="w-5 h-5 stroke-gray-800 dark:stroke-white"></i>';
      lucide.createIcons();
    }
  }

  // Load theme from localStorage or default to light
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon();

  // Toggle button
  if (themeToggle) {
    themeToggle.onclick = () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeIcon();
    };
  }
}

function capitalizeFirstLetter(input) {
  const value = input.value;
  if (value.length === 0) return;

  input.value = value.charAt(0).toUpperCase() + value.slice(1);
}

const slides = document.querySelectorAll("#carouselSlides > div");
let current = 0;
const total = slides.length;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.style.opacity = i === index ? "1" : "0";
    slide.style.zIndex = i === index ? "10" : "0";
  });
}

function nextSlide() {
  current = (current + 1) % total;
  showSlide(current);
}

showSlide(current);
setInterval(nextSlide, 4000);
