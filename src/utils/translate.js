export const translations = {
  en: {
    you: "You",
    ai: "AI Agronomist",
    typing: "AI Agronomist is thinking...",
    send: "Send",
    sending: "Sending...",
    placeholder: "Type your message here...",
    welcome: "Welcome to AI Agronomist",
    intro: "Your intelligent agriculture assistant. Start a conversation...",
  },
  ur: {
    you: "آپ",
    ai: "اے آئی ایگرونومسٹ",
    typing: "اے آئی ایگرونومسٹ سوچ رہا ہے...",
    send: "بھیجیں",
    sending: "بھیجا جا رہا ہے...",
    placeholder: "یہاں اپنا پیغام لکھیں...",
    welcome: "اے آئی ایگرونومسٹ میں خوش آمدید",
    intro: "آپ کا ذہین زرعی معاون۔ گفتگو شروع کریں...",
  },
};

export function t(key, lang = "en") {
  return translations[lang][key] || key;
}