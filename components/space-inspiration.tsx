import Image from "next/image"
import Link from "next/link"

export default function SpaceInspiration() {
  const inspirations = [
    {
      title: "Modern Office Spaces",
      description: "Productive environments for your team",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/hero_workspace.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvaGVyb193b3Jrc3BhY2UucG5nIiwiaWF0IjoxNzYzNzkwOTc4LCJleHAiOjE4MjY4NjI5Nzh9.Xef8rNjhOlmpImh4DzM_3p4w_oSv8hVYbX3t9ZQY_5M",
      href: "/all-spaces?type=office",
    },
    {
      title: "Creative Studios",
      description: "Inspiring spaces for artists and creators",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/hero_creative-studio.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvaGVyb19jcmVhdGl2ZS1zdHVkaW8ucG5nIiwiaWF0IjoxNzYzNzkxMTExLCJleHAiOjE4MjY4NjMxMTF9.EMa467upjP0akFJPIGxo3MQzM_IpW7wB9cY1zqoQYAk",
      href: "/all-spaces?type=studio",
    },
    {
      title: "Pop-up Restaurants",
      description: "Temporary kitchens for culinary ventures",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/popup-restaurant.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvcG9wdXAtcmVzdGF1cmFudC5wbmciLCJpYXQiOjE3NjM3OTEyNjAsImV4cCI6MTgyNjg2MzI2MH0.5b2lagnZUcl0gCdvKdjo6bdHLyDp05zps_YrvmOa3ag",
      href: "/all-spaces?type=restaurant",
    },
    {
      title: "Secure Storage Units",
      description: "Safe and accessible storage solutions",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/secure-storage.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvc2VjdXJlLXN0b3JhZ2UucG5nIiwiaWF0IjoxNzYzNzkxMzEyLCJleHAiOjE4MjY4NjMzMTJ9.bwaRmn7h-EC-e0lLcExrLVYLhq8LWCGGxYOq-xU_O14",
      href: "/all-spaces?type=storage",
    },
    {
      title: "Flexible Co-working",
      description: "Collaborative spaces for freelancers",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/hero_coworking_space.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvaGVyb19jb3dvcmtpbmdfc3BhY2UuanBnIiwiaWF0IjoxNzYzNzkyNDUzLCJleHAiOjE4MjY4NjQ0NTN9.ZdSPOsmAy-nZ-gXjoSHp7-_UqCq-jidgBmc8IXS_1n8",
      href: "/all-spaces?type=coworking",
    },
    {
      title: "Event Venues",
      description: "Spaces for unforgettable gatherings",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/hero_event-space.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvaGVyb19ldmVudC1zcGFjZS5wbmciLCJpYXQiOjE3NjM3OTI0ODIsImV4cCI6MTgyNjg2NDQ4Mn0.TCuK-5ehoGUjFNQm-efXy6kx6MDkkKFFPtv6XZ_-7Xs",
      href: "/all-spaces?type=event",
    },
    {
      title: "Business Centers",
      description: "Professional hubs for your enterprise",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/business-center.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvYnVzaW5lc3MtY2VudGVyLnBuZyIsImlhdCI6MTc2Mzc5MjUzNSwiZXhwIjoxODI2ODY0NTM1fQ.6oOMisRTdGQqA2A2b-OQGXxO823HGrBDhYT56sa1v90",
      href: "/all-spaces?type=business",
    },
    {
      title: "Conference Rooms",
      description: "Equipped for productive meetings",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/hero_meeting-room.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvaGVyb19tZWV0aW5nLXJvb20ucG5nIiwiaWF0IjoxNzYzNzkyNTY2LCJleHAiOjE4MjY4NjQ1NjZ9.id1cnP1P4wBp4we73T8dy1ytcZ4go6PkLyX2yg4E0As",
      href: "/all-spaces?type=meeting",
    },
    {
      title: "Cafe or Coffee Shop",
      description: "Do work while you grab a coffee",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/cafe.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvY2FmZS5qcGciLCJpYXQiOjE3NjM3OTI4NzAsImV4cCI6MTgyNjg2NDg3MH0.7HWg1Xd9tY6xwixVzOSdyjBCzGZSrG6RIPrsgpjZF1A",
      href: "/all-spaces?type=cafe",
    },
    {
      title: "Greenrooms",
      description: "Comfortable spaces for performers",
      image: "https://vkezfpdfkdcfjhqaefci.supabase.co/storage/v1/object/sign/assets/greenroom-space.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ZTgyODg2ZS01MmI3LTQ4ZTktYjI4ZS1iZmE3OTE1NTVjZDciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhc3NldHMvZ3JlZW5yb29tLXNwYWNlLnBuZyIsImlhdCI6MTc2Mzc5Mjk0NCwiZXhwIjoxODI2ODY0OTQ0fQ.0zXBJH4pOgrcgJH8fC49je_x6ck00Oa0Bj0H5ez2SK4",
      href: "/all-spaces?type=greenroom",
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Inspiration for your next space</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inspirations.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                width={400}
                height={250}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:underline mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
