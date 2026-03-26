import React, { useState } from 'react';
import { AlertCircle, X, Camera, Send, ShieldAlert, Construction, AlertTriangle, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

/**
 * ReportModal
 * 휠체어 사용자를 위한 접근성 장애물 실시간 신고 모달 (PRD 3.1, 5.1)
 */
export default function ReportModal({ isOpen, onClose, lat, lng }) {
  const [type, setType] = useState('stairs');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const dangerTypes = [
    { id: 'stairs', label: '계단/장벽', icon: AlertCircle, color: 'blue' },
    { id: 'construction', label: '공사/폐쇄', icon: Construction, color: 'orange' },
    { id: 'steep_slope', label: '가파른 경사', icon: ShieldAlert, color: 'yellow' },
    { id: 'elevator_broken', label: 'E/V 고장', icon: AlertTriangle, color: 'red' },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/api/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      alert("신고가 소중하게 접수되었습니다!");
      onClose();
      // 초기화
      setType('stairs');
      setSeverity(3);
      setDescription('');
      setSelectedImage(null);
      setPreview(null);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || "알 수 없는 오류가 발생했습니다.";
      alert(`신고 제출에 실패했습니다: ${errorMsg}`);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. 사진 필수 체크 (회장님 요청)
    if (!selectedImage) {
        return alert("보다 정확한 정보 공유를 위해 현장 사진을 업로드해 주세요!");
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('severity', severity);
    formData.append('description', description);
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    formData.append('image', selectedImage);
    
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShieldAlert size={22} className="text-white/80" />
                    실시간 위험 신고
                </h2>
                <p className="text-xs text-white/70 mt-1">회장님, 현재 위치의 위험 요소를 공유해 주세요.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* 위험 유형 선택 */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700">장애물 유형</p>
            <div className="grid grid-cols-2 gap-3">
              {dangerTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    type === t.id 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <t.icon size={20} className={type === t.id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={`text-sm font-semibold ${type === t.id ? 'text-blue-700' : 'text-gray-600'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 위험도 슬라이더 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-gray-700">심각도 (레벨 {severity})</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    severity >= 4 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                    {severity >= 5 ? '가장 위험' : severity >= 3 ? '보통' : '약함'}
                </span>
            </div>
            <input 
              type="range" 
              min="1" max="5" 
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* 설명 입력 */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700">현장 설명 (선택)</p>
            <textarea
              placeholder="다른 분들을 위해 상황을 자세히 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px] transition-all"
            />
          </div>

          {/* 사진 업로드 */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700">현장 사진</p>
            <div className="flex gap-4">
                <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all text-gray-400">
                    <Camera size={24} />
                    <span className="text-[10px] font-bold">사진 추가</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {preview && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <button 
                            type="button"
                            onClick={() => { setSelectedImage(null); setPreview(null); }}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>
          </div>

        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button
                type="submit"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
            >
                {mutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Send size={18} />
                        <span>전국 실시간 전파하기</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
