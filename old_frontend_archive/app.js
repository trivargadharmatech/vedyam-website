// Vedyam AI Learning Mode Simulator Logic

// Mock Database Structure
const db = {
  topics: [
    { id: "understanding-ramayana", title: "Understanding the Ramayana", category: "Life Topics", tags: ["ramayana", "valmiki", "symbolism"] },
    { id: "self", title: "Self", category: "Life Topics", tags: ["confidence", "resilience", "purpose"] },
    { id: "relationships", title: "Relationships", category: "Life Topics", tags: ["hospitality", "devotion", "service"] },
    { id: "leadership", title: "Leadership", category: "Life Topics", tags: ["strategy", "sacrifice", "responsibility"] },
    { id: "ethics-society", title: "Ethics and Society", category: "Life Topics", tags: ["dharma", "justice", "society"] },
    { id: "nature-existence", title: "Nature and Existence", category: "Life Topics", tags: ["nature", "harmony", "stewardship"] },
    { id: "birth-shree-ram", title: "Birth of Shree Ram", category: "Incarnations", tags: ["ram", "birth", "divine", "satyuga"] },
    { id: "childhood-krishna", title: "Childhood of Krishna", category: "Leelas", tags: ["krishna", "childhood", "yashoda", "gokul"] },
    { id: "ramayana-intro", title: "Ramayana Introduction", category: "Epics", tags: ["valmiki", "ramayana", "epic", "maryada"] },
    { id: "gita-chapter-1", title: "Bhagavad Gita Chapter 1", category: "Philosophy", tags: ["gita", "arjuna", "kurukshetra", "dharma"] }
  ],
  
  audios: [
    { id: "a1", topicId: "birth-shree-ram", title: "The Cosmic Alignment of Ram's Birth", description: "Exploring the astrological conditions and significance of Ram Navami.", tags: ["astrology", "cosmic", "birth"], duration: "12:45", audioUrl: "https://example.com/audio/ram-birth-alignment.mp3" },
    { id: "a2", topicId: "birth-shree-ram", title: "Bhajan: Ram Janma Stuti", description: "Traditional Sanskrit stuti sung during Ram Navami celebrations.", tags: ["bhajan", "chants", "devotion"], duration: "05:12", audioUrl: "https://example.com/audio/ram-stuti.mp3" },
    { id: "a3", topicId: "childhood-krishna", title: "The Butter Thief: Makhan Chor Leela", description: "Narrative reading of Sri Krishna stealing butter and its philosophical meaning.", tags: ["gokul", "butter", "childhood"], duration: "08:30", audioUrl: "https://example.com/audio/krishna-butter.mp3" },
    { id: "a4", topicId: "ramayana-intro", title: "The Significance of Valmiki's Verses", description: "How the first shloka was born out of grief and compassion.", tags: ["poetry", "valmiki", "origin"], duration: "15:20", audioUrl: "https://example.com/audio/valmiki-shloka.mp3" },
    { id: "a5", topicId: "gita-chapter-1", title: "The Grief of Arjuna", description: "Understanding the psychological breakdown of Arjuna on the battlefield.", tags: ["psychology", "arjuna", "melancholy"], duration: "18:10", audioUrl: "https://example.com/audio/arjuna-grief.mp3" }
  ],

  videos: [
    { id: "v1", topicId: "birth-shree-ram", title: "Visual Story: The Birth of Shree Ram", description: "Animated rendition of King Dasharatha's Yajna and the birth of Ram.", tags: ["animation", "story", "dasharatha"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400" },
    { id: "v2", topicId: "childhood-krishna", title: "Krishna and Kaliya Nagan Leela", description: "Cinematic animation of Krishna conquering the serpent Kaliya in Yamuna.", tags: ["serpent", "yamuna", "kaliya"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&q=80&w=400" },
    { id: "v3", topicId: "ramayana-intro", title: "Ramayana: The Eternal Journey", description: "Documentary mapping the geographic route of Shree Ram's travels.", tags: ["documentary", "history", "geography"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&q=80&w=400" },
    { id: "v4", topicId: "gita-chapter-1", title: "Kurukshetra: Setting the Scene", description: "A detailed visual walkthrough of the armies standing in Kurukshetra.", tags: ["battlefield", "mahabharata", "history"], videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400" }
  ],

  explanations: {
    "birth-shree-ram": {
      intro: "Shree Ram, the seventh incarnation of Lord Vishnu, was born in Ayodhya to King Dasharatha and Queen Kausalya in Treta Yuga. His birth represents the descent of absolute righteousness (Dharma) onto the earthly plane.",
      narrative: "After King Dasharatha performed the Putrakameshthi Yajna (a sacrifice for obtaining sons), a divine being emerged from the fire holding a bowl of payasam (sacred pudding). The pudding was distributed to the three queens. In due course, Queen Kausalya gave birth to Shree Ram on Navami tithi of Chaitra month. The skies cleared, celestial beings showered flowers, and the earth rejoiced in the arrival of the Maryada Purushottama.",
      context: "Ayodhya was plagued by the tyranny of Ravana, the demon king of Lanka, who had secured boons making him invincible to gods, demons, and celestial beings. However, Ravana, in his arrogance, had left out humans. Thus, Lord Vishnu took a human form to restore balance and defeat the forces of adharma.",
      takeaways: [
        "Human Form, Divine Virtues: Ultimate truth can reside in simple human existence.",
        "Purity of Action: The birth was preceded by prayer, sacrifice, and deep devotion.",
        "Astrological Harmony: Ram Navami represents peak cosmic alignment and spiritual radiance."
      ],
      summary: "The birth of Shree Ram is not just an event, but a promise of protection to humanity, showing that righteousness will eventually triumph over chaotic and selfish forces."
    },
    "childhood-krishna": {
      intro: "Lord Krishna, the eighth avatar of Lord Vishnu, spent his early childhood in the pastoral villages of Gokul and Vrindavan. His childhood is filled with playful deeds (Leelas) that hold profound philosophical concepts.",
      narrative: "Born in a prison cell in Mathura, Krishna was miraculously carried across the raging Yamuna river by his father Vasudeva to save him from the tyrant King Kansa. He was raised by Nanda and Yashoda in Gokul. As a toddler, Krishna won the hearts of the cowherds (Gopis and Gopas) by stealing butter, playing his enchanting flute, and performing divine miracles like lifting the Govardhan hill on his little finger to protect his village from torrential rains.",
      context: "While Shree Ram represents adherence to rules (Maryada), Krishna represents the playfulness of the cosmos (Lila). His childhood actions demonstrated that divine love is accessible to all, breaking through rigid orthodox boundaries.",
      takeaways: [
        "Unconditional Love: The Gopis loved Krishna not for his power, but for his divine, sweet essence (Madhurya).",
        "Protection of the Devout: Lifting Govardhan symbolizes that God shelters those who surrender to Him.",
        "Detachment: Krishna played with butter (worldly items) but remained completely pure and free."
      ],
      summary: "Krishna's childhood teaches us to approach life with joy, love, and a playful heart, highlighting that spiritual liberation can be achieved through pure devotion (Bhakti)."
    },
    "ramayana-intro": {
      intro: "The Ramayana, composed by Sage Valmiki, is one of the two major epics of ancient India. Written in Sanskrit, it details the life, exile, and victory of Prince Ram over the demon king Ravana.",
      narrative: "Valmiki, inspired by a divine query to Sage Narada about the ideal human, composed the epic in 24,000 verses divided into seven books (Kandas). It details Ram's ideal childhood, his marriage to Sita, his exile to the forest for 14 years to fulfill his father's vow, the abduction of Sita by Ravana, the alliance with Sugriva and Hanuman, and the final war in Lanka leading to Ram's return to Ayodhya.",
      context: "The Ramayana is considered the 'Adi Kavya' (the first poem). It was written to set a template for ideal human relationships: the ideal son, brother, wife, king, and devotee.",
      takeaways: [
        "Dharma First: Duty and honor take precedence over personal desires.",
        "Devotion of Hanuman: Selfless service (Seva) can elevate a devotee to a divine state.",
        "Inevitability of Karma: Actions have consequences, even for kings and gods."
      ],
      summary: "Ramayana is a timeless guide to moral behavior, illustrating how an individual can walk the path of righteousness despite facing extreme adversity."
    },
    "gita-chapter-1": {
      intro: "The Bhagavad Gita begins on the battlefield of Kurukshetra, where the great Pandava warrior Arjuna faces his own teachers, relatives, and friends in a war for righteousness. Chapter 1 sets the stage of human conflict and existential despair.",
      narrative: "As the conch shells blow to signal the start of the Mahabharata war, Arjuna asks his charioteer, Lord Krishna, to position their chariot between the two armies. Seeing his beloved grandfather Bhishma and teacher Drona on the opposing side, Arjuna is overcome with grief. His bow Gandiva slips from his hand, his skin burns, and he collapses, refusing to fight. This chapter represents the 'Yoga of Arjuna's Despair'.",
      context: "Arjuna's breakdown represents the universal human dilemma when faced with difficult duties. He faces a conflict between personal attachment (Moha) and higher ethical duty (Dharma).",
      takeaways: [
        "Despair as a Starting Point: Crisis is often the beginning of spiritual awakening and enquiry.",
        "Danger of Attachment: Blind emotional attachment clouding rational judgment leads to paralysis.",
        "The Charioteer Within: Turning to a mentor or higher consciousness (Krishna) is key to navigating conflicts."
      ],
      summary: "Chapter 1 highlights the confusion and sorrow that arise when we view the world through the lens of ego and attachment, preparing us for the wisdom Krishna imparts in subsequent chapters."
    }
  },

  quizzes: {
    "birth-shree-ram": [
      {
        type: "mcq",
        question: "Who was the mother of Shree Ram?",
        options: ["Kaikeyi", "Kausalya", "Sumitra", "Gandhari"],
        answer: 1
      },
      {
        type: "tf",
        question: "True or False: Shree Ram was born in the Dwapara Yuga.",
        options: ["True", "False"],
        answer: 1 // False (Treta Yuga)
      },
      {
        type: "fill",
        question: "Shree Ram was born in the ancient city of __________.",
        answer: "ayodhya"
      }
    ],
    "childhood-krishna": [
      {
        type: "mcq",
        question: "Which hill did Lord Krishna lift on his finger to protect the villagers?",
        options: ["Kailash Hill", "Govardhan Hill", "Himalaya Hill", "Vindhya Hill"],
        answer: 1
      },
      {
        type: "tf",
        question: "True or False: Krishna was raised by Yashoda and Nanda in Gokul.",
        options: ["True", "False"],
        answer: 0
      },
      {
        type: "fill",
        question: "To escape the tyrant King Kansa, Krishna was carried across the river __________.",
        answer: "yamuna"
      }
    ],
    "ramayana-intro": [
      {
        type: "mcq",
        question: "Who is the legendary composer of the Ramayana epic?",
        options: ["Sage Vyasa", "Sage Valmiki", "Sage Vashistha", "Sage Vishwamitra"],
        answer: 1
      },
      {
        type: "tf",
        question: "True or False: The Ramayana contains seven Kandas (books).",
        options: ["True", "False"],
        answer: 0
      },
      {
        type: "fill",
        question: "The Ramayana is composed of __________ thousand verses.",
        answer: "24"
      }
    ],
    "gita-chapter-1": [
      {
        type: "mcq",
        question: "What is the name of Arjuna's legendary bow that slips from his hand?",
        options: ["Pinaka", "Gandiva", "Vijaya", "Sharanga"],
        answer: 1
      },
      {
        type: "tf",
        question: "True or False: Chapter 1 of the Gita is known as Arjuna Vishada Yoga.",
        options: ["True", "False"],
        answer: 0
      },
      {
        type: "fill",
        question: "The battle of the Bhagavad Gita was fought on the holy field of __________.",
        answer: "kurukshetra"
      }
    ]
  },

  scopedQA: {
    "birth-shree-ram": [
      { keywords: ["parent", "father", "mother", "born to"], answer: "Shree Ram was born to King Dasharatha and Queen Kausalya. His step-mothers were Kaikeyi and Sumitra." },
      { keywords: ["yajna", "sacrifice", "pudding", "payasam"], answer: "King Dasharatha performed the Putrakameshthi Yajna, a sacred fire sacrifice, to obtain sons. The divine agent from the fire gave him payasam which was shared among his wives." },
      { keywords: ["why", "reason", "purpose", "ravana"], answer: "The purpose of Ram's incarnation was to defeat the demon king Ravana of Lanka, who held boons protecting him from gods but not from mortal humans. Ram came to restore righteousness (Dharma)." },
      { keywords: ["siblings", "brother", "lakshmana", "bharata", "shatrughna"], answer: "Shree Ram had three brothers: Lakshmana and Shatrughna (born to Sumitra), and Bharata (born to Kaikeyi)." }
    ],
    "childhood-krishna": [
      { keywords: ["birth", "born", "mother", "father"], answer: "Krishna was born to Devaki and Vasudeva in a prison in Mathura. He was miraculously exchanged and raised by Yashoda and Nanda in Gokul." },
      { keywords: ["butter", "steal", "makhan"], answer: "Krishna is famously called 'Makhan Chor' (Butter Thief). Philosophically, butter represents the cream of human devotion, and Krishna stealing it symbolizes the divine attracting and accepting pure devotion." },
      { keywords: ["govardhan", "hill", "rain", "indra"], answer: "When Lord Indra flooded Vrindavan with torrential rains out of pride, Krishna lifted the Govardhan Hill on his little finger for seven days to shelter all people and animals, teaching them to worship nature and surrender to divine protection." },
      { keywords: ["kansa", "uncle", "demon"], answer: "King Kansa of Mathura was Krishna's maternal uncle. Kansa imprisoned Devaki because a prophecy foretold her eighth son would destroy him. Krishna eventually defeated Kansa." }
    ],
    "ramayana-intro": [
      { keywords: ["author", "wrote", "composer"], answer: "The Ramayana was composed by Sage Valmiki, who is honored as the 'Adi Kavi' (the first poet) in Sanskrit literature." },
      { keywords: ["how many", "chapters", "books", "kanda"], answer: "The epic is divided into 7 Kandas (books): Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, and Uttara Kandas, spanning 24,000 verses." },
      { keywords: ["sita", "wife"], answer: "Sita is the wife of Shree Ram, born of Mother Earth and adopted by King Janaka of Mithila. She represents the ideal wife, embodying strength, virtue, and devotion." },
      { keywords: ["hanuman", "devotee"], answer: "Hanuman is a powerful monkey deity and an ardent devotee of Shree Ram. He played a critical role in finding Sita in Lanka and helping Ram win the war." }
    ],
    "gita-chapter-1": [
      { keywords: ["battle", "war", "where", "field"], answer: "The dialogue takes place on the battlefield of Kurukshetra, right before the start of the Mahabharata war between the Pandavas and Kauravas." },
      { keywords: ["why", "refuse", "arjuna", "sad", "despair"], answer: "Arjuna is filled with despair (Vishada) because he realizes he has to fight and kill his own relatives, teachers (like Drona), and grandfather (Bhishma) for a kingdom. He is caught in a moral conflict." },
      { keywords: ["krishna", "role", "driver", "chariot"], answer: "Lord Krishna acts as Arjuna's charioteer (Parthasarathy). In Chapter 1, his main action is placing the chariot in the middle of the two armies and urging Arjuna to look at his opponents." },
      { keywords: ["bow", "gandiva"], answer: "Arjuna's bow is called Gandiva. Due to anxiety and grief, his body trembles and the Gandiva slips from his hands." }
    ]
  },

  forwardQuestioning: {
    "birth-shree-ram": [
      "Why do you think Lord Vishnu chose to take a human form, complete with human limitations, rather than descending as an all-powerful deity?",
      "King Dasharatha performed a massive sacrifice (Yajna) before Ram's birth. How does this symbolize that major achievements require preparation and sacrifice?",
      "In modern society, we face conflicts between rules and compassion. In what ways can the story of Shree Ram's birth help us understand our duties (Dharma) today?",
      "If you were to compare Ram's birth story with other epics you know, what universal messages of hope do you find common among them?"
    ],
    "childhood-krishna": [
      "Why do you think Krishna's 'butter stealing' is celebrated so lovingly by devotees, rather than being viewed as a simple misdemeanor?",
      "Lifting Govardhan Hill represents protecting the community from external challenges. What is a 'Govardhan Hill' that you feel we need to lift in our communities today?",
      "Yashoda loved Krishna as a son, unaware of his cosmic power. What does this tell us about the power of maternal love compared to intellectual knowledge?",
      "Krishna's childhood was filled with threats from demons, yet he played joyfully. How can we maintain inner joy when facing our own daily challenges?"
    ],
    "ramayana-intro": [
      "Valmiki was inspired to write the epic by witnessing the grief of a bird. How does the theme of compassion shape the character of Shree Ram?",
      "Prince Ram was exiled to the forest for 14 years just before his coronation. How would you handle a sudden setback when you are on the verge of success?",
      "Hanuman's devotion is often called selfless. Do you think true devotion requires forgetting one's own ego? Why or why not?",
      "What ethical lessons do you think the Ramayana offers for leaders and administrators in the 21st century?"
    ],
    "gita-chapter-1": [
      "Arjuna's collapse is called a 'despair yoga.' Do you agree that deep confusion or crisis is necessary before one can receive true wisdom?",
      "Arjuna was torn between family attachments and his duty to fight injustice. How do you resolve conflicts between personal relations and moral duties?",
      "Arjuna's bow, Gandiva, slipped from his hand due to anxiety. What physical or mental signs of stress do you notice in yourself when faced with hard decisions?",
      "Krishna remained calm while Arjuna wept. What characteristics make for an ideal mentor or guide during a personal crisis?"
    ]
  }
};

// Application State Variables
let currentTopic = null;
let currentScreen = "topic-select"; // topic-select, learning, quiz, qa, teacher
let currentTab = "explanation"; // explanation, audio, video
let quizProgress = {}; // topicId: { currentQuestionIndex, answers: [], score }
let currentAudio = null;
let forwardQuestionIndex = 0;


// --- Groq LLM Integration ---
function getGroqApiKey() {
  let key = localStorage.getItem("GROQ_API_KEY");
  if (!key) {
    key = prompt("Please enter your Groq API Key to enable AI features:");
    if (key) {
      localStorage.setItem("GROQ_API_KEY", key.trim());
    } else {
      alert("API Key is required for AI features to work.");
    }
  }
  return key;
}

async function callGroqLLM(systemInstruction, userPrompt, jsonMode = false) {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("LLM Call Failed:", err);
    return null;
  }
}

// Initialize the Application
document.addEventListener("DOMContentLoaded", () => {
  renderTopics();
  setupEventListeners();
  updatePipelineUI();
  
  // Initialize scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  
  // We'll observe elements after a short delay so DOM is ready
  setTimeout(() => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }, 500);
});

// Render Step 1: Topics List
function renderTopics() {
  const topicsGrid = document.getElementById("topics-grid");
  topicsGrid.innerHTML = "";
  
  db.topics.forEach(topic => {
    const card = document.createElement("div");
    card.className = "topic-item-card";
    card.dataset.id = topic.id;
    
    const tagsHtml = topic.tags.map(t => `<span class="tag-badge">#${t}</span>`).join("");
    
    card.innerHTML = `
      <div class="topic-card-header">
        <span class="topic-category">${topic.category}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-gold);"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </div>
      <div>
        <h3 class="topic-title">${topic.title}</h3>
      </div>
      <div class="topic-tags">
        ${tagsHtml}
      </div>
    `;
    
    card.addEventListener("click", async () => await selectTopic(topic.id));
    topicsGrid.appendChild(card);
  });
}

// Event Listeners
function setupEventListeners() {
  // Navigation back buttons
  document.querySelectorAll(".back-link").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentScreen === "learning") {
        navigateTo("topic-select");
      } else if (currentScreen === "quiz") {
        navigateTo("learning");
      } else if (currentScreen === "qa") {
        navigateTo("learning");
      } else if (currentScreen === "teacher") {
        navigateTo("quiz");
      }
    });
  });

  // Tab Buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetTab = e.target.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Revisit Content Button
  document.getElementById("btn-revisit").addEventListener("click", () => {
    navigateTo("learning");
  });

  // Mini Audio Player Close
  document.querySelector(".mini-audio-close").addEventListener("click", stopAudio);
  
  // Scoped Q&A Submit
  document.getElementById("qa-submit").addEventListener("click", handleQASubmit);
  document.getElementById("qa-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleQASubmit();
  });

  // Teacher Chat Submit
  document.getElementById("teacher-submit").addEventListener("click", handleTeacherSubmit);
  document.getElementById("teacher-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleTeacherSubmit();
  });
  
  // Pipeline Download helper
  document.getElementById("download-json-btn").addEventListener("click", () => {
    fetch('vedyam-learning-pipeline.json')
      .then(resp => resp.json())
      .then(json => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "vedyam-learning-pipeline.json");
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
      });
  });
}

