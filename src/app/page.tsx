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

type InputMode = "url" | "text";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coupangPrice, setCoupangPrice] = useState<number | null>(null);
  const [coupangTitle, setCoupangTitle] = useState("");
  const [coupangImage, setCoupangImage] = useState("");
  const [parsing, setParsing] = useState(false);

  const parseCoupangUrl = async () => {
    if (!url.includes("coupang.com")) {
      setError("쿠팡 URL을 입력해주세요");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const res = await fetch(
        `/api/parse-coupang?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "파싱 실패");
        return;
      }

      setCoupangTitle(data.productName);
      setCoupangPrice(data.price);
      setCoupangImage(data.image);
      setQuery(data.productName);

      // Auto-search
      await searchProducts(data.productName);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setParsing(false);
    }
  };

  const searchProducts = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q) {
      setError("검색어를 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
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

  const handleSearch = () => {
    if (mode === "url") {
      parseCoupangUrl();
    } else {
      searchProducts();
    }
  };

  const formatPrice = (price: number) =>
    price.toLocaleString("ko-KR") + "원";

  const savings = (price: number) => {
    if (!coupangPrice) return null;
    const diff = coupangPrice - price;
    if (diff <= 0) return null;
    return diff;
  };

  const savingsPercent = (price: number) => {
    if (!coupangPrice || coupangPrice <= price) return null;
    return Math.round(((coupangPrice - price) / coupangPrice) * 100);
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

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "url"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            🔗 쿠팡 URL
          </button>
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === "text"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            🔍 상품명 검색
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={mode === "url" ? url : query}
            onChange={(e) =>
              mode === "url"
                ? setUrl(e.target.value)
                : setQuery(e.target.value)
            }
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={
              mode === "url"
                ? "쿠팡 상품 URL을 붙여넣으세요"
                : "상품명을 입력하세요 (예: 에어팟 프로 2)"
            }
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
          />
          <button
            onClick={handleSearch}
            disabled={loading || parsing}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition whitespace-nowrap"
          >
            {parsing ? "파싱 중..." : loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {/* Coupang Product Card */}
        {coupangTitle && (
          <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">쿠팡 상품</p>
            <div className="flex gap-4 items-center">
              {coupangImage && (
                <img
                  src={coupangImage}
                  alt={coupangTitle}
                  className="w-16 h-16 object-cover rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">
                  {coupangTitle}
                </h3>
                {coupangPrice && (
                  <p className="text-gray-400 mt-1">
                    쿠팡 가격:{" "}
                    <span className="text-white font-semibold">
                      {formatPrice(coupangPrice)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual price input for text mode */}
        {mode === "text" && (
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              쿠팡 가격 (선택 — 입력하면 절약 금액 표시)
            </label>
            <input
              type="number"
              value={coupangPrice ?? ""}
              onChange={(e) =>
                setCoupangPrice(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="쿠팡에서의 가격 (원)"
              className="w-64 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
        )}

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
              🛒 다른 곳에서 찾은 가격 ({results.length}개)
            </h2>
            <div className="grid gap-3">
              {results.map((item, i) => {
                const saved = savings(item.price);
                const pct = savingsPercent(item.price);
                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition group"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-red-400 transition">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.mallName}
                        {item.brand && ` · ${item.brand}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col justify-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {formatPrice(item.price)}
                      </p>
                      {saved && pct && (
                        <p className="text-sm text-red-400 mt-1 font-medium">
                          🔥 {formatPrice(saved)} ({pct}%) 절약
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

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-gray-600 text-sm">
        No More Pang — 더 현명한 소비를 위해
      </footer>
    </div>
  );
}
