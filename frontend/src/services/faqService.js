import { apiFetch } from './api';

const faqService = {
  async sendMessage(message) {
    const response = await apiFetch('/faq/message', {
      method: 'POST',
      body: { message },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, error: data.error || 'Failed to send message', status: response.status };
  },

  async getQuickReplies() {
    const response = await apiFetch('/faq/quick-replies', {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, quickReplies: data.quickReplies };
    }

    return { success: false, error: data.error || 'Failed to fetch quick replies', status: response.status };
  }
};

export default faqService;