// Select a Topic and transition
async function selectTopic(topicId) {
  currentTopic = db.topics.find(t => t.id === topicId);
  
  // Reset audio & forward questioning
  stopAudio();
  forwardQuestionIndex = 0;
  
  // Load Screen 2 content
  document.getElementById("current-topic-title").innerText = currentTopic.title;
  document.getElementById("learning-topic-title").innerText = currentTopic.title;
  
  const explanationDiv = document.getElementById("explanation-content");
  
  // Navigate to Learning screen & show loading
  navigateTo("learning");
  switchTab("explanation");
  
  explanationDiv.innerHTML = `
    <div class="loading-spinner-container">
      <div class="loading-spinner"></div>
      <p style="margin-top:1rem; color:var(--text-muted); font-size:0.9rem;">AI Teacher is generating a structured explanation for '${currentTopic.title}'...</p>
    </div>
  `;

  // Fetch Audio/Video from backend datasets
  const audiosList = document.getElementById("audios-list");
  const videosList = document.getElementById("videos-list");
  audiosList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Loading audio...</p>`;
  videosList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Loading videos...</p>`;

  try {
    const resMedia = await fetch("http://127.0.0.1:5001/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: currentTopic.title })
    });
    if (resMedia.ok) {
      const mediaData = await resMedia.json();
      
      // Render Audios
      audiosList.innerHTML = "";
      if (mediaData.audios && mediaData.audios.length > 0) {
        mediaData.audios.forEach(audio => {
          const audioDiv = document.createElement("div");
          audioDiv.className = "audio-item";
          audioDiv.innerHTML = `
            <div class="audio-thumbnail">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <div class="audio-info">
              <div class="audio-title">${audio.title}</div>
              <div class="audio-duration">${audio.duration} • ${audio.description}</div>
            </div>
            <button class="play-btn" onclick="playAudio('${audio.title}', '${audio.duration}')">▶</button>
          `;
          audiosList.appendChild(audioDiv);
        });
      } else {
        audiosList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No audio files found in datasets/audio for this topic.</p>`;
      }

      // Render Videos
      videosList.innerHTML = "";
      if (mediaData.videos && mediaData.videos.length > 0) {
        mediaData.videos.forEach(video => {
          const videoDiv = document.createElement("div");
          videoDiv.className = "video-item";
          videoDiv.innerHTML = `
            <div class="video-player-container">
              <div style="width:100%; height:100%; background:#222; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid rgba(255,255,255,0.1);"><span style="color:#aaa;">Video Placeholder</span></div>
              <button class="video-play-overlay" onclick="playVideo('${video.title}', '${video.videoUrl}')">▶</button>
            </div>
            <div class="video-meta">
              <div class="video-title">${video.title}</div>
              <div class="video-desc">${video.description}</div>
            </div>
          `;
          videosList.appendChild(videoDiv);
        });
      } else {
        videosList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No video files found in datasets/video for this topic.</p>`;
      }
    }
  } catch(e) {
    console.error(e);
    audiosList.innerHTML = `<p style="color:red;">Error loading media from backend.</p>`;
    videosList.innerHTML = `<p style="color:red;">Error loading media from backend.</p>`;
  }

  // Initialize Q&A Chat window
  const qaHistory = document.getElementById("qa-history");
  qaHistory.innerHTML = `
    <div class="chat-message bot">
      <div class="message-sender">AI Guardrail</div>
      <p>I am your topic assistant. I can answer questions specifically about <strong>${currentTopic.title}</strong>. What would you like to know?</p>
    </div>
  `;
  
  // Call Python Backend for Explanation
  try {
    const res = await fetch("http://127.0.0.1:5001/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: currentTopic.title })
    });
    
    if (res.ok) {
      const exp = await res.json();
      db.explanations[topicId] = exp;
      
      const bulletHtml = (exp.takeaways || []).map(takeaway => {
        return `<li>${takeaway}</li>`;
      }).join("");

      explanationDiv.innerHTML = `
        <div class="explanation-text">
          <p>${exp.intro || ''}</p>
          
          <h3>The Story & Narrative</h3>
          <p>${exp.narrative || ''}</p>
          
          <h3>Spiritual & Historical Context</h3>
          <p>${exp.context || ''}</p>
          
          <div class="takeaway-box">
            <h4>Key Takeaways</h4>
            <ul>
              ${bulletHtml}
            </ul>
          </div>
          
          <h3>Summary</h3>
          <p>${exp.summary || ''}</p>
        </div>
      `;
    } else {
      explanationDiv.innerHTML = `<p style="color:red;">Error fetching explanation from backend.</p>`;
    }
  } catch(e) {
    console.error(e);
    explanationDiv.innerHTML = `<p style="color:red;">Failed to connect to Python backend. Is backend.py running?</p>`;
  }

}
// Tab Switching (Explanation, Audio, Video)
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.toggle("active", content.id === `${tabId}-tab`);
  });
  updatePipelineUI();
}

