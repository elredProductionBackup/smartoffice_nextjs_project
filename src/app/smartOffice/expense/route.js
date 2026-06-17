import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "_data", "expenses.json");

function readExpenses() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading expenses file:", err);
    return [];
  }
}

function writeExpenses(expenses) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(expenses, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing expenses file:", err);
  }
}

/**
 * GET /smartOffice/expense
 * Query params:
 *   start         - 0-based offset for pagination (default: 0)
 *   offset        - number of records per page (default: 10)
 *   type          - "all" | "event" | "general"
 *   eventId       - filter by event name or ID
 *   approvedStatus - "pending" | "approved"
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get("start")) || 0;
    const offset = parseInt(searchParams.get("offset")) || 10;
    const type = searchParams.get("type") || "all";
    const eventId = searchParams.get("eventId") || "";
    const approvedStatus = searchParams.get("approvedStatus") || "";

    let expenses = readExpenses();

    // 1. Filter by type
    if (type && type !== "all") {
      if (type === "event") {
        expenses = expenses.filter((e) => e.type === "Event Related");
      } else if (type === "general") {
        expenses = expenses.filter((e) => e.type === "General");
      }
    }

    // 2. Filter by eventId (match against event name or id)
    if (eventId) {
      expenses = expenses.filter(
        (e) =>
          String(e.event).toLowerCase().trim() === String(eventId).toLowerCase().trim() ||
          String(e.eventId).toLowerCase().trim() === String(eventId).toLowerCase().trim()
      );
    }

    // 3. Filter by approvedStatus
    if (approvedStatus) {
      if (approvedStatus === "pending") {
        expenses = expenses.filter((e) => e.status === "Pending Approval");
      } else if (approvedStatus === "approved") {
        expenses = expenses.filter((e) => e.status === "Approved");
      }
    }

    const totalCount = expenses.length;

    // 4. Calculate stats on ALL (unfiltered) expenses for the summary cards
    const allExpenses = readExpenses();
    const stats = {
      totalExpenses: allExpenses.length,
      pendingCount: allExpenses.filter((e) => e.status === "Pending Approval").length,
      totalAmount: allExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0),
    };

    // 5. Paginate
    const paginatedExpenses = expenses.slice(start, start + offset);

    return NextResponse.json({
      expenses: paginatedExpenses,
      totalCount,
      stats,
    });
  } catch (err) {
    console.error("GET /smartOffice/expense failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /smartOffice/expense
 * Body: expense object
 * Prepends the new expense to the JSON file.
 */
export async function POST(req) {
  try {
    const expense = await req.json();
    if (!expense) {
      return NextResponse.json({ error: "Expense data required" }, { status: 400 });
    }
    const expenses = readExpenses();
    const newExpense = {
      ...expense,
      id: expense.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    expenses.unshift(newExpense);
    writeExpenses(expenses);
    return NextResponse.json(newExpense, { status: 201 });
  } catch (err) {
    console.error("POST /smartOffice/expense failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /smartOffice/expense
 * Body: { id, ...fieldsToUpdate }
 * Updates an existing expense record in the JSON file.
 */
export async function PATCH(req) {
  try {
    const { id, ...updatedFields } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }
    const expenses = readExpenses();
    const index = expenses.findIndex((e) => String(e.id) === String(id));
    if (index === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    expenses[index] = { ...expenses[index], ...updatedFields };
    writeExpenses(expenses);
    return NextResponse.json(expenses[index], { status: 200 });
  } catch (err) {
    console.error("PATCH /smartOffice/expense failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /smartOffice/expense
 * Body: { budgetExpenseId: string }
 * Removes the expense with the matching ID from the JSON file.
 */
export async function DELETE(req) {
  try {
    const body = await req.json();
    const budgetExpenseId = body?.budgetExpenseId;

    if (!budgetExpenseId) {
      return NextResponse.json({ error: "budgetExpenseId is required" }, { status: 400 });
    }

    const expenses = readExpenses();
    const index = expenses.findIndex((e) => String(e.id) === String(budgetExpenseId));

    if (index === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    expenses.splice(index, 1);
    writeExpenses(expenses);

    return NextResponse.json({ success: true, deletedId: budgetExpenseId }, { status: 200 });
  } catch (err) {
    console.error("DELETE /smartOffice/expense failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
