import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  try {
    const body = await request.text();
    const url = new URL(request.url);
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join("/") : "";

    const response = await fetch(`${host}/${path}${url.search}`, {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  try {
    const url = new URL(request.url);
    const resolvedParams = await params;
    const path = resolvedParams.path ? resolvedParams.path.join("/") : "";

    const response = await fetch(`${host}/${path}${url.search}`, {
      method: "GET",
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/plain",
      }
    });
  } catch (error) {
    console.error("PostHog proxy error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