// Navigate between screens
function navigateTo(screenId) {
  currentScreen = screenId;
  document.querySelectorAll(".sim-screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === `${screenId}-screen`);
  });
  
  // Update control button panels depending on screen
  const stickyFooter = document.getElementById("sticky-footer");
  stickyFooter.style.display = (screenId === "learning") ? "flex" : "none";
  
  const quizStickyFooter = document.getElementById("quiz-sticky-footer");
  quizStickyFooter.style.display = (screenId === "quiz") ? "flex" : "none";

  if (screenId === "quiz") {
    generateOrLoadQuiz().catch(console.error);
  } else if (screenId === "teacher") {
    initTeacherChat();
  }

  updatePipelineUI();
}

// Audio Player simulation
window.playAudio = function(title, duration) {
  const player = document.getElementById("mini-audio-player");
  document.getElementById("mini-audio-title").innerText = `Listening: ${title}`;
  player.classList.add("active");
  currentAudio = title;
  
  // Fill progress bar animation
  const fill = player.querySelector(".audio-progress-fill");
  fill.style.width = "0%";
  let pct = 0;
  clearInterval(window.audioInterval);
  window.audioInterval = setInterval(() => {
    pct += 2;
    fill.style.width = `${pct}%`;
    if (pct >= 100) {
      clearInterval(window.audioInterval);
      stopAudio();
    }
  }, 1000);
}

