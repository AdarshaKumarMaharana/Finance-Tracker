export function showToast(msg) {
  const toast = document.createElement("div");
  toast.className =
    "fixed top-5 right-5 bg-black text-white px-4 py-2 rounded shadow";
  toast.textContent = msg;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}
