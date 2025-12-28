import { apiFetch } from "../utils/api.js";
import { capitalizeFirstLetter, showToast } from "../utils/helpers.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dqlbzmigi/image/upload";
const UPLOAD_PRESET = "paisapath";

/* ================= IMAGE UPLOAD ================= */
export async function uploadProfileImage(file) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "avatars");

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

/* ================= REGISTER ================= */
export function initRegister() {
  const form = document.getElementById("registerForm");

  const registerBtn = document.getElementById("registerBtn");
  const btnText = document.getElementById("registerBtnText");
  const spinner = document.getElementById("registerSpinner");

  const avatarInput = document.getElementById("avatarInput");
  const avatarWrapper = document.getElementById("avatarPreviewWrapper");
  const avatarPreview = document.getElementById("avatarPreview");
  const uploadLabel = document.getElementById("avatarUploadLabel");
  const removeBtn = document.getElementById("removeAvatarBtn");

  let avatarFile = null;

  /* ================= LOADING HANDLER ================= */
  const setLoading = (isLoading) => {
    [...form.elements].forEach((el) => (el.disabled = isLoading));

    if (isLoading) {
      btnText.classList.add("opacity-0");
      spinner.classList.remove("opacity-0");
      registerBtn.classList.add("opacity-70", "cursor-not-allowed");
    } else {
      btnText.classList.remove("opacity-0");
      spinner.classList.add("opacity-0");
      registerBtn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  };

  /* ================= AVATAR SELECT ================= */
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    avatarFile = file;
    avatarPreview.src = URL.createObjectURL(file);

    uploadLabel.classList.add("hidden");
    avatarWrapper.classList.remove("hidden");

    lucide.createIcons();
  });

  /* ================= REMOVE AVATAR ================= */
  removeBtn.addEventListener("click", () => {
    avatarFile = null;
    avatarInput.value = "";

    avatarWrapper.classList.add("hidden");
    uploadLabel.classList.remove("hidden");
    avatarPreview.src = "";
  });

  /* ================= NAME CAPITALIZE ================= */
  const firstNameInput = document.getElementById("registerFirstName");
  const lastNameInput = document.getElementById("registerLastName");

  [firstNameInput, lastNameInput].forEach((input) => {
    if (input)
      input.addEventListener("input", () => capitalizeFirstLetter(input));
  });

  /* ================= SUBMIT ================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!firstName || !lastName || !email || !password) {
      showToast("Please fill all fields", "error");
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = null;

      if (avatarFile) {
        profileImageUrl = await uploadProfileImage(avatarFile);
      }

      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstname: firstName,
          lastname: lastName,
          email,
          password,
          profileImageUrl,
        }),
      });

      if (res.success) {
        showToast(res.message || "Account created successfully!", "success");

        document.getElementById("openLogin").click();
        form.reset();

        // reset avatar UI
        avatarWrapper.classList.add("hidden");
        uploadLabel.classList.remove("hidden");
        avatarPreview.src = "";
        avatarFile = null;
      } else {
        showToast(res.message || "Registration failed", "error");
        setLoading(false);
      }
    } catch (err) {
      showToast(err.message || "Registration failed", "error");
      setLoading(false);
    }
  });
}