function stopAudio() {
  const player = document.getElementById("mini-audio-player");
  player.classList.remove("active");
  clearInterval(window.audioInterval);
  currentAudio = null;
}

// Video Player simulation
window.playVideo = function(title, embedUrl) {
  const container = event.target.closest('.video-player-container');
  container.innerHTML = `
    <iframe width="100%" height="100%" src="${embedUrl}?autoplay=1" 
      title="${title}" frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen style="border:none;"></iframe>
  `;
}

// Step 3: Quiz Engine
async function generateOrLoadQuiz() {
  const topicId = currentTopic.id;
  const container = document.getElementById("quiz-questions");
  
  if (!db.quizzes[topicId]) {
    container.innerHTML = `
      <div class="loading-spinner-container">
        <div class="loading-spinner"></div>
        <p style="margin-top:1rem; color:var(--text-muted); font-size:0.9rem;">AI is generating a personalized quiz based on the explanation...</p>
      </div>
    `;
    
    // Call Python Backend for Quiz
    try {
      const expText = JSON.stringify(db.explanations[topicId] || {});
      const res = await fetch("http://127.0.0.1:5001/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: currentTopic.title, explanation: expText })
      });
      
      if (res.ok) {
        const parsed = await res.json();
        db.quizzes[topicId] = parsed.questions || parsed;
      } else {
        container.innerHTML = `<p style="color:red;">Error fetching quiz from backend.</p>`;
        return;
      }
    } catch(e) {
      console.error(e);
      container.innerHTML = `<p style="color:red;">Failed to connect to Python backend.</p>`;
      return;
    }
  }
  
  const questions = db.quizzes[topicId];
  container.innerHTML = "";

  // Initialize progress if it doesn't exist
  if (!quizProgress[topicId]) {
    quizProgress[topicId] = {
      answers: new Array(questions.length).fill(null),
      submitted: false,
      score: 0
    };
  }

  const prog = quizProgress[topicId];

  questions.forEach((q, qIndex) => {
    const qCard = document.createElement("div");
    qCard.className = "quiz-question-card";
    
    let typeLabel = q.type === "mcq" ? "Multiple Choice" : q.type === "tf" ? "True / False" : "Fill in the Blanks";
    
    let inputHtml = "";
    
    if (q.type === "mcq" || q.type === "tf") {
      inputHtml = `<div class="options-list">`;
      q.options.forEach((opt, oIndex) => {
        let stateClass = "";
        if (prog.submitted) {
          if (oIndex === q.answer) {
            stateClass = "correct";
          } else if (prog.answers[qIndex] === oIndex) {
            stateClass = "incorrect";
          }
        } else if (prog.answers[qIndex] === oIndex) {
          stateClass = "selected";
        }
        
        inputHtml += `
          <div class="option-item ${stateClass}" onclick="selectQuizOption(${qIndex}, ${oIndex})">
            <div class="radio-check"></div>
            <span>${opt}</span>
          </div>
        `;
      });
      inputHtml += `</div>`;
    } else if (q.type === "fill") {
      let isCorrectClass = "";
      let disabledAttr = "";
      let val = prog.answers[qIndex] || "";
      
      if (prog.submitted) {
        disabledAttr = "disabled";
        const cleanAnswer = val.trim().toLowerCase();
        isCorrectClass = cleanAnswer === String(q.answer).toLowerCase() ? "style='border-color: var(--accent-emerald); background: rgba(16,185,129,0.05);'" : "style='border-color: var(--accent-rose); background: rgba(244,63,94,0.05);'";
      }
      
      inputHtml = `
        <input type="text" class="text-input-field" placeholder="Type your answer here..." 
          value="${val}" ${disabledAttr} ${isCorrectClass} onchange="saveQuizText(${qIndex}, this.value)">
        ${prog.submitted ? `<p style="font-size:0.8rem; margin-top:0.5rem; color: var(--accent-emerald)">Correct Answer: ${q.answer}</p>` : ''}
      `;
    }

    qCard.innerHTML = `
      <div class="question-meta">Question ${qIndex + 1} • ${typeLabel}</div>
      <div class="question-text">${q.question}</div>
      ${inputHtml}
    `;
    container.appendChild(qCard);
  });

  // Render buttons
  const btnSubmit = document.getElementById("btn-quiz-submit");
  if (prog.submitted) {
    btnSubmit.innerText = `Quiz Complete (${prog.score}/${questions.length})`;
    btnSubmit.disabled = true;
    btnSubmit.style.background = "var(--accent-emerald)";
    document.getElementById("btn-teacher-continue").style.display = "flex";
  } else {
    btnSubmit.innerText = "Submit Answers";
    btnSubmit.disabled = false;
    btnSubmit.style.background = "linear-gradient(135deg, var(--accent-gold), var(--accent-saffron))";
    document.getElementById("btn-teacher-continue").style.display = "none";
  }
}
window.selectQuizOption = function(qIndex, oIndex) {
  const topicId = currentTopic.id;
  if (quizProgress[topicId].submitted) return;
  quizProgress[topicId].answers[qIndex] = oIndex;
  generateOrLoadQuiz().catch(console.error);
}

