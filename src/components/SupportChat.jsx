import { useEffect, useRef, useState } from "react";
import {
  FiMessageCircle,
  FiMic,
  FiPaperclip,
  FiPlus,
  FiSend,
  FiVolume2,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  APPROVED_PRODUCTS_KEY,
  COUPONS_KEY,
  ORDERS_KEY,
  readList,
} from "../data/commerceStore";
import styles from "../styles/SupportChat.module.css";

const CHATS_KEY = "shopEaseSupportChats";

function makeChat() {
  const now = Date.now();
  return {
    id: `chat-${now}`,
    title: "New conversation",
    updatedAt: now,
    messages: [{
      id: `welcome-${now}`,
      role: "bot",
      text: "أهلًا بك في ShopEase. أقدر أساعدك في المنتجات والطلبات والكوبونات.",
    }],
  };
}

function readChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
    return Array.isArray(saved) && saved.length ? saved : [makeChat()];
  } catch {
    return [makeChat()];
  }
}

function getCommerceReply(text, user) {
  const query = text.toLowerCase();

  if (/order|طلب|تتبع|شحن/.test(query)) {
    const orders = readList(ORDERS_KEY).filter(
      (order) => order.customerEmail?.toLowerCase() === user?.email?.toLowerCase()
    );
    if (!user) return "سجّل دخولك أولًا حتى أقدر أساعدك في طلباتك.";
    if (!orders.length) return "مش لاقي طلبات مسجلة لحسابك حتى الآن. تقدر تتصفح المنتجات وتكمل الطلب من السلة.";
    const latestOrder = orders[0];
    return `آخر طلب لك رقم ${latestOrder.orderNumber || latestOrder.id} وحالته ${latestOrder.status || "قيد المراجعة"}.`;
  }

  if (/coupon|promo|discount|كوبون|كوبونات|خصم/.test(query)) {
    const coupons = readList(COUPONS_KEY).filter(
      (coupon) => coupon.status?.toLowerCase() === "active"
    );
    if (!coupons.length) return "لا توجد كوبونات مفعّلة حاليًا. راجع صفحة السلة عند إضافة كوبون جديد.";
    return `الكوبونات المفعّلة: ${coupons.map((coupon) => `${coupon.code} (${coupon.type === "Percent" ? `${coupon.value}%` : `$${Number(coupon.value).toFixed(2)}`})`).join("، ")}.`;
  }

  if (/product|products|shop|منتج|منتجات|تسوق/.test(query)) {
    const products = readList(APPROVED_PRODUCTS_KEY);
    const searchTerms = query.split(/\s+/).filter((word) => word.length > 2);
    const matches = products.filter((product) =>
      searchTerms.some((word) => product.title?.toLowerCase().includes(word))
    ).slice(0, 3);
    if (matches.length) {
      return `لقيت لك: ${matches.map((product) => `${product.title} بسعر $${Number(product.price).toFixed(2)}`).join("، ")}.`;
    }
    return null;
  }

  return null;
}

async function requestAssistantReply(chat, text) {
  const messages = [
    ...chat.messages
      .filter((message) => message.text && ["user", "bot"].includes(message.role))
      .slice(-14)
      .map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.text,
      })),
    { role: "user", content: text },
  ];
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error("خادم المحادثة غير شغال. أوقف الخادم الحالي ثم شغّل npm run dev من مجلد المشروع.");
    }
    throw new Error(result.error || `Chat request failed (${response.status}).`);
  }
  if (!result.answer) throw new Error("The assistant returned an empty answer.");
  return result.answer;
}

