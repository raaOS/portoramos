/**
 * Global SVG filter untuk Liquid Glass effect.
 *
 * Dipasang sekali di root layout. Komponen yang butuh efek liquid glass
 * (mis. Dock) cukup `filter: url(#liquid-glass-distortion)` tanpa perlu
 * inject SVG sendiri.
 *
 * Kenapa di root, bukan di komponen yang pakai?
 * - SVG filter dengan `id` global harus reachable dari elemen yang
 *   reference dia. Kalau filter di-inline di komponen yang dirender
 *   conditional (mis. GlobalDock yang return null di route OS), filter
 *   ikut hilang dan elemen di route lain kehilangan reference.
 * - View Transitions API mengambil snapshot DOM saat navigasi. Filter
 *   yang berada di dalam komponen yang re-mount lintas route bisa
 *   "putus" sebentar saat transition.
 * - Single instance hindari id collision saat dock dirender di banyak
 *   tempat (mis. hot reload double-render).
 *
 * Adapted from lucasromerodb/liquid-glass-effect-macos:
 *   feTurbulence (noise) → feComponentTransfer (channel warp) →
 *   feGaussianBlur (smooth) → feSpecularLighting (highlight) →
 *   feDisplacementMap (refraction).
 */
export default function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <defs>
        <filter
          id="liquid-glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves={1}
            seed={5}
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="150"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
