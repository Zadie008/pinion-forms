import type { BannerOption } from './constants/banners';

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'signature';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: QuestionOption[]; 
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  adminEmail: string;
  banner: BannerOption | null; 
  questions: Question[];
  updatedAt: string;
}

export interface ResponseAnswer {
  questionId: string;
  value: string | string[]; 
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: ResponseAnswer[];
}