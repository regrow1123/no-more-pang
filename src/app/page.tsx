"use client";

import { useState } from "react";

interface SearchResult {
  title: string;
  link: string;
  image: string;
  price: number;
  mallName: string;
  brand: string;
  category: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coupangPrice, setCoupangPrice] = useState<number | null>(null);
  const [coupangTitle, setCoupangTitle] = useState("");

  const handleSearch = async () => {
    const searchQuery = query || extractQueryFromUrl(url);
    if (!searchQuery) {
      setError("쿠팡 URL 또는 검색어를 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "검색 중 오류가 발생했습니다");
        return;
      }

      setResults(data.results);
      if (data.results.length === 0) {
        setError("검색 결과가 없습니다");
      }
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const extractQueryFromUrl = (inputUrl: string): string => {
    // TODO: 쿠팡 URL에서 상품명 파싱 (크롤링 필요)
    // 지금은 빈 문자열 반환
    return "";
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("ko-KR") + "원";

  const savings = (price: number) => {
    if (!coupangPrice) return null;
    const diff = coupangPrice - price;
    if (diff <= 0) return null;
    return diff;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">
          🚫 No More <span className="text-red-500">Pang</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          쿠팡보다 더 싸게 살 수 있는 곳을 찾아드립니다
        </p>
      </header>

      {/* Search */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              쿠팡 상품 URL 또는 상품명
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="상품명을 입력하세요 (예: 에어팟 프로 2)"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition"
              >
                {loading ? "검색 중..." : "검색"}
              </button>
            </div>
          </div>

          {/* Coupang price input (optional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              쿠팡 가격 (선택 — 입력하면 절약 금액 표시)
            </label>
            <input
              type="number"
              value={coupangPrice ?? ""}
              onChange={(e) =>
                setCoupangPrice(e.target.value ? Number(e.target.value) : null)
              }
              placeholder="쿠팡에서의 가격 (원)"
              className="w-64 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
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
            <h2 className="text-lg font-semibold text-gray-300">
              검색 결과 ({results.length}개)
            </h2>
            <div className="grid gap-4">
              {results.map((item, i) => {
                const saved = savings(item.price);
                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.mallName}
                        {item.brand && ` · ${item.brand}`}
                      </p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-emerald-400">
                        {formatPrice(item.price)}
                      </p>
                      {saved && (
                        <p className="text-sm text-red-400 mt-1">
                          🔥 {formatPrice(saved)} 절약!
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
