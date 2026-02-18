"use client";

import { useState } from "react";

interface SearchResult {
  title: string;
  link: string;
  image: string;
  price: number;
  mallName: string;
  brand: string;
  maker: string;
  category: string;
  productType: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [coupangPrice, setCoupangPrice] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const coupangPriceNum = coupangPrice ? Number(coupangPrice) : null;

  const searchProducts = async () => {
    if (!query.trim()) {
      setError("상품명을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      // Build search URL with price range if coupang price provided
      const params = new URLSearchParams({ query: query.trim() });

      if (coupangPriceNum) {
        // Filter: 30% below ~ 20% above coupang price
        const minPrice = Math.floor(coupangPriceNum * 0.3);
        const maxPrice = Math.floor(coupangPriceNum * 1.2);
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "검색 중 오류가 발생했습니다");
        return;
      }

      setResults(data.results);
      if (data.results.length === 0) {
        setError("검색 결과가 없습니다. 상품명을 더 구체적으로 입력해보세요.");
      }
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("ko-KR") + "원";

  const savings = (price: number) => {
    if (!coupangPriceNum || coupangPriceNum <= price) return null;
    return coupangPriceNum - price;
  };

  const savingsPercent = (price: number) => {
    if (!coupangPriceNum || coupangPriceNum <= price) return null;
    return Math.round(((coupangPriceNum - price) / coupangPriceNum) * 100);
  };

  const cheaperCount = results.filter(
    (r) => coupangPriceNum && r.price < coupangPriceNum
  ).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-5">
        <h1 className="text-3xl font-bold tracking-tight">
          🚫 No More <span className="text-red-500">Pang</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          쿠팡에서 본 그 상품, 다른 데서 더 싸게 사세요
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Search Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              상품명
            </label>
            <p className="text-xs text-gray-500 mb-2">
              💡 모델명이나 브랜드를 포함하면 더 정확해요 (예: &quot;삼성 갤럭시 버즈3 프로&quot; &gt; &quot;무선 이어폰&quot;)
            </p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchProducts()}
              placeholder="쿠팡에서 본 상품명을 그대로 붙여넣으세요"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              쿠팡 가격
            </label>
            <p className="text-xs text-gray-500 mb-2">
              입력하면 비슷한 가격대만 필터링하고, 절약 금액을 계산해줘요
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={coupangPrice}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setCoupangPrice(v);
              }}
              placeholder="쿠팡에서의 가격 (원)"
              className="w-72 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
            {coupangPriceNum && (
              <span className="ml-3 text-gray-400 text-sm">
                {formatPrice(coupangPriceNum)}
              </span>
            )}
          </div>

          <button
            onClick={searchProducts}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 py-3 rounded-lg font-medium transition text-lg"
          >
            {loading ? "검색 중..." : "🔍 더 싼 곳 찾기"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 text-red-400 bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-300">
                검색 결과 ({results.length}개)
              </h2>
              {coupangPriceNum && cheaperCount > 0 && (
                <span className="text-sm text-emerald-400 font-medium">
                  ✅ {cheaperCount}개가 쿠팡보다 저렴!
                </span>
              )}
            </div>

            <div className="grid gap-3">
              {results.map((item, i) => {
                const saved = savings(item.price);
                const pct = savingsPercent(item.price);
                const isCheaper =
                  coupangPriceNum && item.price < coupangPriceNum;
                const isMoreExpensive =
                  coupangPriceNum && item.price >= coupangPriceNum;

                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex gap-4 bg-gray-900 border rounded-lg p-4 transition group ${
                      isCheaper
                        ? "border-emerald-800 hover:border-emerald-600"
                        : isMoreExpensive
                        ? "border-gray-800 opacity-50 hover:opacity-70"
                        : "border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-gray-800"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-red-400 transition">
                        {item.title}
                      </h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {item.productType === "1" && (
                          <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded">
                            ✓ 동일상품
                          </span>
                        )}
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                          {item.mallName}
                        </span>
                        {item.brand && (
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                            {item.brand}
                          </span>
                        )}
                        {item.maker && item.maker !== item.brand && (
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                            {item.maker}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col justify-center">
                      <p
                        className={`text-lg font-bold ${
                          isCheaper ? "text-emerald-400" : "text-gray-300"
                        }`}
                      >
                        {formatPrice(item.price)}
                      </p>
                      {saved && pct ? (
                        <p className="text-sm text-red-400 mt-1 font-medium">
                          🔥 {formatPrice(saved)} ({pct}%) 절약
                        </p>
                      ) : isMoreExpensive ? (
                        <p className="text-xs text-gray-500 mt-1">
                          쿠팡이 더 저렴
                        </p>
                      ) : null}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-gray-600 text-sm">
        No More Pang — 더 현명한 소비를 위해
      </footer>
    </div>
  );
}
