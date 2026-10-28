import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassPlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

import api from '../utils/api';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await api.get('/laporan');
        
        const laporanWithPhotos = data
          .map(item => {
            let photo = null;
            let cleanDeskripsi = item.deskripsi || '';

            if (cleanDeskripsi.includes('--- Parameter AC ---')) {
              cleanDeskripsi = cleanDeskripsi.split('--- Parameter AC ---')[0].trim();
            }

            if (cleanDeskripsi.includes('[PHOTO_BASE64]')) {
              const parts = cleanDeskripsi.split('[PHOTO_BASE64]');
              cleanDeskripsi = parts[0].trim();
              photo = parts[1].trim();
            }
            return {
              id: item.id,
              src: photo,
              title: cleanDeskripsi || `${item.kategori?.nama || ''} di ${item.areas?.nama_area || ''}`,
              category: item.kategori?.nama || '-',
              date: item.tanggal
            };
          })
          .filter(item => item.src);
          
        setPhotos(laporanWithPhotos);
      } catch (error) {
        console.error('Error fetching gallery:', error);
      }
    };
    fetchGallery();
  }, []);

  const handlePreview = (photo) => {
    Swal.fire({
      title: photo.title,
      text: `Kategori: ${photo.category} | Tanggal: ${photo.date}`,
      imageUrl: photo.src,
      imageWidth: 600,
      imageAlt: photo.title,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563EB',
      showCancelButton: true,
      cancelButtonText: 'Download',
      cancelButtonColor: '#10B981',
      customClass: {
        image: 'rounded-xl shadow-md'
      }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // Trigger download simulation
        Swal.fire({
          icon: 'success',
          title: 'Mendownload Foto...',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  const getCategoryStyle = (cat) => {
    if (cat === 'Emergency') return 'bg-danger text-white';
    if (cat === 'Corrective') return 'bg-warning text-white';
    return 'bg-primary text-white';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gallery Pekerjaan</h1>
        <p className="text-sm text-gray-500 mt-1">Dokumentasi Before, During, After perbaikan</p>
      </div>

      <div className="glass rounded-xl p-6 border border-gray-100 min-h-[500px]">
        {/* Pinterest-like Masonry Layout using Tailwind Columns */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative group break-inside-avoid rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handlePreview(photo)}
            >
              <img 
                src={photo.src} 
                alt={photo.title} 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay Glassmorphism on Hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100">
                <div className="flex justify-between items-start w-full">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 ${getCategoryStyle(photo.category)}`}>
                    {photo.category}
                  </span>
                  <div className="flex space-x-2">
                    <button className="p-1.5 bg-white bg-opacity-20 backdrop-blur-md rounded-full text-white hover:bg-opacity-50 transition">
                      <MagnifyingGlassPlusIcon className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-1.5 bg-white bg-opacity-20 backdrop-blur-md rounded-full text-white hover:bg-opacity-50 transition"
                      onClick={(e) => { e.stopPropagation(); /* download logic */ }}
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold leading-tight">{photo.title}</h3>
                  <p className="text-gray-300 text-xs mt-1">{photo.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <PhotoIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl font-medium text-gray-500">Belum ada foto yang diunggah</p>
            <p className="text-sm mt-2">Buat laporan dengan melampirkan foto agar muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
