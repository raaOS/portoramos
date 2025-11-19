interface SkillIconProps {
  type: string;
  className?: string;
}

export default function SkillIcon({ type, className = "w-8 h-8" }: SkillIconProps) {
  const iconMap: Record<string, JSX.Element> = {
    // Adobe Products
    photoshop: (
      <div className={`${className} bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Ps
      </div>
    ),
    illustrator: (
      <div className={`${className} bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Ai
      </div>
    ),
    indesign: (
      <div className={`${className} bg-pink-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Id
      </div>
    ),
    premiere: (
      <div className={`${className} bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Pr
      </div>
    ),
    aftereffects: (
      <div className={`${className} bg-purple-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Ae
      </div>
    ),
    lightroom: (
      <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Lr
      </div>
    ),
    xd: (
      <div className={`${className} bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Xd
      </div>
    ),
    acrobat: (
      <div className={`${className} bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Ac
      </div>
    ),
    audition: (
      <div className={`${className} bg-green-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Au
      </div>
    ),
    animate: (
      <div className={`${className} bg-red-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        An
      </div>
    ),
    dreamweaver: (
      <div className={`${className} bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Dw
      </div>
    ),
    
    // Figma & Design Tools
    figma: (
      <div className={`${className} bg-gradient-to-br from-orange-400 to-purple-500 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z"/>
          <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z"/>
          <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z"/>
          <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z"/>
          <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z"/>
        </svg>
      </div>
    ),
    sketch: (
      <div className={`${className} bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Sk
      </div>
    ),
    
    // Affinity Products
    affinity_designer: (
      <div className={`${className} bg-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        AD
      </div>
    ),
    affinity_photo: (
      <div className={`${className} bg-purple-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        AP
      </div>
    ),
    affinity_publisher: (
      <div className={`${className} bg-red-700 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Ap
      </div>
    ),
    
    // Video Editing
    capcut: (
      <div className={`${className} bg-black rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L8 6h3v6h2V6h3l-4-4zM8 18h8v-2H8v2z"/>
        </svg>
      </div>
    ),
    finalcut: (
      <div className={`${className} bg-gray-800 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        FC
      </div>
    ),
    davinci: (
      <div className={`${className} bg-red-800 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        DV
      </div>
    ),
    
    // AI Tools
    chatgpt: (
      <div className={`${className} bg-green-600 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>
    ),
    claude: (
      <div className={`${className} bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        CL
      </div>
    ),
    gemini: (
      <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        GM
      </div>
    ),
    kimi: (
      <div className={`${className} bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        KM
      </div>
    ),
    
    // Canva
    canva: (
      <div className={`${className} bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568l-1.138 1.138L12 14.276l-4.43 4.43-1.138-1.138L10.862 13H6v-2h4.862L6.432 6.568l1.138-1.138L12 9.862l4.43-4.432 1.138 1.138L13.138 11H18v2h-4.862l4.43 4.43z"/>
        </svg>
      </div>
    ),
    
    // Programming & Code
    code: (
      <div className={`${className} bg-gray-800 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    javascript: (
      <div className={`${className} bg-yellow-500 rounded-lg flex items-center justify-center text-black text-xs font-bold`}>
        JS
      </div>
    ),
    typescript: (
      <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        TS
      </div>
    ),
    react: (
      <div className={`${className} bg-blue-400 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 9.861A2.139 2.139 0 1 0 12 14.139 2.139 2.139 0 1 0 12 9.861zM6.008 16.255l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 0 0 1.363 3.578l.101.213-.101.213a23.307 23.307 0 0 0-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046a24.95 24.95 0 0 1 1.182-3.046A24.752 24.752 0 0 1 5.317 8.95zM17.992 16.255l-.133-.469a23.357 23.357 0 0 0-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 0 0 1.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.48 1.039.877 2.06 1.182 3.046 2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046a24.788 24.788 0 0 1-1.182 3.046zM5.31 8.945l-.133-.467C4.188 4.992 4.488 2.494 6 1.622c1.483-.856 3.864.155 6.359 2.716l.34.349-.34.349a23.552 23.552 0 0 0-2.422 2.967l-.135.193-.235.02a23.657 23.657 0 0 0-3.785.61l-.472.119zm1.896-6.63c-.268 0-.505.058-.705.173-.994.573-1.17 2.565-.485 5.253a25.122 25.122 0 0 1 3.233-.501 24.847 24.847 0 0 1 2.052-2.544c-1.56-1.519-3.037-2.381-4.095-2.381zM16.795 22.677c-.001 0-.001 0 0 0-1.425 0-3.255-1.073-5.154-3.023l-.34-.349.34-.349a23.53 23.53 0 0 0 2.421-2.968l.135-.193.234-.02a23.63 23.63 0 0 0 3.787-.609l.472-.119.134.468c.987 3.484.688 5.983-.824 6.854a2.38 2.38 0 0 1-1.205.308zm-4.096-3.381c1.56 1.519 3.037 2.381 4.095 2.381h.001c.267 0 .505-.058.704-.173.994-.573 1.171-2.566.485-5.254a25.02 25.02 0 0 1-3.234.501 24.674 24.674 0 0 1-2.051 2.545zM18.69 8.945l-.472-.119a23.479 23.479 0 0 0-3.787-.61l-.234-.02-.135-.193a23.414 23.414 0 0 0-2.421-2.967l-.34-.349.34-.349C14.135 1.778 16.515.767 18 1.622c1.512.872 1.812 3.37.823 6.855l-.133.468zM14.75 7.24c1.142.104 2.227.273 3.234.501.686-2.688.509-4.68-.485-5.253-.988-.571-2.845.304-4.8 2.208A24.849 24.849 0 0 1 14.75 7.24zM7.206 22.677A2.38 2.38 0 0 1 6 22.369c-1.512-.871-1.812-3.369-.823-6.854l.132-.468.472.119c1.155.291 2.429.496 3.785.609l.235.02.134.193a23.596 23.596 0 0 0 2.422 2.968l.34.349-.34.349c-1.898 1.95-3.728 3.023-5.151 3.023zm-1.19-6.427c-.686 2.688-.509 4.681.485 5.254.988.571 2.845-.309 4.8-2.208a24.998 24.998 0 0 1-2.052-2.545 25.049 25.049 0 0 1-3.233-.501zM12 16.878c-.663 0-1.337-.035-2.007-.105l-.11-.012-.101-.021a15.859 15.859 0 0 1-2.207-.777l-.471-.211.211-.471a15.494 15.494 0 0 1 .776-2.207l.021-.101.012-.11a15.923 15.923 0 0 1 .105-2.007A15.923 15.923 0 0 1 8.124 9.061l.012-.11.021-.101c.194-.787.46-1.54.777-2.207l.211-.471.471.211a15.859 15.859 0 0 1 2.207.777l.101.021.11.012a15.923 15.923 0 0 1 2.007.105 15.923 15.923 0 0 1 2.007-.105l.11-.012.101-.021a15.859 15.859 0 0 1 2.207-.777l.471-.211.211.471c.317.667.583 1.42.777 2.207l.021.101.012.11a15.923 15.923 0 0 1 .105 2.007 15.923 15.923 0 0 1-.105 2.007l-.012.11-.021.101a15.859 15.859 0 0 1-.777 2.207l-.211.471-.471-.211a15.859 15.859 0 0 1-2.207-.777l-.101-.021-.11-.012a15.923 15.923 0 0 1-2.007-.105zM9.691 15.661a14.036 14.036 0 0 0 1.198.099c.394.018.797.018 1.191 0a14.036 14.036 0 0 0 1.198-.099 14.318 14.318 0 0 0 1.717-.606 14.674 14.674 0 0 0-.606-1.717 14.045 14.045 0 0 0-.099-1.198 14.045 14.045 0 0 0 .099-1.198 14.318 14.318 0 0 0 .606-1.717 14.674 14.674 0 0 0-1.717-.606 14.036 14.036 0 0 0-1.198-.099c-.394-.018-.797-.018-1.191 0a14.036 14.036 0 0 0-1.198.099 14.318 14.318 0 0 0-1.717.606 14.674 14.674 0 0 0 .606 1.717 14.045 14.045 0 0 0-.099 1.198 14.045 14.045 0 0 0 .099 1.198 14.318 14.318 0 0 0 .606 1.717 14.674 14.674 0 0 0 1.717.606z"/>
        </svg>
      </div>
    ),
    python: (
      <div className={`${className} bg-blue-500 rounded-lg flex items-center justify-center text-yellow-400 text-xs font-bold`}>
        Py
      </div>
    ),
    
    // Original icons
    brand: (
      <div className={`${className} bg-purple-500 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    typography: (
      <div className={`${className} bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        Tt
      </div>
    ),
    social: (
      <div className={`${className} bg-pink-500 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    motion: (
      <div className={`${className} bg-indigo-500 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm5.6 8.4L7 8v4l2.6-1.6z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    web: (
      <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    ui: (
      <div className={`${className} bg-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        UI
      </div>
    ),
    ux: (
      <div className={`${className} bg-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
        UX
      </div>
    ),
    design: (
      <div className={`${className} bg-gray-700 rounded-lg flex items-center justify-center text-white`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </div>
    )
  }
  
  return iconMap[type] || iconMap.design
}
