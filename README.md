# 🚫 No More Pang

쿠팡보다 더 싸게 살 수 있는 곳을 찾아주는 가격 비교 서비스.

## 기능

- 상품명 검색 → 네이버 쇼핑 최저가 비교
- 쿠팡 가격 입력 시 절약 금액 표시
- (예정) 쿠팡 URL 입력 → 자동 상품명 파싱
- (예정) 다른 플랫폼 추가 (11번가, G마켓 등)

## 시작하기

```bash
npm install
cp .env.local.example .env.local
# .env.local에 네이버 API 키 입력
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

## 환경변수

| 변수 | 설명 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 개발자 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 개발자 Client Secret |

[네이버 개발자 센터](https://developers.naver.com)에서 발급.
