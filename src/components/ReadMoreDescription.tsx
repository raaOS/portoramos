"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReadMoreDescriptionProps {
  text: string
  maxLines?: number
  className?: string
}

export default function ReadMoreDescription({ 
  text, 
  maxLines = 2, 
  className = "text-lg leading-relaxed text-gray-700 mb-8" 
}: ReadMoreDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  
  // Calculate how many sentences to show initially
  const initialSentences = Math.max(1, Math.ceil(sentences.length * 0.4)) // Show ~40% initially, minimum 1
  const shouldShowReadMore = sentences.length > maxLines
  
  const displayText = isExpanded 
    ? text 
    : shouldShowReadMore 
      ? sentences.slice(0, initialSentences).join('. ') + '.'
      : text
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }
  
  if (!shouldShowReadMore) {
    return <p className={className}>{text}</p>
  }
  
  return (
    <div className={className}>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {displayText}
        {!isExpanded && (
          <button
            onClick={handleToggle}
            className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium ml-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded inline-block text-lg"
            type="button"
          >
            selengkapnya
          </button>
        )}
      </motion.p>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-2"
          >
            <p className="text-gray-700">
              {sentences.slice(initialSentences).join('. ') + '.'}
            </p>
            <button
              onClick={handleToggle}
              className="text-blue-600 hover:text-blue-800 font-medium mt-2 transition-colors duration-200 text-lg"
            >
              Sembunyikan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
