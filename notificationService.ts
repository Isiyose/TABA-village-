const sanitizePhone = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // If it starts with 0, replace with 250 (assuming Rwanda default)
  if (cleaned.startsWith('0')) {
    return '+250' + cleaned.substring(1);
  }
  // If it doesn't start with +, add it
  if (!phone.startsWith('+')) {
    return '+' + cleaned;
  }
  return phone;
};

export const sendSMS = async (to: string, message: string) => {
  try {
    const sanitizedTo = sanitizePhone(to);
    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: sanitizedTo, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send SMS');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

export const sendUmugandaReminder = async (citizen: { firstName: string, phone?: string }, date: string) => {
  const message = `Hello ${citizen.firstName}, this is a reminder for the upcoming Umuganda on ${date}. Please join your community at the designated location.`;
  
  if (citizen.phone) {
    return await sendSMS(citizen.phone, message);
  }
  return { success: false, error: 'No phone number' };
};

export const sendInsuranceReminder = async (citizen: { firstName: string, phone?: string }, expiryDate: string) => {
  const message = `Hello ${citizen.firstName}, your health insurance is set to expire on ${expiryDate}. Please visit the cell office or use the online portal to renew it.`;
  
  if (citizen.phone) {
    return await sendSMS(citizen.phone, message);
  }
  return { success: false, error: 'No phone number' };
};
