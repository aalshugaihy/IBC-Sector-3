import React from 'react';
import { motion } from 'motion/react';

interface KSAMapProps {
  data?: Record<string, number>;
  className?: string;
}

// Simplified SVG paths for KSA regions (representative)
const REGIONS = [
  { id: 'riyadh', name: 'Riyadh', path: 'M 150 100 L 200 120 L 180 180 L 120 160 Z', color: '#006C35' },
  { id: 'makkah', name: 'Makkah', path: 'M 50 150 L 80 140 L 90 180 L 60 190 Z', color: '#008442' },
  { id: 'madinah', name: 'Madinah', path: 'M 40 80 L 90 70 L 100 120 L 60 130 Z', color: '#009D4F' },
  { id: 'eastern', name: 'Eastern Province', path: 'M 220 80 L 280 100 L 260 220 L 200 200 Z', color: '#005529' },
  { id: 'asir', name: 'Asir', path: 'M 80 200 L 110 210 L 100 240 L 70 230 Z', color: '#00B65C' },
  // ... more regions can be added for higher fidelity
];

export const KSAMap: React.FC<KSAMapProps> = ({ data, className }) => {
  return (
    <div className={`relative w-full aspect-[4/3] flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 300 250"
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0, 108, 53, 0.2))' }}
      >
        <g>
          {REGIONS.map((region) => (
            <motion.path
              key={region.id}
              d={region.path}
              fill={region.color}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                fill: '#10B981', 
                scale: 1.05,
                stroke: 'rgba(255,255,255,0.8)',
                transition: { duration: 0.2 }
              }}
              className="cursor-pointer transition-colors"
            >
              <title>{region.name}</title>
            </motion.path>
          ))}
        </g>
        
        {/* Decorative elements representing KSA vision/growth */}
        <circle cx="150" cy="125" r="2" fill="white" className="animate-pulse" />
        <circle cx="70" cy="165" r="1.5" fill="white" className="animate-pulse delay-75" />
        <circle cx="240" cy="150" r="1.5" fill="white" className="animate-pulse delay-150" />
      </svg>
      
      <div className="absolute top-4 right-4 glassy p-3 rounded-xl border border-white/10">
        <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
          Investment Focus
        </p>
        <p className="text-xs font-bold text-gray-900 dark:text-white">
          Kingdom of Saudi Arabia
        </p>
      </div>
    </div>
  );
};
