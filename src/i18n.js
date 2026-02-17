"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "Agronomist AI": "Agronomist AI",
      "New Chat": "New Chat",
      Conversations: "Conversations",
      "No conversations yet": "No conversations yet",
      "Start a new chat to begin": "Start a new chat to begin",
      "Switch to Urdu": "Switch to Urdu",
      "Back to English": "Back to English",
      "Welcome to AI Agronomist": "Welcome to AI Agronomist",
      "Your intelligent agriculture assistant. Start a conversation.":
        "Your intelligent agriculture assistant. Start a conversation.",
      Send: "Send",
      "Sending.": "Sending.",
      "Type your message here.": "Type your message here.",
      "AI Agronomist is thinking.": "AI Agronomist is thinking.",
      You: "You",
      "AI Agronomist": "AI Agronomist",
      "Organic farming": "Organic farming",
      "Plant diseases": "Plant diseases",
      "Tomato fertilizer": "Tomato fertilizer",
      "Improve crop yield": "Improve crop yield",
      "Try asking:": "Try asking:",
      "Loading conversation...": "Loading conversation...",
      "Upload Images": "Upload Images",
      "Add a message (optional)...": "Add a message (optional)...",
      "You can only attach up to 4 images at once.":
        "You can only attach up to 4 images at once.",
      "Image {name} is too large. Maximum size is 5MB.":
        "Image {name} is too large. Maximum size is 5MB.",
      "{name} is not a valid image file.": "{name} is not a valid image file.",
      "Failed to process {name}": "Failed to process {name}",
      "Please analyze these images.": "Please analyze these images.",
      "Analyzing images...": "Analyzing images...",
      "Image analysis complete": "Image analysis complete",
      Error: "Error",
      "Failed to start new chat: {{error}}":
        "Failed to start new chat: {{error}}",
      "Delete Conversation": "Delete Conversation",
      'Are you sure you want to delete "{{title}}"? This action cannot be undone.':
        'Are you sure you want to delete "{{title}}"? This action cannot be undone.',
      Delete: "Delete",
      Cancel: "Cancel",
      "Delete Failed": "Delete Failed",
      "Failed to delete conversation: {{error}}":
        "Failed to delete conversation: {{error}}",
      "Authentication Required": "Authentication Required",
      "You need to be logged in to delete conversations.":
        "You need to be logged in to delete conversations.",
      OK: "OK",
      "Good response": "Good response",
      "Bad response": "Bad response",
      "Copy message": "Copy message",
      "Export chat as PDF": "Export chat as PDF",
      "Copied!": "Copied!",
      "Recording too short. Please speak for at least 1 second.": "Recording too short. Please speak for at least 1 second.",
      "No microphone found. Please connect a microphone and try again.": "No microphone found. Please connect a microphone and try again.",
      "Failed to access microphone: ": "Failed to access microphone: ",
      "Failed to transcribe audio. Please check your internet connection and try again.": "Failed to transcribe audio. Please check your internet connection and try again.",
      "Recording failed. Please try again and speak louder.": "Recording failed. Please try again and speak louder.",
    },
  },
  ur: {
    translation: {
      "Agronomist AI": "اے آئی ایگرونومسٹ",
      "New Chat": "نیا چیٹ",
      Conversations: "مکالمات",
      "No conversations yet": "ابھی تک کوئی گفتگو نہیں",
      "Start a new chat to begin": "شروع کرنے کے لیے ایک نیا چیٹ شروع کریں",
      "Switch to Urdu": "اردو میں تبدیل کریں",
      "Back to English": "انگریزی پر واپس جائیں",
      "Welcome to AI Agronomist": "اے آئی ایگرونومسٹ میں خوش آمدید",
      "Your intelligent agriculture assistant. Start a conversation.":
        "آپ کا ذہین زرعی معاون۔ گفتگو شروع کریں۔",
      Send: "بھیجیں",
      "Sending.": "بھیجا جا رہا ہے.",
      "Type your message here.": "یہاں اپنا پیغام لکھیں.",
      "AI Agronomist is thinking.": "اے آئی ایگرونومسٹ سوچ رہا ہے.",
      You: "آپ",
      "AI Agronomist": "اے آئی ایگرونومسٹ",
      "Organic farming": "نامیاتی کھیتی باڑی",
      "Plant diseases": "پودوں کی بیماریاں",
      "Tomato fertilizer": "ٹماٹر کے لیے کھاد",
      "Improve crop yield": "فصل کی پیداوار میں اضافہ کریں",
      "Try asking:": "یہ سوالات آزما کر دیکھیں:",
      "Loading conversation...": "گفتگو لوڈ ہو رہی ہے...",
      "Upload Images": "تصاویر اپ لوڈ کریں",
      "Add a message (optional)...": "پیغام شامل کریں (اختیاری)...",
      "You can only attach up to 4 images at once.":
        "آپ ایک بار میں صرف 4 تصاویر منسلک کر سکتے ہیں۔",
      "Image {name} is too large. Maximum size is 5MB.":
        "تصویر {name} بہت بڑی ہے۔ زیادہ سے زیادہ سائز 5MB ہے۔",
      "{name} is not a valid image file.":
        "{name} ایک درست تصویری فائل نہیں ہے۔",
      "Failed to process {name}": "{name} کو پروسیس کرنے میں ناکامی",
      "Please analyze these images.": "براہ کرم ان تصاویر کا تجزیہ کریں۔",
      "Analyzing images...": "تصاویر کا تجزیہ کیا جا رہا ہے...",
      "Image analysis complete": "تصویر کا تجزیہ مکمل",
      Error: "خرابی",
      "Failed to start new chat: {{error}}":
        "نیا چیٹ شروع کرنے میں ناکامی: {{error}}",
      "Delete Conversation": "گفتگو حذف کریں",
      'Are you sure you want to delete "{{title}}"? This action cannot be undone.':
        'کیا آپ واقعی "{{title}}" کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔',
      Delete: "حذف کریں",
      Cancel: "منسوخ کریں",
      "Delete Failed": "حذف ناکام ہوا",
      "Failed to delete conversation: {{error}}":
        "گفتگو حذف کرنے میں ناکامی: {{error}}",
      "Authentication Required": "تصدیق کی ضرورت ہے",
      "You need to be logged in to delete conversations.":
        "گفتگوں کو حذف کرنے کے لیے آپ کو لاگ ان ہونا ہوگا۔",
      OK: "ٹھیک ہے",
      "Good response": "اچھا جواب",
      "Bad response": "برا جواب",
      "Copy message": "پیغام کاپی کریں",
      "Export chat as PDF": "چیٹ کو PDF میں برآمد کریں",
      "Copied!": "کاپی ہو گیا!",
      "Recording too short. Please speak for at least 1 second.": "ریکارڈنگ بہت مختصر ہے۔ کم از کم 1 سیکنڈ بولیں۔",
      "No microphone found. Please connect a microphone and try again.": "کوئی مائیکروفون نہیں ملا۔ مائیکروفون منسلک کریں اور دوبارہ کوشش کریں۔",
      "Failed to access microphone: ": "مائیکروفون تک رسائی ناکام: ",
      "Failed to transcribe audio. Please check your internet connection and try again.": "آڈیو ٹرانسکرائب کرنے میں ناکام۔ اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔",
      "Recording failed. Please try again and speak louder.": "ریکارڈنگ ناکام۔ دوبارہ کوشش کریں اور زور سے بولیں۔",
    },
  },
};

i18n
  .use(LanguageDetector) // detects language from localStorage/cookie/browser
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
