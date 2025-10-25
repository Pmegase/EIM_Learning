import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

// ---- Types --------------------------------------------------------------

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;          // name used to choose an icon in the UI
  link?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  image: string;
  linkedin?: string;
  role?: string;
}

export interface ContactInfo {
  address: string;
  email: string;
  instagram: string;
  facebook: string;
  phone?: string;
}

export interface ContentData {
  heroTexts: string[];
  services: Service[];
  vision: string;
  mission: string;
  aboutUs: string;
  teamMembers: TeamMember[];
  carouselImages: string[];
  contactInfo: ContactInfo;
}

interface ContentContextType {
  content: ContentData;
  loading: boolean;
  updateContent: (patch: Partial<ContentData>) => Promise<ContentData>;
  uploadImage: (file: File) => Promise<string>;
  refetch: () => Promise<void>;
}

// ---- Defaults (used until API loads, and as fallback when API omits keys) --

const defaultContent: ContentData = {
  heroTexts: [
    'Advance your skills with us',
    'Get connected with a Global Mentor',
    'Advance your professional skill set and learn new things.',
  ],
  services: [
    {
      id: '1',
      title: 'Student internship program',
      description:
        'We provide students with out-of-classroom trainings, mentorship and direct industry experience.',
      icon: 'graduation-cap',
    },
    {
      id: '2',
      title: 'Mentorship Program',
      description:
        'Our interns are paired with mentors from across the globe who guide them to ensure organizational growth.',
      icon: 'users',
    },
    {
      id: '3',
      title: 'Professional trainings',
      description:
        'High-end trainings for employees to keep them updated with growing industry trends.',
      icon: 'briefcase',
    },
    {
      id: '4',
      title: 'Courses',
      description:
        'Personal Branding, Public Speaking, CV writing, Opportunity identification, Minute Writing, Basic Excel Skills.',
      icon: 'book',
    },
  ],
  vision:
    "To be the first-choice Student Consultancy in Africa that bridges the gap between employers and students, and provides out-of-classroom employability skills to reduce unemployment.",
  mission:
    "To provide a platform that facilitates youth leadership, unearths the potential of African youth, and creates an accountable networking space for the continent's transformation.",
  aboutUs:
    'E.I.M Learning and Development Consult is a management consultancy providing corporate institutions with well qualified and professional interns. Our global mentorship programs, self-development workshops, internship programs, and accountability partnerships support both students and partner organizations.',
  teamMembers: [
    {
      id: '1',
      name: 'Paulina Osei Megase',
      image: '/lovable-uploads/754ba608-8f59-43cc-9e98-817c6d80faac.png',
      linkedin: 'https://www.linkedin.com/in/paulina-megase-820a2595/',
      role: 'Founder',
    },
  ],
  carouselImages: [
    '/lovable-uploads/71dde14e-5105-4dd2-ba93-df4d27be3326.png',
    '/lovable-uploads/754ba608-8f59-43cc-9e98-817c6d80faac.png',
    '/lovable-uploads/f448dfc5-c8f8-41cf-a5a2-cd29fa41ac04.png',
  ],
  contactInfo: {
    address: 'Accra',
    email: 'eimconsultld@gmail.com',
    instagram: 'eimldconsult',
    facebook: 'EIM Learning and Development Consult',
    phone: '',
  },
};

// ---- Context ------------------------------------------------------------

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Utility that merges API data into defaults without losing arrays/objects
function mergeContent(prev: ContentData, incoming: Partial<ContentData>): ContentData {
  return {
    ...prev,
    ...incoming,
    heroTexts: incoming.heroTexts ?? prev.heroTexts,
    services: incoming.services ?? prev.services,
    vision: incoming.vision ?? prev.vision,
    mission: incoming.mission ?? prev.mission,
    aboutUs: incoming.aboutUs ?? prev.aboutUs,
    teamMembers: incoming.teamMembers ?? prev.teamMembers,
    carouselImages: incoming.carouselImages ?? prev.carouselImages,
    contactInfo: {
      ...prev.contactInfo,
      ...(incoming.contactInfo ?? {}),
    },
  };
}

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<ContentData>(defaultContent);
  const [loading, setLoading] = useState<boolean>(true);

  const refetch = async () => {
    try {
      const data = await apiClient.get<Partial<ContentData>>(API_ENDPOINTS.CONTENT.BASE);
      setContent((prev) => mergeContent(prev, data ?? {}));
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateContent = async (patch: Partial<ContentData>) => {
    const server = await apiClient.put<Partial<ContentData>>(API_ENDPOINTS.CONTENT.BASE, patch);
    setContent((prev) => mergeContent(prev, server ?? patch));
    return mergeContent(content, server ?? patch);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('image', file);
    const res = await apiClient.upload<{ imageUrl: string }>(API_ENDPOINTS.CONTENT.UPLOAD, form);
    return res.imageUrl;
  };

  const value = useMemo<ContentContextType>(
    () => ({ content, loading, updateContent, uploadImage, refetch }),
    [content, loading]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within a ContentProvider');
  return ctx;
};
