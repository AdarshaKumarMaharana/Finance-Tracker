const API_BASE = "http://localhost:5000/api";

const toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
document.body.appendChild(toastContainer);

function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;

  toastContainer.appendChild(toast);

  toast.offsetHeight;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, 3000);
}

// Cloudinary upload
const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "paisapath");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dqlbzmigi/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  if (data.secure_url) {
    return data.secure_url;
  }
  throw new Error("Image upload failed");
};

document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM Element References ---
  const totalBalanceEl = document.getElementById("totalBalance");
  const totalIncomeEl = document.getElementById("totalIncome");
  const totalExpensesEl = document.getElementById("totalExpenses");
  const transactionListEl = document.getElementById("transactionList");
  const emptyStateContainer = document.getElementById("empty-state-container");

  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalBtn2 = document.getElementById("closeModalBtn2");
  const transactionModal = document.getElementById("transactionModal");
  const transactionForm = document.getElementById("transactionForm");
  const modalTitle = document.getElementById("modalTitle");

  const confirmModal = document.getElementById("confirmModal");
  const confirmModalTitle = document.getElementById("confirmModalTitle");
  const confirmModalText = document.getElementById("confirmModalText");
  const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  // Tab elements
  const tabTransaction = document.getElementById("tabTransaction");
  const tabCategory = document.getElementById("tabCategory");
  const tabTransactionContent = document.getElementById(
    "tabTransactionContent"
  );
  const tabCategoryContent = document.getElementById("tabCategoryContent");

  const categoryForm = document.getElementById("categoryForm");

  // --- Chart References ---
  let categoryPieChart = null;
  let incomeVsExpenseChart = null;

  // --- Auth Check ---
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // --- Utility Functions ---
  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // --- API Helper ---
  const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...options,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "API Error");
    return data;
  };

  // --- State ---
  let transactions = [];
  let categories = [];
  let summaryData = {};

  // Safe getCategoryName
  const getCategoryName = (category_id) => {
    if (!category_id || categories.length === 0) return "Uncategorized";
    const id = Number(category_id);
    const cat = categories.find((c) => Number(c.id) === id);
    return cat ? cat.name : "Uncategorized";
  };

  // --- Modal Functions ---
  const openModal = () =>
    transactionModal && transactionModal.classList.remove("hidden");
  const closeModal = () =>
    transactionModal && transactionModal.classList.add("hidden");
  const openConfirmModal = () =>
    confirmModal && confirmModal.classList.remove("hidden");
  const closeConfirmModal = () =>
    confirmModal && confirmModal.classList.add("hidden");

  // --- Render Functions ---
  const renderTransactionList = () => {
    transactionListEl.innerHTML = "";

    if (transactions.length === 0) {
      emptyStateContainer.classList.remove("hidden");
      return;
    }

    emptyStateContainer.classList.add("hidden");

    let filtered = [...transactions];

    const searchTerm = searchInput?.value?.toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          t.category_name.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    const sortValue = sortSelect?.value || "date_desc";
    filtered.sort((a, b) => {
      switch (sortValue) {
        case "date_asc":
          return new Date(a.date) - new Date(b.date);
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    filtered.forEach((transaction) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50 dark:hover:bg-gray-800 transition";
      row.dataset.id = transaction.uniqueId;
      row.dataset.type = transaction.type;

      const amountColor =
        transaction.type === "income" ? "text-green-600" : "text-red-600";
      const amountSign = transaction.type === "income" ? "+" : "-";

      row.innerHTML = `
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${
            transaction.icon || (transaction.type === "income" ? "💰" : "🛒")
          }</span>
          <div>
            <div class="font-semibold text-base capitalize">${
              transaction.title
            }</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">${
              transaction.category_name
            }</div>
          </div>
        </div>
      </td>

      <!-- Description Column -->
      <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs capitalize">
        ${
          transaction.description
            ? `<p class="line-clamp-2">${transaction.description}</p>`
            : '<span class="text-gray-400 italic">No description</span>'
        }
      </td>

      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${formatDate(
        transaction.date
      )}</td>
      <td class="px-6 py-4 text-right ${amountColor} font-medium text-lg">
        ${amountSign} ${formatCurrency(transaction.amount)}
      </td>
      <td class="px-6 py-4 text-center">
        <button class="edit-btn text-indigo-600 hover:underline mr-4 text-sm font-medium">Edit</button>
        <button class="delete-btn text-red-600 hover:underline text-sm font-medium">Delete</button>
      </td>
    `;
      transactionListEl.appendChild(row);
    });
  };

  const renderCategoryPieChart = () => {
    const container = document.getElementById("categoryChartContainer");
    if (!container) return;

    if (categoryPieChart) categoryPieChart.destroy();

    const expenseData = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category_name] = (acc[t.category_name] || 0) + t.amount;
        return acc;
      }, {});

    const categories = Object.keys(expenseData);
    const amounts = Object.values(expenseData);

    if (categories.length === 0) {
      container.innerHTML =
        '<div class="text-center text-gray-500 dark:text-gray-400 py-20 text-lg">No expense data yet</div>';
      return;
    }

    // Dynamic vibrant colors — starting from blue/green zone (not red)
    const generateColors = (num) => {
      const colors = [];
      const startHue = 99;
      for (let i = 0; i < num; i++) {
        const hue = (startHue + (i * 360) / num) % 360;
        colors.push(`hsl(${hue}, 75%, 60%)`);
      }
      return colors;
    };

    const backgroundColors = generateColors(categories.length);

    container.innerHTML = '<canvas id="categoryPieChart"></canvas>';
    const ctx = document.getElementById("categoryPieChart").getContext("2d");

    categoryPieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: categories,
        datasets: [
          {
            data: amounts,
            backgroundColor: backgroundColors,
            borderColor: "#fff",
            borderWidth: 3,
            hoverBorderWidth: 5,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 14 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "68%",
        animation: {
          animateRotate: true,
          duration: 1800,
        },
      },
    });
  };

  const renderIncomeVsExpenseChart = () => {
    const container = document.getElementById("trendChartContainer");
    if (!container) return;

    if (incomeVsExpenseChart) {
      incomeVsExpenseChart.destroy();
      incomeVsExpenseChart = null;
    }

    const monthly = transactions.reduce((acc, t) => {
      // Safe date parsing
      const date = new Date(t.date);
      if (isNaN(date.getTime())) return acc; // invalid date skip

      const monthKey = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      if (!acc[monthKey]) acc[monthKey] = { income: 0, expense: 0 };
      if (t.type === "income") {
        acc[monthKey].income += Number(t.amount);
      } else if (t.type === "expense") {
        acc[monthKey].expense += Number(t.amount);
      }
      return acc;
    }, {});

    const months = Object.keys(monthly).sort((a, b) => {
      const dateA = new Date(`01 ${a}`);
      const dateB = new Date(`01 ${b}`);
      return dateA - dateB;
    });

    // Agar koi bhi income ya expense hai to chart dikhao
    const hasData = months.some(
      (m) => monthly[m].income > 0 || monthly[m].expense > 0
    );

    if (months.length === 0 || !hasData) {
      container.innerHTML = `
      <div class="h-full flex items-center justify-center">
        <p class="text-center text-gray-500 dark:text-gray-400 text-lg">
          No transaction data available yet<br>
          <span class="text-sm">Add some income or expenses to see the trend</span>
        </p>
      </div>
    `;
      return;
    }

    // Clear container aur canvas add karo
    container.innerHTML = '<canvas id="incomeVsExpenseChart"></canvas>';

    const ctx = document
      .getElementById("incomeVsExpenseChart")
      ?.getContext("2d");
    if (!ctx) return;

    incomeVsExpenseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Income",
            data: months.map((m) => monthly[m].income || 0),
            backgroundColor: "rgba(34, 197, 94, 0.8)",
            borderColor: "#16a34a",
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Expense",
            data: months.map((m) => monthly[m].expense || 0),
            backgroundColor: "rgba(239, 68, 68, 0.8)",
            borderColor: "#dc2626",
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "rectRounded",
              font: { size: 14 },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ₹${context.parsed.y.toFixed(
                  2
                )}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { padding: 10 },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: { padding: 10 },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    });
  };

  const renderCharts = () => {
    renderCategoryPieChart();
    renderIncomeVsExpenseChart();
  };

  const renderBudgetProgress = () => {
    const budgetList = document.getElementById("budgetList");
    const noBudgetState = document.getElementById("noBudgetState");

    if (!summaryData.categories || summaryData.categories.length === 0) {
      budgetList.innerHTML = "";
      noBudgetState.classList.remove("hidden");
      return;
    }

    const budgetedCategories = summaryData.categories.filter(
      (cat) => cat.budget && Number(cat.budget) > 0
    );

    if (budgetedCategories.length === 0) {
      budgetList.innerHTML = "";
      noBudgetState.classList.remove("hidden");
      return;
    }

    noBudgetState.classList.add("hidden");
    budgetList.innerHTML = "";

    budgetedCategories.forEach((cat) => {
      const progress = cat.progress || 0;
      const overBudget = progress > 100;
      const progressWidth = Math.min(progress, 100);
      const progressColor = overBudget ? "bg-red-500" : "bg-green-500";

      const card = document.createElement("div");
      card.className = `
  transition-all duration-500 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700
  bg-white/80 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#020617] dark:to-[#020617]
`;

      card.innerHTML = `

<!-- Top Section: Icon + Name + Percentage -->
<div class="flex items-start justify-between mb-5">
  <div class="flex items-center gap-4">
    <!-- Big Category Icon -->
    <div class="w-14 h-14 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-2xl text-3xl">
      ${cat.icon || "🛒"}
    </div>

    <!-- Name + Spent Info -->
    <div>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white capitalize">${
        cat.name
      }</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Spent ₹${Number(cat.spent || 0).toFixed(2)} of ₹${Number(
        cat.budget || 0
      ).toFixed(2)}
      </p>
    </div>
  </div>

  <!-- Percentage -->
  <div class="text-right">
    <span class="text-2xl font-bold ${
      overBudget ? "text-red-600" : "text-green-600"
    }">
      ${progress.toFixed(0)}%
    </span>
    ${
      overBudget
        ? '<p class="text-xs text-red-600 font-medium mt-1">Over budget!</p>'
        : ""
    }
  </div>
</div>

<!-- Progress Bar -->
<div class="relative">
  <div class="
    w-full 
    bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200
    dark:from-[#1e293b] dark:via-[#111827] dark:to-[#0f172a]

    transition-all duration-500 
    rounded-full h-7 overflow-hidden
  ">
    <div class="${progressColor} h-7 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style="width: ${progressWidth}%">
      <!-- Shine effect for premium feel -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -translate-x-full animate-shine rounded-full"></div>
    </div>

    <!-- Remaining amount label inside bar if space -->
    ${
      progressWidth < 95
        ? `
      <span class="absolute top-1/2 left-4 -translate-y-1/2 z-10 text-sm text-gray-800 font-bold dark:text-white">
        ₹${(cat.budget - cat.spent).toFixed(0)} left
      </span>
    `
        : ""
    }
  </div>
</div>


<!-- Optional: Days left or warning -->
<p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
  ${
    overBudget
      ? "Over budget! Consider reviewing your expenses."
      : "Stay on track!"
  }
</p>
`;

      budgetList.appendChild(card);
    });
  };

  // --- Load All Data ---
  const loadData = async () => {
    try {
      const [summaryRes, expensesRes, incomeRes, categoriesRes] =
        await Promise.all([
          apiFetch("/transactions/summary"),
          apiFetch("/expenses"),
          apiFetch("/income"),
          apiFetch("/categories"),
        ]);

      summaryData = summaryRes;

      totalBalanceEl.textContent = formatCurrency(
        summaryData.summary.savings || 0
      );
      totalIncomeEl.textContent = formatCurrency(
        summaryData.summary.totalIncome || 0
      );
      totalExpensesEl.textContent = formatCurrency(
        summaryData.summary.totalExpenses || 0
      );

      categories = categoriesRes.categories || [];

      transactions = [
        ...(expensesRes.expenses || []).map((t) => ({
          ...t,
          type: "expense",
          title: t.name,
          category_name: getCategoryName(t.category_id),
          uniqueId: `expense-${t.id}`,
          icon: t.icon || "🛒",
        })),
        ...(incomeRes.incomes || []).map((t) => ({
          ...t,
          type: "income",
          title: t.name,
          category_name: getCategoryName(t.category_id),
          uniqueId: `income-${t.id}`,
          icon: t.icon || "💰",
        })),
      ];

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      filterCategoryDropdown();
      renderTransactionList();
      renderCharts();
      renderBudgetProgress();
    } catch (err) {
      showToast("Error loading data: " + err.message);
      console.error(err);
    }
  };

  // --- Profile Dropdown & Logout Logic ---
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const openProfileOption = document.getElementById("openProfileOption");
  const logoutBtn = document.getElementById("logoutBtn");

  // Toggle dropdown when clicking on avatar
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("hidden");
  });

  // Open Profile Modal (My Profile option)
  openProfileOption.addEventListener("click", async (e) => {
    e.stopPropagation();
    profileDropdown.classList.add("hidden");

    try {
      const profileRes = await apiFetch("/profile");
      const user = profileRes.user;

      if (!user) return showToast("User data not found", "error");

      const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
      document.getElementById("profileName").textContent =
        fullName || "User Name";
      document.getElementById("profileEmail").textContent =
        user.email || "user@email.com";

      // Avatar handling
      const modalImg = document.getElementById("modalProfileImage");
      const navImg = document.getElementById("profileImage");
      if (user.profileImageUrl) {
        modalImg.src = user.profileImageUrl;
        modalImg.classList.remove("hidden");
        document.getElementById("modalProfileFallback").classList.add("hidden");

        navImg.src = user.profileImageUrl;
        navImg.classList.remove("hidden");
        document.getElementById("profileFallback").classList.add("hidden");
      } else {
        modalImg.classList.add("hidden");
        document
          .getElementById("modalProfileFallback")
          .classList.remove("hidden");

        navImg.classList.add("hidden");
        document.getElementById("profileFallback").classList.remove("hidden");
      }

      // Joined date
      if (user.joinedDate) {
        document.getElementById("profileJoined").textContent = new Date(
          user.joinedDate
        ).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      }

      // Total transactions
      document.getElementById("profileTransactions").textContent =
        transactions.length || 0;

      // Show modal
      profileModal.classList.remove("hidden");
    } catch (err) {
      showToast("Error loading profile: " + err.message, "error");
      console.error(err);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.add("hidden");
    localStorage.clear();
    showToast("Logged out successfully", "success");
    setTimeout(() => (window.location.href = "index.html"), 1200);
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add("hidden");
    }
  });

  // --- Edit Profile & Avatar Logic ---
  let editAvatarFile = null;
  const editAvatarInput = document.getElementById("editAvatarInput");
  const editAvatarPreviewWrapper = document.getElementById(
    "editAvatarPreviewWrapper"
  );
  const editAvatarPreview = document.getElementById("editAvatarPreview");
  const editAvatarUploadLabel = document.getElementById(
    "editAvatarUploadLabel"
  );
  const removeEditAvatarBtn = document.getElementById("removeEditAvatarBtn");

  // Avatar upload
  editAvatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    editAvatarFile = file;
    editAvatarPreview.src = URL.createObjectURL(file);
    editAvatarUploadLabel.classList.add("hidden");
    editAvatarPreviewWrapper.classList.remove("hidden");
  });

  removeEditAvatarBtn.addEventListener("click", () => {
    editAvatarFile = null;
    editAvatarInput.value = "";
    editAvatarPreviewWrapper.classList.add("hidden");
    editAvatarUploadLabel.classList.remove("hidden");
    editAvatarPreview.src = "";
  });

  // Function to open edit mode
  const openEditMode = (user) => {
    document.getElementById("editFirstName").value = user.firstname || "";
    document.getElementById("editLastName").value = user.lastname || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editPassword").value = "";

    editAvatarFile = null;
    editAvatarInput.value = "";
    editAvatarPreviewWrapper.classList.add("hidden");
    editAvatarUploadLabel.classList.remove("hidden");

    if (user.profileImageUrl) {
      editAvatarPreview.src = user.profileImageUrl;
      editAvatarPreviewWrapper.classList.remove("hidden");
      editAvatarUploadLabel.classList.add("hidden");
    }

    profileView.classList.add("hidden");
    editProfileForm.classList.remove("hidden");
  };

  // Edit button click
  editProfileBtn.addEventListener("click", async () => {
    try {
      const profileRes = await apiFetch("/profile");
      const user = profileRes.user;
      if (!user) return showToast("Failed to load data for editing", "error");
      openEditMode(user);
    } catch (err) {
      showToast("Failed to load data for editing", "error");
    }
  });

  // Cancel edit
  cancelEditBtn.addEventListener("click", () => {
    editProfileForm.classList.add("hidden");
    profileView.classList.remove("hidden");
  });

  // Capitalize first/last name
  [
    document.getElementById("editFirstName"),
    document.getElementById("editLastName"),
  ].forEach((input) => {
    if (input)
      input.addEventListener("input", () => {
        input.value =
          input.value.charAt(0).toUpperCase() +
          input.value.slice(1).toLowerCase();
      });
  });

  // --- Form Submit ---
  const editProfileSubmitBtn = document.getElementById("editProfileSubmitBtn");
  const editProfileSpinner = document.getElementById("editProfileSpinner");
  const editProfileBtnText = document.getElementById("editProfileBtnText");

  const setEditLoading = (isLoading) => {
    editProfileSubmitBtn.disabled = isLoading;

    if (isLoading) {
      editProfileBtnText.classList.add("opacity-0");
      editProfileSpinner.classList.remove("opacity-0");
    } else {
      editProfileBtnText.classList.remove("opacity-0");
      editProfileSpinner.classList.add("opacity-0");
    }
  };

  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const password = document.getElementById("editPassword").value.trim();

    if (!firstName || !lastName || !email)
      return showToast("Please fill all required fields", "error");

    setEditLoading(true);

    try {
      let profileImageUrl = null;
      if (editAvatarFile)
        profileImageUrl = await uploadProfileImage(editAvatarFile);

      const res = await apiFetch("/update-profile", {
        method: "PUT",
        body: JSON.stringify({
          firstname: firstName,
          lastname: lastName,
          email,
          password: password || null,
          profileImageUrl,
        }),
      });

      if (res.success) {
        showToast(res.message || "Profile updated successfully!", "success");

        const fullName = `${firstName} ${lastName}`.trim();
        document.getElementById("profileName").textContent = fullName;
        document.getElementById("profileEmail").textContent = email;

        if (profileImageUrl) {
          const modalImg = document.getElementById("modalProfileImage");
          modalImg.src = profileImageUrl;
          modalImg.classList.remove("hidden");
          document
            .getElementById("modalProfileFallback")
            .classList.add("hidden");

          const navImg = document.getElementById("profileImage");
          navImg.src = profileImageUrl;
          navImg.classList.remove("hidden");
          document.getElementById("profileFallback").classList.add("hidden");
        }

        // Reset and switch view
        profileView.classList.remove("hidden");
        editProfileForm.classList.add("hidden");
        editProfileForm.reset();
        editAvatarFile = null;
        editAvatarPreviewWrapper.classList.add("hidden");
        editAvatarUploadLabel.classList.remove("hidden");
        editAvatarPreview.src = "";
      } else {
        showToast(res.message || "Update failed", "error");
      }
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setEditLoading(false);
    }
  });

  // Close modal
  closeProfileModal.addEventListener("click", () => {
    profileModal.classList.add("hidden");
    editProfileForm.classList.add("hidden");
    profileView.classList.remove("hidden");
  });

  // --- Filter Category Dropdown based on Type ---
  const filterCategoryDropdown = (type = "income") => {
    const select = document.getElementById("category");
    if (!select) return;

    select.innerHTML = '<option value="">Select Category</option>';

    const filteredCategories = categories.filter((cat) => cat.type === type);

    filteredCategories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });

    if (select.value) {
      const selectedCat = categories.find((c) => c.id == select.value);
      if (selectedCat && selectedCat.type !== type) {
        select.value = "";
      }
    }
  };

  filterCategoryDropdown("income");

  const typeRadios = document.querySelectorAll('input[name="type"]');
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      filterCategoryDropdown(e.target.value);
    });
  });

  // --- Tab Switching ---
  if (tabTransaction && tabCategory) {
    tabTransaction.addEventListener("click", () => {
      tabTransaction.classList.add(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabTransaction.classList.remove("text-gray-500", "dark:text-gray-400");
      tabCategory.classList.remove(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabCategory.classList.add("text-gray-500", "dark:text-gray-400");

      tabTransactionContent.classList.remove("hidden");
      tabCategoryContent.classList.add("hidden");
      modalTitle.textContent = "Add Transaction";
    });

    tabCategory.addEventListener("click", () => {
      tabCategory.classList.add("text-primary", "border-b-4", "border-primary");
      tabCategory.classList.remove("text-gray-500", "dark:text-gray-400");
      tabTransaction.classList.remove(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabTransaction.classList.add("text-gray-500", "dark:text-gray-400");

      tabCategoryContent.classList.remove("hidden");
      tabTransactionContent.classList.add("hidden");
      modalTitle.textContent = "Add New Category";
    });
  }

  // --- Add Category Form Submit ---
  if (categoryForm) {
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("categoryName").value.trim();
      const type = document.querySelector(
        'input[name="categoryType"]:checked'
      ).value;
      const setBudget = setBudgetCheckbox.checked && type === "expense";
      const monthlyBudget = setBudget
        ? parseFloat(document.getElementById("monthlyBudget").value)
        : null;

      const emojiBtn = document.querySelector(
        '#tabCategoryContent button[onclick="openEmojiPickerForIcon(this)"]'
      );
      const icon = emojiBtn ? emojiBtn.textContent.trim() : "🛒";

      if (!name) {
        showToast("Category name is required");
        return;
      }

      if (setBudget && (!monthlyBudget || monthlyBudget <= 0)) {
        showToast("Please enter a valid budget amount");
        return;
      }

      try {
        const catRes = await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify({ name, type, icon }),
        });

        showToast("Category added successfully!", "success");

        const budgetMonth = document.getElementById("budgetMonth").value;

        if (setBudget && catRes.categoryId) {
          await apiFetch("/budgets", {
            method: "POST",
            body: JSON.stringify({
              category_id: catRes.categoryId,
              monthly_budget: monthlyBudget,
              budget_month: budgetMonth,
            }),
          });
        }

        categoryForm.reset();
        toggleBudgetField();
        const categoriesData = await apiFetch("/categories");
        categories = categoriesData.categories;
        filterCategoryDropdown();
        loadData();

        if (tabTransaction) tabTransaction.click();
      } catch (err) {
        showToast("Failed: " + err.message);
      }
    });
  }

  // --- Transaction Modal Open ---
  // --- Transaction Modal Open ---
  const openTransactionModal = (transaction = null) => {
    transactionForm.reset();

    const transactionEmojiBtn = document.querySelector(
      '#tabTransactionContent button[onclick="openEmojiPickerForIcon(this)"]'
    );
    const categoryEmojiBtn = document.querySelector(
      '#tabCategoryContent button[onclick="openEmojiPickerForIcon(this)"]'
    );

    // Reset emoji buttons to smile-plus icon
    if (transactionEmojiBtn)
      transactionEmojiBtn.innerHTML = '<i data-lucide="smile-plus"></i>';
    if (categoryEmojiBtn)
      categoryEmojiBtn.innerHTML = '<i data-lucide="smile-plus"></i>';
    lucide.createIcons();

    if (transaction) {
      modalTitle.textContent = "Edit Transaction";

      document.getElementById("transactionId").value = transaction.id;
      document.getElementById("title").value = transaction.title;
      document.getElementById("amount").value = transaction.amount;

      document.querySelector(
        `input[name="type"][value="${transaction.type}"]`
      ).checked = true;
      filterCategoryDropdown(transaction.type);
      document.getElementById("category").value = transaction.category_id || "";
      document.getElementById("date").value = transaction.date;

      const descriptionField = document.getElementById("description");
      if (descriptionField)
        descriptionField.value = transaction.description || "";

      // Set existing icon if available
      if (transactionEmojiBtn && transaction.icon) {
        transactionEmojiBtn.textContent = transaction.icon;
      }

      // === YE SABSE IMP FIX HAI ===
      // Force show Transaction tab and hide Category tab
      tabTransactionContent.classList.remove("hidden");
      tabCategoryContent.classList.add("hidden");

      // Active tab styling
      tabTransaction.classList.add(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabTransaction.classList.remove("text-gray-500", "dark:text-gray-400");
      tabCategory.classList.remove(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabCategory.classList.add("text-gray-500", "dark:text-gray-400");
      // ==============================
    } else {
      modalTitle.textContent = "Add Transaction";
      document.getElementById("transactionId").value = "";
      document.getElementById("date").valueAsDate = new Date();

      document.querySelector(
        'input[name="type"][value="income"]'
      ).checked = true;
      filterCategoryDropdown("income");

      const descriptionField = document.getElementById("description");
      if (descriptionField) descriptionField.value = "";

      // Show both tabs (normal add mode)
      tabTransactionContent.classList.remove("hidden");
      tabCategoryContent.classList.add("hidden"); // default Transaction tab active

      // Default active tab styling
      tabTransaction.classList.add(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabTransaction.classList.remove("text-gray-500", "dark:text-gray-400");
      tabCategory.classList.remove(
        "text-primary",
        "border-b-4",
        "border-primary"
      );
      tabCategory.classList.add("text-gray-500", "dark:text-gray-400");
    }

    openModal();
  };

  // --- Transaction Form Submit ---
  transactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("transactionId").value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const endpoint = type === "income" ? "/income" : "/expenses";
    const method = id ? "PUT" : "POST";
    const url = id ? `${endpoint}/${id}` : endpoint;

    const emojiBtn = document.querySelector(
      '#tabTransactionContent button[onclick="openEmojiPickerForIcon(this)"]'
    );
    const icon = emojiBtn ? emojiBtn.textContent.trim() : "💰";

    const data = {
      name: document.getElementById("title").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      date: document.getElementById("date").value,
      category_id: document.getElementById("category").value,
      description: document.getElementById("description").value.trim(),
      icon: icon,
    };

    try {
      await apiFetch(url, { method, body: JSON.stringify(data) });
      closeModal();
      showToast(
        id
          ? "Transaction updated successfully!"
          : "Transaction added successfully!",
        "success"
      );
      loadData();
    } catch (err) {
      showToast("Failed: " + err.message);
    }
  });

  // --- Emoji Picker Logic ---
  const picker = document.getElementById("emojiPicker");
  let activeIconButton = null;

  window.openEmojiPickerForIcon = function (button) {
    activeIconButton = button;

    const rect = button.getBoundingClientRect();
    picker.style.top = rect.bottom + window.scrollY + 8 + "px";
    picker.style.left = rect.left + window.scrollX - 260 + "px";

    picker.classList.toggle("hidden");
  };

  picker.addEventListener("emoji-click", (event) => {
    if (activeIconButton) {
      activeIconButton.textContent = event.detail.unicode;
    }
    picker.classList.add("hidden");
  });

  document.addEventListener("click", (e) => {
    if (
      !picker.contains(e.target) &&
      e.target.closest("button") !== activeIconButton
    ) {
      picker.classList.add("hidden");
    }
  });

  // --- Delete & Edit ---
  transactionListEl.addEventListener("click", async (e) => {
    if (e.target.closest(".delete-btn")) {
      const row = e.target.closest("tr");
      const uniqueId = row.dataset.id;
      const type = row.dataset.type;
      const title = row.querySelector(".font-semibold").textContent;

      const transaction = transactions.find((t) => t.uniqueId === uniqueId);
      if (!transaction) {
        showToast("Transaction not found!");
        return;
      }

      confirmModalTitle.textContent = "Delete Transaction";
      confirmModalText.textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;

      openConfirmModal();

      const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
      const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
      confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);

      newConfirmBtn.addEventListener(
        "click",
        async () => {
          const endpoint =
            type === "income"
              ? `/income/${transaction.id}`
              : `/expenses/${transaction.id}`;
          try {
            await apiFetch(endpoint, { method: "DELETE" });
            closeConfirmModal();
            showToast("Transaction deleted successfully!", "success");
            loadData();
          } catch (err) {
            showToast("Delete failed: " + err.message);
            closeConfirmModal();
          }
        },
        { once: true }
      );
    }

    if (e.target.closest(".edit-btn")) {
      const row = e.target.closest("tr");
      const uniqueId = row.dataset.id;
      const transaction = transactions.find((t) => t.uniqueId === uniqueId);
      if (transaction) {
        openTransactionModal(transaction);
      } else {
        showToast("Transaction not found for editing");
      }
    }
  });

  // --- Show/Hide Budget Field ---
  const setBudgetCheckbox = document.getElementById("setBudgetCheckbox");
  const budgetField = document.getElementById("budgetField");
  const categoryTypeRadios = document.querySelectorAll(
    'input[name="categoryType"]'
  );

  const toggleBudgetField = () => {
    const isExpense =
      document.querySelector('input[name="categoryType"]:checked').value ===
      "expense";
    const isChecked = setBudgetCheckbox.checked;

    if (isExpense) {
      document.getElementById("budgetOption").classList.remove("hidden");
      if (isChecked) {
        budgetField.classList.remove("hidden");
      } else {
        budgetField.classList.add("hidden");
      }
    } else {
      document.getElementById("budgetOption").classList.add("hidden");
      budgetField.classList.add("hidden");
      setBudgetCheckbox.checked = false;
    }
  };

  toggleBudgetField();

  categoryTypeRadios.forEach((radio) =>
    radio.addEventListener("change", toggleBudgetField)
  );
  setBudgetCheckbox.addEventListener("change", toggleBudgetField);

  const setDefaultBudgetMonth = () => {
    const budgetMonthInput = document.getElementById("budgetMonth");
    if (budgetMonthInput) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      budgetMonthInput.min = `${year}-${month}`;
      budgetMonthInput.value = `${year}-${month}`;
    }
  };

  setDefaultBudgetMonth();

  // --- Event Listeners ---
  if (openModalBtn)
    openModalBtn.addEventListener("click", () => openTransactionModal(null));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (closeModalBtn2) closeModalBtn2.addEventListener("click", closeModal);
  if (transactionModal)
    transactionModal.addEventListener(
      "click",
      (e) => e.target === transactionModal && closeModal()
    );
  if (cancelConfirmBtn)
    cancelConfirmBtn.addEventListener("click", closeConfirmModal);
  if (confirmModal)
    confirmModal.addEventListener(
      "click",
      (e) => e.target === confirmModal && closeConfirmModal()
    );
  if (searchInput) searchInput.addEventListener("input", renderTransactionList);
  if (sortSelect) sortSelect.addEventListener("change", renderTransactionList);

  // --- Start ---
  loadData();
});
