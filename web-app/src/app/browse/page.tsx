'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/layout/header'
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Eye, 
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Users,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface PublicIdea {
  id: string
  title: string
  description: string
  industry: string
  score: number
  submitterName: string
  submittedAt: Date
  likes: number
  views: number
  isBookmarked: boolean
  tags: string[]
}

export default function BrowseIdeasPage() {
  const [ideas, setIdeas] = useState<PublicIdea[]>([])
  const [filteredIdeas, setFilteredIdeas] = useState<PublicIdea[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockIdeas: PublicIdea[] = [
      {
        id: '1',
        title: 'AI-Powered Crop Disease Detection',
        description: 'Mobile app using computer vision to help farmers identify and treat crop diseases early, potentially saving 30% of crop yield losses.',
        industry: 'Agriculture',
        score: 92,
        submitterName: 'Farmer Tech',
        submittedAt: new Date('2025-01-15'),
        likes: 45,
        views: 312,
        isBookmarked: false,
        tags: ['AI', 'Agriculture', 'Mobile App', 'Computer Vision']
      },
      {
        id: '2',
        title: 'Micro-Learning Platform for Blue-Collar Workers',
        description: 'Bite-sized skill training modules delivered via SMS and voice calls for workers without smartphones.',
        industry: 'Education',
        score: 88,
        submitterName: 'Skill Builder',
        submittedAt: new Date('2025-01-12'),
        likes: 67,
        views: 445,
        isBookmarked: true,
        tags: ['Education', 'SMS', 'Skills', 'Workers']
      },
      {
        id: '3',
        title: 'Solar-Powered Water Purification Kiosks',
        description: 'Community water purification systems powered by solar energy, providing clean drinking water in rural areas.',
        industry: 'Healthcare',
        score: 85,
        submitterName: 'Clean Water Co',
        submittedAt: new Date('2025-01-10'),
        likes: 89,
        views: 567,
        isBookmarked: false,
        tags: ['Solar', 'Water', 'Community', 'Rural']
      },
      {
        id: '4',
        title: 'Blockchain-Based Supply Chain for Organic Farmers',
        description: 'Transparent tracking system from farm to consumer, ensuring organic certification and fair pricing.',
        industry: 'Agriculture',
        score: 91,
        submitterName: 'Organic Connect',
        submittedAt: new Date('2025-01-08'),
        likes: 34,
        views: 289,
        isBookmarked: false,
        tags: ['Blockchain', 'Organic', 'Supply Chain', 'Transparency']
      },
      {
        id: '5',
        title: 'AR-Enhanced Maintenance Training',
        description: 'Augmented reality application for training technicians on complex machinery maintenance procedures.',
        industry: 'Technology',
        score: 87,
        submitterName: 'TechTrainer',
        submittedAt: new Date('2025-01-05'),
        likes: 78,
        views: 423,
        isBookmarked: true,
        tags: ['AR', 'Training', 'Maintenance', 'Technology']
      }
    ]

    setTimeout(() => {
      setIdeas(mockIdeas)
      setFilteredIdeas(mockIdeas)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...ideas]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(idea => 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(idea => idea.industry === industryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'likes':
          return b.likes - a.likes
        case 'views':
          return b.views - a.views
        case 'recent':
          return b.submittedAt.getTime() - a.submittedAt.getTime()
        default:
          return 0
      }
    })

    setFilteredIdeas(filtered)
  }, [searchQuery, industryFilter, sortBy, ideas])

  const toggleBookmark = (ideaId: string) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === ideaId 
        ? { ...idea, isBookmarked: !idea.isBookmarked }
        : idea
    ))
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const uniqueIndustries = Array.from(new Set(ideas.map(idea => idea.industry)))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-2 mb-8">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Browse Ideas</h1>
          </div>

          <Tabs defaultValue="explore" className="space-y-6">
            <TabsList>
              <TabsTrigger value="explore">Explore All</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="bookmarked">My Bookmarks</TabsTrigger>
              <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search ideas, industries, or tags..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        {uniqueIndustries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Highest Score</SelectItem>
                        <SelectItem value="likes">Most Liked</SelectItem>
                        <SelectItem value="views">Most Viewed</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Ideas Grid */}
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-5/6" />
                          <div className="h-4 bg-muted rounded w-4/6" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredIdeas.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No ideas found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or explore different categories.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIdeas.map((idea) => (
                    <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight mb-2">
                              {idea.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{idea.industry}</Badge>
                              <div className={`px-2 py-1 rounded-md border text-sm font-medium ${getScoreColor(idea.score)}`}>
                                {idea.score}/100
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(idea.id)}
                            className="shrink-0"
                          >
                            {idea.isBookmarked ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                          {idea.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {idea.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{idea.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {idea.likes}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {idea.views}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(idea.submittedAt, 'MMM d')}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">
                            by {idea.submitterName}
                          </span>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/ideas/${idea.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trending Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ideas gaining popularity in the last 7 days...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookmarked">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookmarkCheck className="h-5 w-5" />
                    My Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredIdeas.filter(idea => idea.isBookmarked).length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                      <p className="text-muted-foreground">
                        Bookmark interesting ideas to save them for later.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredIdeas
                        .filter(idea => idea.isBookmarked)
                        .map((idea) => (
                          <div key={idea.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{idea.title}</h4>
                              <p className="text-sm text-muted-foreground">{idea.industry}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/ideas/${idea.id}`}>View</Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-rated">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Rated Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredIdeas
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 10)
                      .map((idea, index) => (
                        <div key={idea.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium">{idea.title}</h4>
                            <p className="text-sm text-muted-foreground">{idea.industry}</p>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-md border font-medium ${getScoreColor(idea.score)}`}>
                            {idea.score}/100
                          </div>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/ideas/${idea.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
