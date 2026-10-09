import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const LOCAL_API_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

type StoreHostResponse = {
  result?: {
    slug?: string;
  };
};

export async function proxy(request: NextRequest) {
  const businessHost = getBusinessHost(
    request.headers.get("host") ?? request.nextUrl.host,
  );

  if (!businessHost.hostName || !API_BASE_URL) {
    return NextResponse.next();
  }

  const storeSlug = await getStoreSlugByHostName(businessHost.hostName);

  if (!storeSlug || request.nextUrl.pathname.startsWith(`/${storeSlug}`)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  if (businessHost.isLocalhost) {
    redirectUrl.hostname = "localhost";
  } else {
    redirectUrl.hostname = "storedel.com";
  }
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
    allowInsecureLocalApiFetch(url);

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

function getBusinessHost(host: string) {
  const hostname = host.split(":")[0] ?? "";
  const localhostSuffix = ".localhost";
  const storeDomainSuffix = ".shop.storedel.com";

  if (hostname.endsWith(localhostSuffix)) {
    return {
      hostName: hostname.slice(0, -localhostSuffix.length),
      isLocalhost: true,
    };
  }

  if (hostname.endsWith(storeDomainSuffix)) {
    return {
      hostName: hostname.slice(0, -storeDomainSuffix.length).split(".")[0] ?? "",
      isLocalhost: false,
    };
  }

  return {
    hostName: "",
    isLocalhost: false,
  };
}

function allowInsecureLocalApiFetch(url: URL) {
  if (
    process.env.NODE_ENV !== "development" ||
    url.protocol !== "https:" ||
    !LOCAL_API_HOST_PATTERN.test(url.hostname) ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  ) {
    return;
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
