# ICON MAP — V2

Stroke 1.5. Sizes 16 / 20 / 24. Colour from `currentColor` only. Temporary brand and instrument files are marked `temporary: designer replaces` — keep filenames stable for a swap.

Decorative glyphs: `aria-hidden`. Icon-only controls: `aria-label` from the dictionary. Directional arrows use `rtl:-scale-x-100` / `rtl:rotate-180`.

Production pages named-import specific icon modules. Do not barrel-import `components/brand/icons` on live routes.

## Navigation

| Surface | Item | Icon | Source |
|---|---|---|---|
| Admin sidebar / mobile | Dashboard | `LayoutDashboard` | lucide |
| Admin | Inbox | `MessageSquare` | lucide |
| Admin | Requests | `ShoppingBag` | lucide |
| Admin | Deals | `Handshake` | lucide |
| Admin | Wholesale | `Package` | lucide |
| Admin | Products | `Boxes` | lucide |
| Admin | Categories | `Tags` | lucide |
| Admin | Offers / Promos | `Percent` | lucide |
| Admin | Customers | `Users` | lucide |
| Admin | Traders | `Store` | lucide |
| Admin / Trader header | Locale | `Languages` + dictionary label | lucide |
| Admin / Trader header | Logout | `LogOut` | lucide |
| Trader tabs | Home | `Home` | lucide |
| Trader tabs | Deals | `Handshake` | lucide |
| Trader tabs | Wholesale | `Package` | lucide |
| Trader tabs | Offers | `Sparkles` | lucide |
| Trader tabs | Profile | `UserRound` | lucide |
| Trader | Notifications | `Bell` | lucide |
| Pagination / back | Previous / Next | `ChevronLeft` / `ChevronRight` | lucide, RTL-flipped |

## KPIs

| Tile | Icon | Source |
|---|---|---|
| Retail awaiting | `ShoppingBag` | lucide |
| Deals awaiting | `Handshake` | lucide |
| Wholesale awaiting | `Package` | lucide |
| Unread conversations | `MessageSquare` | lucide |

## Status chips (tone default)

| Tone | Icon | Source |
|---|---|---|
| info | `Info` | lucide |
| progress | `Clock` | lucide |
| attention | `TriangleAlert` | lucide |
| success | `CircleCheck` | lucide |
| danger | `CircleX` | lucide |
| closed | `Minus` | lucide |
| neutral | `Circle` | lucide |

## Empty / error / category

| Use | File | Size |
|---|---|---|
| Empty states | `components/brand/icons/empty-rings.tsx` | 120 |
| 404 / error | `components/brand/icons/error-grain.tsx` | 160 |
| Category cards | `components/brand/icons/category-plate.tsx` | 96 |

## Brand glyphs (temporary)

| Name | File | Arabic |
|---|---|---|
| Rosette | `rosette.tsx` | الوردة |
| Grain | `grain.tsx` | التشطيب / الحبوب |
| Peg | `peg.tsx` | الملاوي |
| String | `string.tsx` | الوتر |
| Wood | `wood.tsx` | ظهر / ضلوع |
| Handcrafted | `handcrafted.tsx` | الرقبة القياسية / اليدوي |
| Echo | `echo.tsx` | الصدى |

## Oud product specs

Shared interactive mark: `components/catalog/oud-spec-icon.tsx` (`OudSpecIconMark` + `AnimatedIcon` draw-in / hover pulse). Used on admin product form and storefront product detail.

| Spec key | Icon file |
|---|---|
| back | `wood.tsx` |
| face | `oud-face.tsx` |
| pegs | `peg.tsx` |
| fingerboard | `oud-fingerboard.tsx` |
| bridge | `oud-bridge.tsx` |
| faceWidth | `oud-span.tsx` → `OudSpanWidthIcon` |
| faceDepth | `oud-span.tsx` → `OudDepthIcon` |
| faceLength | `oud-span.tsx` → `OudSpanLengthIcon` |
| neckLength | `oud-span.tsx` → `OudNeckIcon` |
| stringLength | `string.tsx` |
| standardNeck | `handcrafted.tsx` |
| finish | `grain.tsx` |

## Instrument set (temporary)

`oud` · `qanun` · `violin` · `cello` · `case` · `strap` · `pick` · `tuner` · `strings`

## Motion

`AnimatedIcon` (`components/motion/animated-icon.tsx`): stroke draw-in on enter, scale pulse on `pulseKey` change, Lite shows the glyph complete.

Gallery: `/dev/ui#icons` (dev only).
