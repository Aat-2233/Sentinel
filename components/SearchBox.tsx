'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBox() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const slug = query.trim().toLowerCase().replace(/\s+/g, '-')
      router.push(`/analyze/${encodeURIComponent(slug)}?name=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      {/* Hover glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-container to-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-xl" />

      {/* Input row */}
      <div
        className={`relative bg-surface-container-low border-b-2 transition-colors duration-300 flex items-center ${
          isFocused ? 'border-primary' : 'border-outline-variant/20'
        }`}
      >
        {/* Search icon */}
        <span className="material-symbols-outlined text-outline pl-6 text-xl select-none">
          search
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder='Enter company name — e.g. Samsung, Tata Motors...'
          className="w-full h-16 bg-transparent font-mono text-lg text-on-surface placeholder:text-outline/50 px-6 outline-none"
          id="company-search-input"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Analyze button */}
        <button
          type="submit"
          disabled={!query.trim()}
          className="bg-gradient-to-br from-primary-container to-primary text-on-primary-container px-6 py-2 rounded-lg font-label text-xs tracking-widest uppercase font-bold hover:scale-[1.02] active:scale-95 transition-transform duration-150 mr-4 whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none"
          id="analyze-button"
        >
          Analyze
        </button>
      </div>

      {/* Scanning line */}
      <div
        className={`scanning-line w-full transition-opacity duration-300 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </form>
  )
}
