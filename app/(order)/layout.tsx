// Same shell as the storefront, but without its loading.tsx: a Suspense fallback would flush
// HTTP 200 before notFound() runs, so unknown order links must live outside that group.
export { default } from "../(storefront)/layout";
