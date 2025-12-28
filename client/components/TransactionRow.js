export const createTransactionRow = (transaction) => {
  const row = document.createElement("tr");
  row.className = "hover:bg-gray-50";
  row.dataset.id = transaction.id;
  row.dataset.type = transaction.type;

  const amountColor =
    transaction.type === "income" ? "text-green-600" : "text-red-600";
  const amountSign = transaction.type === "income" ? "+" : "-";

  row.innerHTML = `
    <td class="px-6 py-4"><div class="font-semibold">${transaction.title}</div>
      <div class="text-xs text-gray-500">${
        transaction.category_name || "Uncategorized"
      }</div></td>
    <td class="px-6 py-4 text-sm text-gray-500">${new Date(
      transaction.date
    ).toLocaleDateString()}</td>
    <td class="px-6 py-4 text-right ${amountColor} font-medium">${amountSign} ₹${transaction.amount.toFixed(
    2
  )}</td>
    <td class="px-6 py-4 text-center">
      <button class="edit-btn text-indigo-600 mr-3"><i data-lucide="edit"></i></button>
      <button class="delete-btn text-red-600"><i data-lucide="trash-2"></i></button>
    </td>
  `;
  return row;
};
