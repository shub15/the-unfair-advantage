// import type { Metadata } from 'next'
// import { Outfit } from 'next/font/google'
// import './globals.css'
// import { ThemeProvider } from '@/components/theme-provider'
// import { Toaster } from '@/components/ui/sonner'
// import { EvaluationProvider } from '@/context/evaluation-context'

// const outfit = Outfit({ 
//   subsets: ['latin'],
//   variable: '--font-sans'
// })

// export const metadata: Metadata = {
//   title: 'The Unfair Advantage - AI Business Idea Evaluator',
//   description: 'Transform your raw business ideas into structured, compelling business cases with AI-powered evaluation.',
//   keywords: ['business ideas', 'entrepreneurship', 'AI evaluation', 'startup', 'Tata STRIVE'],
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body className={outfit.className}>
//         <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           disableTransitionOnChange
//         >
//           <EvaluationProvider>
//             {children}
//             <Toaster />
//           </EvaluationProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }

import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth-context'
import { EvaluationProvider } from '@/context/evaluation-context'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'The Unfair Advantage - AI Business Idea Evaluator',
  description: 'Transform your raw business ideas into structured, compelling business cases with AI-powered evaluation.',
  keywords: ['business ideas', 'entrepreneurship', 'AI evaluation', 'startup', 'Tata STRIVE'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <EvaluationProvider>
              {children}
              <Toaster />
            </EvaluationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
