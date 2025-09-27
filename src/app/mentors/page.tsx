'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Header from '@/components/layout/header'
import { 
  Search, 
  Users, 
  MessageSquare, 
  Star, 
  MapPin, 
  Briefcase,
  Calendar,
  Filter,
  Video,
  Phone,
  Mail
} from 'lucide-react'

interface Mentor {
  id: string
  name: string
  title: string
  company: string
  avatar?: string
  rating: number
  reviews: number
  location: string
  experience: number
  specialties: string[]
  industries: string[]
  bio: string
  hourlyRate?: number
  availability: 'available' | 'busy' | 'offline'
  languages: string[]
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockMentors: Mentor[] = [
      {
        id: '1',
        name: 'Priya Sharma',
        title: 'Senior Product Manager',
        company: 'Tech Mahindra',
        avatar: '',
        rating: 4.9,
        reviews: 127,
        location: 'Bangalore, India',
        experience: 8,
        specialties: ['Product Strategy', 'User Research', 'Agile Development'],
        industries: ['Technology', 'Healthcare'],
        bio: 'Experienced product manager with a passion for building user-centric solutions. Helped 50+ startups scale their products.',
        hourlyRate: 2500,
        availability: 'available',
        languages: ['English', 'Hindi', 'Kannada']
      },
      {
        id: '2',
        name: 'Rajesh Gupta',
        title: 'Founder & CEO',
        company: 'AgriTech Solutions',
        avatar: '',
        rating: 4.8,
        reviews: 89,
        location: 'Delhi, India',
        experience: 12,
        specialties: ['Business Strategy', 'Fundraising', 'Market Entry'],
        industries: ['Agriculture', 'Food & Beverages'],
        bio: 'Serial entrepreneur with successful exits in AgriTech. Mentor at top accelerators and angel investor.',
        hourlyRate: 4000,
        availability: 'busy',
        languages: ['English', 'Hindi', 'Punjabi']
      },
      {
        id: '3',
        name: 'Dr. Meera Patel',
        title: 'Healthcare Innovation Lead',
        company: 'Apollo Hospitals',
        avatar: '',
        rating: 4.9,
        reviews: 156,
        location: 'Mumbai, India',
        experience: 15,
        specialties: ['Healthcare Innovation', 'Digital Health', 'Medical Devices'],
        industries: ['Healthcare', 'Technology'],
        bio: 'Medical doctor turned innovator, leading digital transformation initiatives in healthcare sector.',
        hourlyRate: 3500,
        availability: 'available',
        languages: ['English', 'Hindi', 'Gujarati']
      },
      {
        id: '4',
        name: 'Amit Krishnan',
        title: 'FinTech Advisor',
        company: 'Paytm',
        avatar: '',
        rating: 4.7,
        reviews: 203,
        location: 'Noida, India',
        experience: 10,
        specialties: ['Financial Services', 'Digital Payments', 'Compliance'],
        industries: ['Finance', 'Technology'],
        bio: 'FinTech expert with deep knowledge of Indian financial regulations and digital payment systems.',
        hourlyRate: 3000,
        availability: 'available',
        languages: ['English', 'Hindi', 'Tamil']
      }
    ]

    setTimeout(() => {
      setMentors(mockMentors)
      setFilteredMentors(mockMentors)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...mentors]

    if (searchQuery) {
      filtered = filtered.filter(mentor => 
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        mentor.industries.some(ind => ind.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter(mentor => mentor.industries.includes(industryFilter))
    }

    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(mentor => mentor.availability === availabilityFilter)
    }

    setFilteredMentors(filtered)
  }, [searchQuery, industryFilter, availabilityFilter, mentors])

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const uniqueIndustries = Array.from(new Set(mentors.flatMap(mentor => mentor.industries)))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Find Mentors</h1>
            </div>
            <Button>
              Become a Mentor
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, expertise, or industry..."
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

                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mentors Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-3 bg-muted rounded w-32" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria to find mentors.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.avatar} alt={mentor.name} />
                          <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold">{mentor.name}</h3>
                          <p className="text-sm text-muted-foreground">{mentor.title}</p>
                          <p className="text-sm text-muted-foreground">{mentor.company}</p>
                        </div>
                      </div>
                      
                      <Badge className={getAvailabilityColor(mentor.availability)}>
                        {mentor.availability}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{mentor.rating}</span>
                        <span className="text-muted-foreground">({mentor.reviews})</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {mentor.location}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {mentor.experience} years experience
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {mentor.bio}
                    </p>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {mentor.specialties.slice(0, 3).map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {mentor.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{mentor.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Industries</h4>
                        <div className="flex flex-wrap gap-1">
                          {mentor.industries.map((industry) => (
                            <Badge key={industry} variant="secondary" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {mentor.hourlyRate && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold">₹{mentor.hourlyRate}/hr</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" disabled={mentor.availability === 'offline'}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
