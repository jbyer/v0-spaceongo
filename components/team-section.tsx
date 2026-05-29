import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export default function TeamSection() {
  const teamMembers = [
    {
      name: "Amir Zakikhani",
      role: "CEO & Co-Founder",
      bio: "Amir Zakikhani is an entrepreneur and CEO of SpaceOnGo.com, bringing 20 years of experience building businesses, managing P&Ls, and creating nationwide sales teams, including his previous work with a startup mortgage company and as a licensed Real Estate Builder. With an Executive MBA from Rutgers University, he is now leading this latest tech venture in the shared economy sector with the ambitious goal of creating the world's #1 shared economy platform.",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/Amir2.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvQW1pcjIuanBnIiwiaWF0IjoxNzYzODU4NDQ1LCJleHAiOjE4MjY5MzA0NDV9.rJpPtdwq0rUtmZH4TJuB31GdgwuoGX3LXtNpLe5ZS5k",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Jason Byer",
      role: "CTO & Co-Founder",
      bio: "Jason Byer is the CTO of SpaceOnGo.com, bringing over 15 years of hands-on experience in front-end and back-end development, project management, and product management across various industries. He has led design and development teams for high-traffic B2B and B2C websites for major brands and is now leveraging his extensive web development, SEO, and online marketing expertise to establish SpaceOnGo as a leader in the shared economy space.",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/Jason2.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvSmFzb24yLmpwZyIsImlhdCI6MTc2Mzg1ODQ4MCwiZXhwIjoxODI2OTMwNDgwfQ.K212Zpin4kGhw_XhwiacIFnJ5PHZz4jtbzhT1MZxzeI",
      linkedin: "#",
      twitter: "#",
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Meet Our Founders</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the visionary founders who started SpaceOnGo with a mission to transform how people discover and
            utilize spaces around the world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-6 text-center">
                <div className="relative mb-6">
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    width={300}
                    height={300}
                    className="w-32 h-32 rounded-full mx-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-3">
                      <Link
                        href={member.linkedin}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Linkedin className="h-4 w-4 text-blue-600" />
                      </Link>
                      <Link
                        href={member.twitter}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Twitter className="h-4 w-4 text-blue-400" />
                      </Link>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <Badge variant="outline" className="mb-4">
                  {member.role}
                </Badge>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
