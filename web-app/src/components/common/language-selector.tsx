'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SUPPORTED_LANGUAGES } from '@/lib/constants'
import { Language } from '@/types'

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language)
    // Here you would typically update the app's language context
    // For now, we'll just store it in localStorage
    localStorage.setItem('preferred-language', language)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <DropdownMenuItem 
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={selectedLanguage === code ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-lg">
              {code === 'en' ? '🇺🇸' : 
               code === 'hi' ? '🇮🇳' :
               code === 'ta' ? '🇮🇳' :
               code === 'te' ? '🇮🇳' :
               code === 'kn' ? '🇮🇳' :
               code === 'ml' ? '🇮🇳' :
               code === 'gu' ? '🇮🇳' :
               code === 'mr' ? '🇮🇳' :
               code === 'bn' ? '🇮🇳' :
               code === 'pa' ? '🇮🇳' : '🌐'}
            </span>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
