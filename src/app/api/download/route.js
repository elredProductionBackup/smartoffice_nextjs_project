import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
    }

    // Fetch the file from the original URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const filename = fileUrl.split("/").pop();

    // Return a response with headers to force download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
