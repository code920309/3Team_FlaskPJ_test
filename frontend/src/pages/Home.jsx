import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, AlertCircle, Search, Settings, ArrowRight,
  Wrench, ShieldCheck
} from 'lucide-react';
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

import useUIStore from '../store/useUIStore';
import ReportModal from '../components/F-sse/ReportModal';

/** * Utils: Tailwind 클래스 병합 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ... Header, Hero, FeatureSection 컴포넌트들 ... (기존과 동일하게 UIStore 구독 중)

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600 tracking-tight">모두의 길</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors" aria-label="검색">
            <Search size={20} />
          </button>
          <button className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors" aria-label="설정">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const openReportModal = useUIStore((state) => state.openReportModal);
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  return (
    <section className="relative h-[640px] flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop"
          alt="도시를 이동하는 휠체어 사용자"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-white"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 backdrop-blur-sm mb-6">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Suwon Barrier-Free Map</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            모두를 위한<br />
            <span className="text-blue-400">안전한</span> 길 안내
          </h1>

          <p className="text-lg text-gray-200 mb-10 leading-relaxed max-w-lg">
            수원시 휠체어 사용자를 위한 실시간 안전 경로와 배리어프리 정보를 통합 제공합니다.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/map')}
              className="min-w-[140px] h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              지도 보기 <ArrowRight size={18} />
            </button>
            <button
              onClick={openReportModal}
              className="min-w-[140px] h-14 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/30 transition-all"
            >
              위험 신고
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  { icon: <MapPin className="text-blue-500" />, title: "안전 경로", description: "계단과 급경사를 피한 휠체어 최적화 경로를 안내합니다.", link: "지도 이동", status: "active" },
  { icon: <AlertCircle className="text-red-500" />, title: "위험 신고", description: "도로 파손이나 엘리베이터 고장을 실시간으로 공유합니다.", link: "지금 신고", status: "active", isReport: true },
  { icon: <Wrench className="text-gray-400" />, title: "수리점 찾기", description: "가까운 휠체어 급속 충전소 및 수리점 정보를 제공합니다.", link: "준비 중", status: "pending" },
  { icon: <ShieldCheck className="text-gray-400" />, title: "배리어프리", description: "휠체어 접근이 가능한 식당과 카페 정보를 확인하세요.", link: "준비 중", status: "pending" }
];

function FeatureSection() {
  const openReportModal = useUIStore((state) => state.openReportModal);
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">{feature.description}</p>
              <button
                disabled={feature.status === "pending"}
                onClick={feature.isReport ? openReportModal : () => navigate('/map')}
                className={cn(
                  "text-sm font-bold flex items-center gap-1 transition-all",
                  feature.status === "active" ? "text-blue-600 hover:gap-2" : "text-gray-400 cursor-default"
                )}
              >
                {feature.link} {feature.status === "active" && <ArrowRight size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isReportModalOpen, closeReportModal, mapCenter } = useUIStore();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main>
        <Hero />
        <FeatureSection />
      </main>
      
      {/* 5. 실시간 위험 신고 모달 전역 렌더링 */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={closeReportModal}
        lat={mapCenter.lat}
        lng={mapCenter.lng}
      />

      <footer className="py-12 border-t border-gray-100 text-center text-sm text-gray-400">
        © 2026 Modu-Gil. 수원시 휠체어 통합 내비게이션.
      </footer>
    </div>
  );
}
