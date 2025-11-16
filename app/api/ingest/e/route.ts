import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  try {
    const body = await request.text();
    const url = new URL(request.url);

    const response = await fetch(`${host}/e/${url.search}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    // Handle 204 No Content specially
    if (response.status === 204) {
      return new NextResponse(null, { status: 200 });
    }

    const data = await response.text();
    return new NextResponse(data, { status: response.status });
  } catch (error) {
    console.error("PostHog proxy error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  const url = new URL(request.url);

  try {
    const response = await fetch(`${host}/e/${url.search}`, {
      method: "GET",
    });

    const data = await response.text();
    return new NextResponse(data, { status: response.status });
  } catch (error) {
    console.error("PostHog proxy error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
