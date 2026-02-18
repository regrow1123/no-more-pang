import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  if (!query) {
    return NextResponse.json({ error: "query parameter is required" }, { status: 400 });
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Naver API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Build query params
    const params = new URLSearchParams({
      query,
      display: "40",
      sort: "sim", // similarity first for accurate matching
    });

    // Naver API supports price filtering via exclude parameter
    // But we'll filter client-side for more control

    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?${params.toString()}`,
      {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Naver API error", status: res.status },
        { status: res.statusText === "Unauthorized" ? 401 : 502 }
      );
    }

    const data: NaverSearchResponse = await res.json();

    let results = data.items.map((item) => ({
      title: item.title.replace(/<[^>]*>/g, ""),
      link: item.link,
      image: item.image,
      price: Number(item.lprice),
      mallName: item.mallName,
      brand: item.brand,
      maker: item.maker,
      category: [item.category1, item.category2, item.category3, item.category4]
        .filter(Boolean)
        .join(" > "),
      productType: item.productType,
    }));

    // Exclude Coupang results (that's the whole point!)
    const COUPANG_PATTERNS = ["coupang.com", "쿠팡"];
    results = results.filter(
      (r) =>
        !COUPANG_PATTERNS.some(
          (p) => r.link.includes(p) || r.mallName.includes(p)
        )
    );

    // Server-side price filtering
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    if (min !== null) {
      results = results.filter((r) => r.price >= min);
    }
    if (max !== null) {
      results = results.filter((r) => r.price <= max);
    }

    // Separate catalog products (productType=1) from individual sellers
    // Catalog = Naver has verified these are the same product across sellers
    const catalog = results.filter((r) => r.productType === "1");
    const individual = results.filter((r) => r.productType !== "1");

    // Sort each group by price
    catalog.sort((a, b) => a.price - b.price);
    individual.sort((a, b) => a.price - b.price);

    // Catalog first (more reliable "same product" matching), then individual
    const sorted = [...catalog, ...individual];

    return NextResponse.json({
      total: data.total,
      catalogCount: catalog.length,
      results: sorted,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