window.saveQuizText = function(qIndex, val) {
  const topicId = currentTopic.id;
  if (quizProgress[topicId].submitted) return;
  quizProgress[topicId].answers[qIndex] = val;
}

// Submit Quiz
document.getElementById("btn-quiz-submit").addEventListener("click", () => {
  const topicId = currentTopic.id;
  const prog = quizProgress[topicId];
  const questions = db.quizzes[topicId];
  
  // Calculate Score
  let score = 0;
  questions.forEach((q, index) => {
    if (q.type === "mcq" || q.type === "tf") {
      if (prog.answers[index] === q.answer) score++;
    } else if (q.type === "fill") {
      const val = (prog.answers[index] || "").trim().toLowerCase();
      if (val === q.answer.toLowerCase()) score++;
    }
  });

  prog.score = score;
  prog.submitted = true;
  generateOrLoadQuiz().catch(console.error);
});

// Navigate to Q&A Panel from Sidebar or screen buttons
document.getElementById("btn-open-qa").addEventListener("click", () => {
  navigateTo("qa");
});

document.getElementById("btn-teacher-continue").addEventListener("click", () => {
  navigateTo("teacher");
});

// Step 5: Topic-Scoped Q&A Handlers
async function handleQASubmit() {
  const input = document.getElementById("qa-input");
  const text = input.value.trim();
  if (!text) return;

  const history = document.getElementById("qa-history");
  
  // Append User message
  history.innerHTML += `
    <div class="chat-message user">
      <div class="message-sender">You</div>
      <p>${text}</p>
    </div>
  `;
  
  input.value = "";
  history.scrollTop = history.scrollHeight;
  
  // Add temporary loading message
  const loadingId = "msg-" + Date.now();
  history.innerHTML += `
    <div class="chat-message bot" id="${loadingId}">
      <div class="message-sender">AI Guardrail</div>
      <p><span class="typing-indicator"><span>.</span><span>.</span><span>.</span></span></p>
    </div>
  `;
  history.scrollTop = history.scrollHeight;

  // Call Python Backend for Q&A
  let finalResponse = "Sorry, I am having trouble connecting to the backend.";
  try {
    const res = await fetch("http://127.0.0.1:5001/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: currentTopic.title, question: text })
    });
    if (res.ok) {
      const data = await res.json();
      finalResponse = data.response || "No response received.";
    }
  } catch(e) {
    console.error(e);
  }
  
  // Remove loading message
  document.getElementById(loadingId).remove();

  history.innerHTML += `
    <div class="chat-message bot">
      <div class="message-sender">AI Guardrail</div>
      <p>${finalResponse.replace(/\n/g, '<br>')}</p>
    </div>
  `;
  history.scrollTop = history.scrollHeight;
}
// Step 6: Forward Questioning Engine (AI Teacher)
async function initTeacherChat() {
  const history = document.getElementById("teacher-history");
  history.innerHTML = `
    <div class="chat-message bot">
      <div class="message-sender">AI Teacher</div>
      <p>Pranam! You have completed the structured learning and the quiz. As your mentor, I invite you to reflect on these teachings rather than memorizing facts.</p>
    </div>
    <div class="chat-message bot" id="teacher-loading-init">
      <div class="message-sender">AI Teacher</div>
      <p><span class="typing-indicator"><span>.</span><span>.</span><span>.</span></span></p>
    </div>
  `;
  
  forwardQuestionIndex = 0;
  
  // Call Backend for initial question
  let initialQuestion = "What is one key value you learned from this topic?";
  try {
    const res = await fetch("http://127.0.0.1:5001/api/teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: currentTopic.title, history: "Start the reflection." })
    });
    if (res.ok) {
      const data = await res.json();
      initialQuestion = data.response || initialQuestion;
    }
  } catch(e) {
    console.error(e);
  }
  document.getElementById("teacher-loading-init").remove();
  
  const aiResponseText = initialQuestion;
  
  history.innerHTML += `
    <div class="chat-message bot">
      <div class="message-sender">AI Teacher</div>
      <p><strong>${aiResponseText || "What is one key value you learned from this topic?"}</strong></p>
    </div>
  `;
  forwardQuestionIndex++;
}

