import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, MapPin, Bike, Users, ArrowRight, Heart, Phone, Mail, Clock, Car } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function Home() {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/login');
  };

  const handlePublicForm = () => {
    navigate('/rent');
  };

  const galleryImages = [
    '/customer-1.jpg',
    '/customer-2.jpg',
    '/customer-3.jpg',
    '/customer-4.jpg',
    '/customer-5.jpg',
    '/customer-6.jpg',
    '/customer-7.jpg',
    '/customer-8.jpg',
    '/customer-9.jpg',
    '/customer-10.jpg',
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-3">
              <Logo width={80} />
              <span className="hidden md:block text-xl font-bold text-stone-900 tracking-tight">SriRentABike</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleAdminLogin}
                className="inline-flex items-center px-3 py-2 border border-stone-200 text-sm font-medium rounded-full text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors duration-200"
                aria-label="Admin Login"
              >
                <Lock className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={handlePublicForm}
                className="inline-flex items-center px-4 py-2.5 sm:px-5 sm:py-2.5 text-sm font-medium rounded-full text-white bg-stone-900 hover:bg-stone-800 transition-colors duration-200 shadow-md"
              >
                Rent Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[700px] h-[85vh] flex items-center">
          <div className="max-w-2xl text-left">
            <span className="inline-block px-4 py-1 rounded-full bg-orange-500/90 text-white text-sm font-medium mb-6 backdrop-blur-sm">
              Authentic Bike Rentals in Tangalle
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Ride the <br/>
              <span className="text-orange-400">Soul</span> of the City
            </h1>
            <p className="text-xl md:text-2xl text-stone-100 mb-10 font-light drop-shadow-md leading-relaxed max-w-xl">
              Explore Tangalle and the South Coast on your own terms. Scooters, motorbikes, and hassle-free transport for the perfect Sri Lankan adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handlePublicForm}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-stone-900 bg-white hover:bg-stone-100 transition-all duration-300 shadow-xl hover:scale-105"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-lg font-medium rounded-full text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                View Gallery
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">Why Choose SriRentABike?</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              We are a local family business in Tangalle, dedicated to helping you experience the real Sri Lanka. No hidden fees, just friendly service and reliable rides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group p-8 rounded-3xl bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-stone-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-8 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">24/7 Support</h3>
              <p className="text-stone-600 leading-relaxed">
                We're always here when you need us. Whether it's a late-night pickup or roadside assistance, we've got you covered around the clock.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-stone-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 text-teal-600 mb-8 group-hover:scale-110 transition-transform duration-300">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Complete Transport</h3>
              <p className="text-stone-600 leading-relaxed">
                Need more than a bike? We also offer reliable taxi services and car hire to get you comfortably to your next destination.
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-stone-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-8 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">Local Experts</h3>
              <p className="text-stone-600 leading-relaxed">
                Based in Polommaruwa, Tangalle, we know the best hidden beaches, temples, and food spots. Ask us for recommendations!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div id="gallery" className="py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6">Moments from the Road</h2>
              <p className="text-lg text-stone-600">
                Real stories from travelers exploring Tangalle and beyond. See what our community is up to.
              </p>
            </div>
            <button 
              onClick={handlePublicForm}
              className="hidden md:inline-flex items-center px-6 py-3 border border-stone-300 rounded-full text-stone-700 hover:bg-white transition-colors"
            >
              Join the Community <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
          
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {galleryImages.map((src, index) => (
              <div key={index} className="break-inside-avoid rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
                <img
                  src={src}
                  alt={`Happy customer ${index + 1}`}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
             <button 
              onClick={handlePublicForm}
              className="inline-flex items-center px-8 py-4 border border-stone-300 rounded-full text-stone-700 hover:bg-white transition-colors w-full justify-center"
            >
              Join the Community <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-32 bg-stone-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <img src="/hero.jpg" className="w-full h-full object-cover grayscale" alt="texture" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Ready to Explore Tangalle?
          </h2>
          <p className="text-xl text-stone-300 mb-12 max-w-2xl mx-auto">
            Book your ride today. Simple, fast, and handled with care by locals who want you to have the best trip possible.
          </p>
          <button
            onClick={handlePublicForm}
            className="inline-flex items-center px-10 py-5 text-lg font-bold rounded-full text-stone-900 bg-orange-500 hover:bg-orange-400 transition-all duration-300 shadow-2xl hover:scale-105 hover:shadow-orange-500/20"
          >
            Rent Your Bike Now
            <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-stone-400 py-16 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                 <div className="opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
                    <Logo width={120} />
                 </div>
              </div>
              <p className="text-stone-500 max-w-sm mb-6">
                SriRentABike is your trusted partner for exploring Tangalle. We provide quality bikes, scooters, and taxi services with 24/7 support.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.facebook.com/p/Sri-Rent-a-Bike-61571306356006/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a 
                  href="https://www.instagram.com/sribike2024/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300"
                >
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a 
                  href="https://wa.me/94704984008" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all duration-300"
                >
                    <span className="sr-only">WhatsApp</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Explore</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={handlePublicForm} className="hover:text-orange-500 transition-colors">Rent a Bike</button></li>
                <li><button onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-500 transition-colors">Gallery</button></li>
                <li><button onClick={handleAdminLogin} className="hover:text-orange-500 transition-colors">Admin Portal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-stone-600 flex-shrink-0" /> 
                  <a href="https://g.co/kgs/ChFGbip" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                    Ulu Wewa Road,<br/>Polommaruwa, Tangalle,<br/>Sri Lanka
                  </a>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-stone-600 flex-shrink-0" />
                  <a href="tel:+94704984008" className="hover:text-orange-500 transition-colors">+94 70 498 4008</a>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-stone-600 flex-shrink-0" />
                  <a href="mailto:srbikesrirentbike@gmail.com" className="hover:text-orange-500 transition-colors">srbikesrirentbike@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-800 text-center text-xs text-stone-600">
            <p>&copy; {new Date().getFullYear()} SriRentABike. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/94704984008"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
}
