import axios from 'axios';
import { Email, EmailCategory } from '../types/email';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

interface EmailFilters {
  query?: string;
  folder?: string;
  category?: string;
}

export const fetchEmails = async (filters: EmailFilters): Promise<Email[]> => {
  const { data } = await api.get('/emails', { params: filters });
  return data;
};

export const fetchEmailById = async (emailId: string): Promise<Email> => {
  const { data } = await api.get(`/emails/${emailId}`);
  return data;
};

export const updateEmailCategory = async (emailId: string, category: EmailCategory): Promise<void> => {
  await api.post(`/emails/${emailId}/category`, { category });
};

export const generateReply = async (emailId: string, context: string): Promise<{ reply: string }> => {
  const { data } = await api.post(`/emails/${emailId}/suggest-reply`, { context });
  return data;
}; 