async function handleTeacherSubmit() {
  const input = document.getElementById("teacher-input");
  const text = input.value.trim();
  if (!text) return;

  const history = document.getElementById("teacher-history");
  
  // Append User reflection
  history.innerHTML += `
    <div class="chat-message user">
      <div class="message-sender">You</div>
      <p>${text}</p>
    </div>
  `;
  
  input.value = "";
  history.scrollTop = history.scrollHeight;
  
  const loadingId = "msg-teacher-" + Date.now();
  history.innerHTML += `
    <div class="chat-message bot" id="${loadingId}">
      <div class="message-sender">AI Teacher</div>
      <p><span class="typing-indicator"><span>.</span><span>.</span><span>.</span></span></p>
    </div>
  `;
  history.scrollTop = history.scrollHeight;

  // Build chat history for prompt
  let conversationContext = "Previous conversation:\n";
  const messages = history.querySelectorAll('.chat-message');
  messages.forEach(msg => {
    if(msg.id !== loadingId && !msg.innerHTML.includes("Pranam!")) {
      const isUser = msg.classList.contains('user');
      const pText = msg.querySelector('p').innerText;
      conversationContext += `${isUser ? 'Student' : 'Teacher'}: ${pText}\n`;
    }
  });

  // Call Python Backend for Teacher
  let aiResponseText = "Thank you for sharing your thoughts.";
  try {
    const res = await fetch("http://127.0.0.1:5001/api/teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: currentTopic.title, history: conversationContext })
    });
    if (res.ok) {
      const data = await res.json();
      aiResponseText = data.response || aiResponseText;
    }
  } catch(e) {
    console.error(e);
  }
  
  document.getElementById(loadingId).remove();
  
  history.innerHTML += `
    <div class="chat-message bot">
      <div class="message-sender">AI Teacher</div>
      <p>${aiResponseText ? aiResponseText.replace(/\n/g, '<br>') : "Thank you for sharing your thoughts."}</p>
    </div>
  `;
  history.scrollTop = history.scrollHeight;
}
// Update the Langflow Pipeline Visualizer Highlight States
function updatePipelineUI() {
  // Map screens/tabs to specific Node IDs in Langflow
  let activeNodeId = "ChatInput-Topic"; // Default

  if (currentScreen === "learning") {
    if (currentTab === "explanation") {
      activeNodeId = "LLM-Explanation";
    } else if (currentTab === "audio") {
      activeNodeId = "CustomComponent-AudioRetrieval";
    } else if (currentTab === "video") {
      activeNodeId = "CustomComponent-VideoRetrieval";
    }
  } else if (currentScreen === "quiz") {
    activeNodeId = "LLM-Quiz";
  } else if (currentScreen === "qa") {
    activeNodeId = "LLM-ScopedQA";
  } else if (currentScreen === "teacher") {
    activeNodeId = "LLM-ForwardQuestioning";
  }

  // Update classes on flow Nodes in index.html
  document.querySelectorAll(".visual-node").forEach(node => {
    node.classList.toggle("active-state", node.id === `node-${activeNodeId}`);
  });

  // Update sidebar indicators
  document.querySelectorAll(".step-indicator").forEach(indicator => {
    indicator.classList.remove("active");
  });

  const step1 = document.getElementById("step-ind-1");
  const step2 = document.getElementById("step-ind-2");
  const step3 = document.getElementById("step-ind-3");
  const step4 = document.getElementById("step-ind-4");
  const step5 = document.getElementById("step-ind-5");

  if (currentScreen === "topic-select") {
    step1.classList.add("active");
  } else if (currentScreen === "learning") {
    step2.classList.add("active");
    step1.classList.add("completed");
  } else if (currentScreen === "quiz") {
    step3.classList.add("active");
    step1.classList.add("completed");
    step2.classList.add("completed");
  } else if (currentScreen === "qa") {
    step4.classList.add("active");
    step1.classList.add("completed");
    step2.classList.add("completed");
  } else if (currentScreen === "teacher") {
    step5.classList.add("active");
    step1.classList.add("completed");
    step2.classList.add("completed");
    step3.classList.add("completed");
  }
}
