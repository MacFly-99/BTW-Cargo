export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* OMBRE DU CONTENEUR */}
      <rect x="22" y="42" width="56" height="36" rx="3" fill="#1e3a8a" />
      
      {/* FACE AVANT DU CONTENEUR (Bleu) */}
      <path d="M25 40H75V75C75 76.6569 73.6569 78 72 78H28C26.3431 78 25 76.6569 25 75V40Z" fill="#2563eb" />
      
      {/* LIGNES DU CONTENEUR */}
      <path d="M35 40V78M45 40V78M55 40V78M65 40V78" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      
      {/* COUVERCLE / PERSPECTIVE DU CONTENEUR */}
      <path d="M25 40L35 32H85L75 40H25Z" fill="#60a5fa" />
      <path d="M75 40V78L85 70V32" fill="#1d4ed8" />
      
      {/* LA VAGUE (Vraie courbe fluide avec effet de houle) */}
      <path 
        d="M8 86 C 20 86, 25 78, 40 78 C 55 78, 60 90, 75 90 C 85 90, 92 86, 95 85" 
        stroke="#10b981" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* FLÈCHE STYLISÉE */}
      <path 
        d="M50 10L62 22H56V30C56 31.1046 55.1046 32 54 32H46C44.8954 32 44 31.1046 44 30V22H38L50 10Z" 
        fill="#10b981" 
      />
    </svg>
  )
}