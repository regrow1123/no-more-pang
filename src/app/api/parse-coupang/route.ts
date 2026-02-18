import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  // Validate it's a coupang URL
  if (!url.includes("coupang.com")) {
    return NextResponse.json({ error: "쿠팡 URL만 지원합니다" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "쿠팡 페이지를 불러올 수 없습니다" },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Extract product name from meta tag or title
    const ogTitleMatch = html.match(
      /<meta\s+property="og:title"\s+content="([^"]+)"/
    );
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const productName =
      ogTitleMatch?.[1] || titleMatch?.[1]?.replace(" | 쿠팡", "").trim() || "";

    // Extract price - try multiple patterns
    const pricePatterns = [
      /<span\s+class="total-price"[^>]*>\s*<strong>([0-9,]+)<\/strong>/,
      /<meta\s+property="product:price:amount"\s+content="([^"]+)"/,
      /class="prod-sale-price"[^>]*>.*?([0-9,]+)원/s,
      /"salePrice"\s*:\s*([0-9]+)/,
    ];

    let price: number | null = null;
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = Number(match[1].replace(/,/g, ""));
        if (price > 0) break;
      }
    }

    // Extract image
    const ogImageMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/
    );
    const image = ogImageMatch?.[1] || "";

    if (!productName) {
      return NextResponse.json(
        { error: "상품 정보를 파싱할 수 없습니다. URL을 확인해주세요." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      productName,
      price,
      image,
      url,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "상품 정보를 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
