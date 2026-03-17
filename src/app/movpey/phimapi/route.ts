import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FETCH_HEADERS, PHIMAPI_BASE } from "@/lib/api";

const ALLOWED_HOST = new URL(PHIMAPI_BASE).host;

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { status: false, msg: "Missing endpoint" },
      { status: 400 }
    );
  }

  // Chỉ cho phép proxy tới phimapi.com để tránh SSRF
  const sanitizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const targetUrl = `${PHIMAPI_BASE}${sanitizedEndpoint}`;
  const targetHost = (() => {
    try {
      return new URL(targetUrl).host;
    } catch {
      return "";
    }
  })();

  if (targetHost !== ALLOWED_HOST) {
    return NextResponse.json(
      { status: false, msg: "Invalid host" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(targetUrl, {
      headers: DEFAULT_FETCH_HEADERS,
      next: { revalidate: 1800 },
    });

    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
      headers: {
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: false, msg: `Proxy error: ${message}` },
      { status: 500 }
    );
  }
}

