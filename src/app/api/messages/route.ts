import { NextResponse } from "next/server";
import pool from "@/lib/services/db";

export async function POST(req: Request) {
  try {
    const { sender, receiver, text, chatId } = await req.json();

    const query = `
      INSERT INTO messages (sender, receiver, text, chatId, createdAt)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await pool.execute(query, [sender, receiver, text, chatId]);

    return NextResponse.json({ success: true, message: "Message saved!" });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const query = `SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC`;
    const [messages] = await pool.execute(query, [chatId]);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
