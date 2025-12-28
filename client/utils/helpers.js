  export function capitalizeFirstLetter(input) {
    const value = input.value;
    if (value.length === 0) return;

    input.value =
      value.charAt(0).toUpperCase() + value.slice(1);
  }

 // Toast container banate hain (ek baar hi)
const toastContainer = document.createElement('div');
toastContainer.id = 'toastContainer';
document.body.appendChild(toastContainer);

  export function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;

  // Container mein add karo (niche se upar stack)
  toastContainer.appendChild(toast);

  // Force reflow to trigger animation
  toast.offsetHeight;

  // Show animation
  toast.classList.add('show');

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, 3000);
}