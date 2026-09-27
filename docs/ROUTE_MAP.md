# Route Map — CodeIgniter 4 → Next.js

Phase tags: **P0** foundation · **P1** auth · **P2** marketplace · **P3** cart/checkout/payments · **P4** chat/notifications · **P5** artisan portal · **P6** admin

## Public / Marketplace
| Legacy (CI4) | Next.js | Phase |
|---|---|---|
| `GET /` → MarketplaceController::index | `/` | P2 |
| `GET /marketplace` | `/customer/browse` | P2 |
| `GET /marketplace/product/(:num)` | `/customer/browse/[id]` | P2 |
| `GET /artisans` | `/artisans` | P2 |
| `GET /artisan/view/(:num)` | `/artisans/[id]` | P2 |
| `GET /verify/(:any)` (NFC) | `/verify/[tagId]` | P2 |

## Auth
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /auth/login` | `/auth/login` | P1 |
| `POST /auth/processLogin` | `POST /api/auth/login` | P1 |
| `GET /auth/logout` | `POST /api/auth/logout` | P1 |
| `GET /auth/register` | `/auth/register` | P1 |
| `POST /auth/registerCustomer` | `POST /api/auth/register-customer` | P1 |
| `POST /auth/verifyOTP` | `POST /api/auth/verify-otp` | P1 |
| `POST /auth/resendOTP` | `POST /api/auth/register-customer` (idempotent resend) | P1 |
| `POST /auth/registerArtisan` | `POST /api/auth/register-artisan` | P1 |
| `POST /auth/processIdCapture` (OCR) | `POST /api/auth/register-artisan` (OCR when `OCR_API_KEY` set) | P1 |
| `POST /auth/verifyFace` | face-api `POST /verify` (when `FACE_API_URL` set) | P1 |
| `POST /auth/checkFaceDuplicate` | face-api `POST /check-duplicate` | P1 |

## Customer
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /customer/dashboard` | `/customer/dashboard` | P1 |
| `GET /customer/orders` | `/customer/orders` | P3 |
| `GET /customer/profile/edit` + update | *(deferred — profile editing ships with the next iteration)* | P5 |
| `POST /customer/order/receive/(:num)` | `POST /api/orders/item/[id]/receive` | P3 |
| `POST /customer/report` | *(deferred — reports module lands with admin moderation phase 2)* | P6 |
| `POST /customer/notifications/read` | `POST /api/notifications/read` | P4 |

## Cart / Checkout / Orders / Payments
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /cart` | `/cart` | P3 |
| `POST /cart/add/(:num)` | `POST /api/cart` | P3 |
| `POST /cart/update/(:num)` | `PATCH /api/cart/[id]` | P3 |
| `POST /cart/remove/(:num)` | `DELETE /api/cart/[id]` | P3 |
| `GET|POST /checkout` | `/checkout` + `POST /api/checkout` | P3 |
| `GET /order/success/(:num)` | `/order/success/[orderId]` | P3 |
| `GET /order/payment/(:num)` + submit | `/payment/gcash/[orderId]` + `POST /api/payment/gcash/[orderId]` | P3 |
| `GET /test-payment/*` (mock GCash) | `/payment/gcash/[orderId]` (PAYMENTS_MODE=mock) | P3 |
| `GET /api/order/status/(:num)` | included in order pages / polling | P3 |

## Chat
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /chat/product/(:num)` | `/customer/messages?c=` (auto-opens via `POST /api/chat/open`) | P4 |
| `POST /chat/conversations/open/(:num)` | `POST /api/chat/open` | P4 |
| `GET /chat/conversations/(:num)/messages` | `GET /api/chat/[conversationId]/messages` | P4 |
| `POST /chat/conversations/(:num)/messages` | `POST /api/chat/[conversationId]/messages` | P4 |
| `GET /customer/messages` | `/customer/messages` | P4 |
| `GET /artisan/messages` | `/artisan/messages` | P4 |

## Artisan portal
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /artisan/dashboard` | `/artisan/dashboard` | P5 |
| `GET /artisan/products` | `/artisan/products` | P5 |
| `GET+POST /artisan/products/add|store` | `/artisan/products/new` + `POST /api/artisan/products` | P5 |
| `GET+POST /artisan/products/edit|update/(:num)` | `/artisan/products/[id]/edit` + `PUT /api/artisan/products/[id]` | P5 |
| `POST /artisan/products/toggle/(:num)` | `POST /api/artisan/products/[id]/toggle` | P5 |
| `GET+POST nfc-setup|register-nfc` | `/artisan/products/[id]/nfc` + `POST /api/artisan/products/[id]/nfc` | P5 |
| `GET /artisan/orders` + `POST update` | `/artisan/orders` + `POST /api/artisan/orders/[id]/status` | P5 |
| `GET /artisan/notifications` + read | `/artisan/notifications` + `POST /api/notifications/read` | P4 |
| `GET artisan/products|experiences|categories|bookings|reviews|calendar|tutorial-attendees` | *(deferred — experiences/bookings/reviews ship in the portal phase 2)* | P5b |

## Admin
| Legacy | Next.js | Phase |
|---|---|---|
| `GET /admin/dashboard` | `/admin/dashboard` | P6 |
| `GET admin/artisans(+/pending)` + updateStatus | `/admin/artisans` + `POST /api/admin/artisan-status` | P6 |
| `GET /admin/products` + toggle/delete | `/admin/products` | P6 |
| `GET /admin/orders` + status/dispute | `/admin/orders` | P6 |
| `GET /admin/payments` + verify | `/admin/payments` + `POST /api/admin/payment-status` | P6 |
| `GET /admin/activity-logs` | `/admin/activity` | P6 |
| `GET admin/customers|experiences|bookings|reports|categories|homepage|reviews|nfc|analytics|announcements|settings|profile` | *(deferred — remaining admin sections queued in phase 6b)* | P6b |

## Data layer endpoints (new, internal)
- `POST /api/cart`, `GET /api/cart`, `PATCH|DELETE /api/cart/[id]`
- `POST /api/checkout`, `POST /api/payment/gcash/[orderId]`
- `GET|POST /api/chat/[conversationId]/messages`, `POST /api/chat/open`
- `POST /api/notifications/read`, `POST /api/orders/item/[id]/receive`
- `POST /api/artisan/products`, `PUT /api/artisan/products/[id]`, `POST /api/artisan/products/[id]/toggle`, `POST /api/artisan/products/[id]/nfc`, `POST /api/artisan/orders/[id]/status`
- `POST /api/admin/artisan-status`, `POST /api/admin/payment-status`
