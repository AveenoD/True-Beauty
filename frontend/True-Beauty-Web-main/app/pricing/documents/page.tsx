'use client';

import { useState, useEffect, useRef } from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  type: 'business' | 'identity' | 'financial';
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  uploadDate?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'business-registration',
      name: 'Business Registration Certificate',
      type: 'business',
      required: true,
      uploaded: false
    },
    {
      id: 'gst-certificate',
      name: 'GST Certificate',
      type: 'business',
      required: true,
      uploaded: false
    },
    {
      id: 'pan-card',
      name: 'PAN Card',
      type: 'identity',
      required: true,
      uploaded: false
    },
    {
      id: 'aadhar-card',
      name: 'Aadhar Card',
      type: 'identity',
      required: true,
      uploaded: false
    },
    {
      id: 'bank-statement',
      name: 'Recent Bank Statement',
      type: 'financial',
      required: false,
      uploaded: false
    }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    const plan = localStorage.getItem('selectedPlan') || 'Professional';
    setSelectedPlan(plan);
    
    const addons = localStorage.getItem('selectedAddons');
    if (addons) {
      setSelectedAddons(JSON.parse(addons));
    }
  }, []);

  const handleFileSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedDocumentId) return;
    
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate API call
    setTimeout(() => {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocumentId
          ? {
              ...doc,
              uploaded: true,
              fileName: file.name,
              uploadDate: new Date().toISOString()
            }
          : doc
      ));
      
      setSelectedDocumentId(null);
    }, 2500);
    
    e.target.value = '';
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId
        ? { ...doc, uploaded: false, fileName: undefined, uploadDate: undefined }
        : doc
    ));
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'business': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'identity': return <FileText className="w-5 h-5 text-green-500" />;
      case 'financial': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'business': return 'Business Documents';
      case 'identity': return 'Identity Documents';
      case 'financial': return 'Financial Documents';
      default: return 'Other Documents';
    }
  };

  const getUploadedCount = () => documents.filter(doc => doc.uploaded).length;
  const getTotalRequired = () => documents.filter(doc => doc.required).length;
  const isAllRequiredUploaded = () => getUploadedCount() >= getTotalRequired();

  const handleContinue = () => {
    const uploadedDocs = documents.filter(doc => doc.uploaded);
    localStorage.setItem('uploadedDocuments', JSON.stringify(uploadedDocs));
    window.location.href = '/pricing/payment';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-purple-50/30 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link href="/pricing/addons" className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" aria-label="Back to add-ons">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-playfair font-bold text-gray-800">Upload Required Documents</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Please provide the necessary documents for your {selectedPlan} subscription</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Document Upload Progress</h3>
              <span className="text-sm font-medium text-gray-600">
                {getUploadedCount()} of {getTotalRequired()} required documents
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-rose-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(getUploadedCount() / getTotalRequired()) * 100}%` }}
              ></div>
            </div>
            
            {isAllRequiredUploaded() ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All required documents uploaded!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Please upload all required documents</span>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-gray-100">
            <div className="space-y-6 sm:space-y-8">
              {['business', 'identity', 'financial'].map(type => {
                const docsOfType = documents.filter(doc => doc.type === type);
                if (docsOfType.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      {getDocumentIcon(type)}
                      {getDocumentTypeLabel(type)}
                    </h3>
                    
                    <div className="space-y-4">
                      {docsOfType.map((doc) => (
                        <div key={doc.id} className="border border-gray-200 rounded-xl p-4 sm:p-6">
                          <div className="block">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="text-base sm:text-lg font-medium text-gray-800">{doc.name}</h4>
                              {doc.required && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full shrink-0">
                                  Required
                                </span>
                              )}
                            </div>
                            
                            {doc.uploaded ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="text-green-700 font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                                    <p className="text-green-600 text-xs sm:text-sm mt-0.5">
                                      Uploaded on {new Date(doc.uploadDate || '').toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeDocument(doc.id)}
                                  className="self-start sm:self-center text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                                  aria-label="Remove document"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="mt-3">
                                <button
                                  onClick={() => handleFileSelect(doc.id)}
                                  disabled={isUploading && selectedDocumentId === doc.id}
                                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg hover:opacity-95 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                >
                                  <Upload className="w-4 h-4 shrink-0" />
                                  {isUploading && selectedDocumentId === doc.id ? 'Uploading...' : 'Upload Document'}
                                </button>
                                
                                {isUploading && selectedDocumentId === doc.id && (
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                      ></div>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/pricing/addons"
              className="w-full sm:flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Back to Add-ons
            </Link>
            
            <button
              onClick={handleContinue}
              disabled={!isAllRequiredUploaded()}
              className="w-full sm:flex-1 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 px-6 rounded-lg font-medium hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Proceed to Payment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}