function SupportChat() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState(readChats);
  const [activeChatId, setActiveChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [typingChatId, setTypingChatId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [notice, setNotice] = useState("");
  const imageInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];

  useEffect(() => {
    if (!activeChatId && chats[0]) setActiveChatId(chats[0].id);
  }, [activeChatId, chats]);

  useEffect(() => {
    const safeChats = chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map(({ imageUrl, ...message }) => message),
    }));
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(safeChats));
    } catch {
      setNotice("تعذر حفظ سجل المحادثات على هذا الجهاز.");
    }
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages.length, typingChatId, open]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function updateChat(chatId, transform) {
    setChats((currentChats) => currentChats.map((chat) => chat.id === chatId ? transform(chat) : chat));
  }

  function startNewChat() {
    const chat = makeChat();
    setChats((currentChats) => [chat, ...currentChats]);
    setActiveChatId(chat.id);
    setNotice("");
  }

  async function sendMessage(event) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && !selectedImage) return;

    const chatId = activeChat.id;
    const userMessage = {
      id: `message-${Date.now()}`,
      role: "user",
      text: text || "Can you help me with this image?",
      imageUrl: selectedImage?.url,
    };
    updateChat(chatId, (chat) => ({
      ...chat,
      title: chat.title === "New conversation" ? (text || "Image question").slice(0, 32) : chat.title,
      updatedAt: Date.now(),
      messages: [...chat.messages, userMessage],
    }));

    setDraft("");
    setSelectedImage(null);
    setNotice("");
    setTypingChatId(chatId);

    try {
      const reply = userMessage.imageUrl
        ? "وصلت الصورة. أقدر أجاوب عن أسئلتك، لكن تحليل محتوى الصور غير متاح حاليًا."
        : getCommerceReply(text, user) || await requestAssistantReply(activeChat, text);
      updateChat(chatId, (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [...chat.messages, {
          id: `reply-${Date.now()}`,
          role: "bot",
          text: reply,
        }],
      }));
    } catch (error) {
      updateChat(chatId, (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: [...chat.messages, {
          id: `reply-${Date.now()}`,
          role: "bot",
          text: error.message.includes("GROQ_API_KEY")
            ? "المساعد الذكي غير مفعّل. أضف GROQ_API_KEY في ملف .env.local ثم أعد تشغيل التطبيق."
            : error.message,
        }],
      }));
    } finally {
      setTypingChatId((currentId) => currentId === chatId ? null : currentId);
    }
  }

  function attachImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("اختار ملف صورة فقط.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice("حجم الصورة يجب أن يكون 5 ميجابايت أو أقل.");
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    setSelectedImage({ name: file.name, url });
    setNotice("");
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice("الإملاء الصوتي غير مدعوم في هذا المتصفح.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ar" ? "ar-EG" : "en-US";
    recognition.onresult = (event) => {
      setDraft((currentDraft) => `${currentDraft} ${event.results[0][0].transcript}`.trim());
      setNotice("");
    };
    recognition.onerror = () => setNotice("تعذر التقاط الصوت. تحقق من صلاحية الميكروفون.");
    recognition.start();
  }

  function speakLastReply() {
    const lastReply = [...activeChat.messages].reverse().find((message) => message.role === "bot");
    if (!lastReply || !window.speechSynthesis) {
      setNotice("قراءة الرد صوتيًا غير مدعومة في هذا المتصفح.");
      return;
    }
    const speech = new SpeechSynthesisUtterance(lastReply.text);
    speech.lang = /[\u0600-\u06FF]/.test(lastReply.text) ? "ar-EG" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  return (
    <div className={styles.widget}>
      {open && (
        <section className={styles.panel} aria-label="ShopEase support chat" dir={lang === "ar" ? "rtl" : "ltr"}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.statusDot} />
              <div><strong>ShopEase support</strong><small>Product and order help</small></div>
            </div>
            <div className={styles.headerActions}>
              <button type="button" title="New conversation" aria-label="New conversation" onClick={startNewChat}><FiPlus /></button>
              <button type="button" title="Close chat" aria-label="Close chat" onClick={() => setOpen(false)}><FiX /></button>
            </div>
          </header>

          <div className={styles.body}>
            <aside className={styles.history} aria-label="Conversations">
              {chats.map((chat) => (
                <button key={chat.id} type="button" className={chat.id === activeChat.id ? styles.activeChat : ""} onClick={() => setActiveChatId(chat.id)} title={chat.title}>
                  {chat.title}
                </button>
              ))}
            </aside>

            <div className={styles.conversation}>
              <div className={styles.messages}>
                {activeChat.messages.map((message) => (
                  <article key={message.id} className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.botMessage}`}>
                    <div className={styles.bubble}>
                      {message.imageUrl && <img className={styles.attachment} src={message.imageUrl} alt="Attached image" />}
                      <p>{message.text}</p>
                    </div>
                  </article>
                ))}
                {typingChatId === activeChat.id && <p className={styles.typing}>ShopEase is replying…</p>}
                <div ref={messagesEndRef} />
              </div>

              {notice && <p className={styles.notice} role="status">{notice}</p>}
              {selectedImage && <div className={styles.preview}><img src={selectedImage.url} alt="Selected attachment" /><span>{selectedImage.name}</span><button type="button" aria-label="Remove image" onClick={() => setSelectedImage(null)}><FiX /></button></div>}
              <form className={styles.composer} onSubmit={sendMessage}>
                <input ref={imageInputRef} className={styles.hiddenInput} type="file" accept="image/*" onChange={attachImage} />
                <button type="button" className={styles.iconButton} title="Attach an image" aria-label="Attach an image" onClick={() => imageInputRef.current?.click()}><FiPaperclip /></button>
                <button type="button" className={styles.iconButton} title="Voice input" aria-label="Voice input" onClick={startVoiceInput}><FiMic /></button>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) sendMessage(event); }} placeholder="اكتب رسالتك..." rows="1" aria-label="Message" />
                <button type="submit" className={styles.sendButton} title="Send message" aria-label="Send message" disabled={!draft.trim() && !selectedImage}><FiSend /></button>
              </form>
              <button type="button" className={styles.speakButton} onClick={speakLastReply}><FiVolume2 /> Read latest reply</button>
            </div>
          </div>
        </section>
      )}

      <button type="button" className={styles.launcher} aria-label={open ? "Close support chat" : "Open support chat"} title="ShopEase support" onClick={() => setOpen((isOpen) => !isOpen)}>
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}

export default SupportChat;
