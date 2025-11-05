
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CardApplication } from '@/lib/data';

interface VirtualCardProps {
  application: CardApplication;
}

const formatCardNumber = (number?: string) => {
  if (!number) return '•••• •••• •••• ••••';
  return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

const VirtualCard: React.FC<VirtualCardProps> = ({ application }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const cardHolderName = application.name || 'CARDHOLDER NAME';
  const expiryDate = application.expiryDate || 'MM/YY';
  const cvc = application.cvc || '•••';

  return (
    <div className="w-full max-w-sm mx-auto perspective-1000">
      <motion.div
        className="relative w-full h-56 transform-style-preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Card Front */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary via-blue-400 to-teal-300 shadow-lg p-6 flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <span className="font-bold text-lg">Wallet XChanger</span>
              <div className="w-12 h-8 bg-yellow-400 rounded-md flex items-center justify-center">
                 <div className="w-6 h-6 rounded-full bg-red-500 opacity-70 mix-blend-multiply"></div>
                 <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-70 mix-blend-multiply -ml-2"></div>
              </div>
            </div>
            <div className="space-y-2">
                <div className="font-mono text-xl tracking-widest text-center">
                    {showDetails ? formatCardNumber(application.cardNumber) : formatCardNumber()}
                </div>
                 <div className="flex justify-between text-xs font-mono uppercase">
                    <span>{showDetails ? cardHolderName : 'CARDHOLDER NAME'}</span>
                    <span>{showDetails ? expiryDate : 'MM/YY'}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Card Back */}
        <div className="absolute w-full h-full backface-hidden transform-rotate-y-180">
          <div className="w-full h-full rounded-xl bg-gray-100 shadow-lg p-2 flex flex-col justify-between">
            <div className="w-full h-10 bg-gray-900 mt-4"></div>
            <div className="px-4 py-2 bg-gray-200 rounded-md flex justify-end items-center">
              <span className="italic text-gray-600 font-mono text-sm pr-2">CVC</span>
              <span className="font-mono text-black bg-white px-2 py-1 rounded-sm text-sm">
                {showDetails ? cvc : '•••'}
              </span>
            </div>
             <p className="text-center text-xs text-gray-500 px-4 pb-2">
                This card is issued by Mercury Bank for use with Wallet XChanger platform. For support, contact support@walletxchanger.com.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button onClick={() => setIsFlipped(!isFlipped)} variant="outline">
          Flip Card
        </Button>
        <Button onClick={() => setShowDetails(!showDetails)} variant="secondary">
          {showDetails ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
    </div>
  );
};

export default VirtualCard;
