
const themeToggleBtn = document.getElementById("themeToggle");

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains("dark");

  themeToggleBtn.innerHTML = isDark
    ? '<i data-lucide="sun" class="w-5 h-5"></i>'
    : '<i data-lucide="moon" class="w-5 h-5"></i>';

  lucide.createIcons();
}

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}
updateThemeIcon();

// Toggle theme
themeToggleBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon();
});



