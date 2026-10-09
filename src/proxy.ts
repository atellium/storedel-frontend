import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

type StoreHostResponse = {
  result?: {
    slug?: string;
  };
};

export async function proxy(request: NextRequest) {
  const hostName = getStoreHostName(
    request.headers.get("host") ?? request.nextUrl.host,
  );

  if (!hostName || !API_BASE_URL) {
    return NextResponse.next();
  }

  const storeSlug = await getStoreSlugByHostName(hostName);

  if (!storeSlug || request.nextUrl.pathname.startsWith(`/${storeSlug}`)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.hostname = "storedel.com";
  redirectUrl.pathname =
    request.nextUrl.pathname === "/"
      ? `/${storeSlug}`
      : `/${storeSlug}${request.nextUrl.pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|sw.js|firebase-messaging-sw.js).*)"],
};

async function getStoreSlugByHostName(hostName: string) {
  try {
    const url = new URL(`/api/stores/${hostName}/`, API_BASE_URL);

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) return "";

    const data = (await response.json()) as StoreHostResponse;
    return data.result?.slug ?? "";
  } catch {
    return "";
  }
}

function getStoreHostName(host: string) {
  const hostname = host.split(":")[0] ?? "";
  const storeDomainSuffix = ".shop.storedel.com";

  if (hostname.endsWith(storeDomainSuffix)) {
    return hostname.slice(0, -storeDomainSuffix.length).split(".")[0] ?? "";
  }

  return "";
}
