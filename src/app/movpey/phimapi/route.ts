import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FETCH_HEADERS } from "@/lib/api";

// OPhim API whitelist for CORS proxy
const ALLOWED_HOSTS = [
  "ophim1.com",
  "ophim17.cc",
  "ophim18.cc",
  "img.ophim.live",
];

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { status: false, msg: "Missing endpoint" },
      { status: 400 }
    );
  }

  // Validate endpoint is a proper URL
  let targetUrl: string;
  try {
    // If endpoint is a full URL, use it directly
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      targetUrl = endpoint;
    } else {
      // Otherwise, assume it's for OPhim (add protocol)
      targetUrl = endpoint.startsWith("//") ? `https:${endpoint}` : endpoint;
    }
    
    const urlObj = new URL(targetUrl);
    
    // Validate host is in whitelist
    const isAllowed = ALLOWED_HOSTS.some(host => 
      urlObj.hostname.includes(host) || urlObj.hostname === host
    );
    
    if (!isAllowed) {
      return NextResponse.json(
        { status: false, msg: "Invalid host: not in whitelist" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: false, msg: "Invalid endpoint URL" },
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

