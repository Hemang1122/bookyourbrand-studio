'use client';

import Image from 'next/image';
import { MapPin, Target, Users, Award, Globe } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AboutPage() {
  const founderImage = PlaceHolderImages.find(img => img.id === 'founder-photo');

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12 px-4 sm:px-6 lg:px-8 rounded-2xl overflow-hidden border border-white/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">BookYourBrands</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transforming brands through exceptional video content and creative storytelling
          </p>
        </div>

        {/* Founder Section */}
        <div className="bg-[#13131F] rounded-3xl border border-white/10 p-8 md:p-12 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            
            {/* Founder Image */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-purple-500/50 ring-offset-4 ring-offset-[#13131F]">
                {founderImage && (
                  <Image
                    src={founderImage.imageUrl}
                    alt="Preeti Lalani - Founder & CEO"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={founderImage.imageHint}
                  />
                )}
              </div>
            </div>

            {/* Founder Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Preeti Lalani</h2>
              <p className="text-purple-400 font-medium text-lg mb-4">Founder & CEO</p>
              <p className="text-gray-300 leading-relaxed mb-4">
                With a vision to revolutionize content creation, Preeti Lalani founded BookYourBrands to empower businesses with world-class video editing services. Under her leadership, BYB has grown from a small startup to a trusted partner for brands across India and the Middle East.
              </p>
              <p className="text-gray-400 italic">
                "We don't just edit videos—we craft stories that resonate, engage, and convert."
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          
          {/* Our Mission */}
          <div className="bg-[#13131F] rounded-2xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our Mission</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              To deliver high-quality, affordable video editing services that help businesses scale their content production effortlessly. We believe every brand deserves professional-grade content without breaking the bank.
            </p>
          </div>

          {/* Our Vision */}
          <div className="bg-[#13131F] rounded-2xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-pink-500/10">
                <Award className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our Vision</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              To become the most trusted video editing partner for content creators and businesses globally, setting new standards in quality, speed, and customer satisfaction.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-500/20 p-8 md:p-12 mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Why Choose BookYourBrands?</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 mb-4">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Expert Team</h4>
              <p className="text-gray-300">Skilled editors who understand your brand vision</p>
            </div>

            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-pink-500/10 mb-4">
                <Target className="h-8 w-8 text-pink-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Fast Delivery</h4>
              <p className="text-gray-300">48-72 hour turnaround guaranteed</p>
            </div>

            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 mb-4">
                <Award className="h-8 w-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Premium Quality</h4>
              <p className="text-gray-300">Professional-grade editing at affordable prices</p>
            </div>
          </div>
        </div>

        {/* Our Offices */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Globe className="h-8 w-8 text-purple-400" />
            <h3 className="text-3xl font-bold text-white">Our Global Presence</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* India Office */}
            <div className="bg-[#13131F] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 flex-shrink-0">
                  <MapPin className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Mumbai Office (HQ)</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Shop No 14, Vishwakarma Nagar Building<br />
                    60 Feet Road, Opposite Old Swaminarayan Temple<br />
                    Vasai West, Vasai-Virar<br />
                    Maharashtra 401202, India
                  </p>
                </div>
              </div>
            </div>

            {/* Dubai Office */}
            <div className="bg-[#13131F] rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Dubai Office</h4>
                  <p className="text-gray-300 leading-relaxed">
                    M Floor, Hashtag Business Center<br />
                    City Gate Building, Bin Ham Properties<br />
                    Port Saeed, Deir<br />
                    Dubai, UAE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl p-8 md:p-12 text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Elevate Your Content?
          </h3>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust BookYourBrands for their video editing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+918433943520"
              className="px-8 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all"
            >
              📞 +91 84339 43520
            </a>
            <a
              href="https://www.bookyourbrands.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              🌐 Visit Website
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
