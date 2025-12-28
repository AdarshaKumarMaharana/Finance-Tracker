import { apiFetch } from "../utils/api.js";
import { showToast } from "../utils/helpers.js";

/* ================= LOGIN ================= */
export function initLogin() {
  const form = document.getElementById("loginForm");

  const loginBtn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");
  const spinner = document.getElementById("loginSpinner");

  /* ================= LOADING HANDLER ================= */
  const setLoading = (isLoading) => {
    [...form.elements].forEach((el) => {
      el.disabled = isLoading;
    });

    if (isLoading) {
      btnText.classList.add("opacity-0");
      spinner.classList.remove("opacity-0");
      loginBtn.classList.add("cursor-not-allowed", "opacity-70");
    } else {
      btnText.classList.remove("opacity-0");
      spinner.classList.add("opacity-0");
      loginBtn.classList.remove("cursor-not-allowed", "opacity-70");
    }
  };

  /* ================= SUBMIT ================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showToast("Please fill all fields", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));

        showToast(res.message || "Login successful!", "success");

        //Redirect to dashboard
        setTimeout(() => {
          location.href = "dashboard.html";
        }, 1500);
      } else {
        showToast(res.message || "Login failed", "error");
        setLoading(false);
      }
    } catch (err) {
      showToast(err.message || "Login failed", "error");
      setLoading(false);
    }
  });
}
