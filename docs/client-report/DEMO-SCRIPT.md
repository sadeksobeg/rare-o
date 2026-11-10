# Demo script — Core Storefront (Section 02)

Base: `http://localhost:3000` (Arabic default). English: prefix `/en`.

1. Open `/catalog` — see published pieces and category chips (2.1).  
2. Tap **آلات موسيقية وترية** / open `/catalog?type=string-instruments` — count drops to string instruments only (2.3).  
3. Set min `2000` and max `4000`, sort price ascending — URL becomes `?type=string-instruments&min=2000&max=4000&sort=price-asc` (2.3).  
4. Search `عود` or open `/catalog?q=oud` (EN) — matching pieces only (2.3).  
5. Open `/product/oud-classic-21` — gallery, specs table, price, Add to request list (2.2).  
6. Open `/product/cello-studio` — unavailable state (no add CTA) (2.2 / 2.4).  
7. From Classic oud, add to list → header badge increments → `/cart` — change qty, remove (2.4).  
8. Continue to `/request` — fill name, phone, country, notes (2.5).  
9. Submit — success screen with reference + Open WhatsApp (2.5). Confirm row in `/admin` requests (login required).  
10. Resize or switch device: `/catalog` at phone / tablet / desktop; toggle العربية / English (2.6).
