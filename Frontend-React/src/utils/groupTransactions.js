export function groupTransactions(transactions) {
  const grouped = new Map();

  transactions.forEach((transaction) => {
    const key = transaction.order_number;
    if (!grouped.has(key)) {
      grouped.set(key, {
        orderNumber: key,
        items: [],
        totalAmount: 0,
        quantity: 0,
      });
    }

    const order = grouped.get(key);
    order.items.push(transaction);
    order.totalAmount += Number(transaction.total_amount);
    order.quantity += Number(transaction.quantity);
  });

  return Array.from(grouped.values());
}
