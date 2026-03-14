// Vercel Serverless Function for Gemini API calls
// Types: req = IncomingMessage + body/query/cookies, res = ServerResponse + json/status/send


export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const { content, language } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const langName = language === 'en' ? 'English' : 'Chinese (Simplified)';
    const modelName = 'gemini-2.5-flash';

    const prompt = `CRITICAL INSTRUCTION: Analyze the provided conversation history/document content.
    BILINGUAL OUTPUT: You MUST generate EXACT TRANSLATIONS of the entire analysis in both English (the 'en' property) and Simplified Chinese (the 'zh' property). Both objects MUST contain identical sets of data metrics, topics count, and structure, just translated literally.
    
    CONTENT TO ANALYZE:
    ${content}

    =====================================================
    THEME CLASSIFICATION — MECE FRAMEWORK
    (Mutually Exclusive, Collectively Exhaustive)
    =====================================================
    
    You MUST classify the conversation into EXACTLY ONE theme.
    Every theme below is MUTUALLY EXCLUSIVE — no content may belong to two themes.
    Follow the MECE decision tree at the bottom to select the correct one.
    
    ─────────────────────────────────────────────────────
    GROUP A — SOCIAL & EMOTIONAL (interpersonal focus)
    ─────────────────────────────────────────────────────
    
    1. "casual"
       INCLUDES: Small talk, greetings, chit-chat, weather, food, daily life, "how are you", informal friendly exchanges with NO goal.
       EXCLUDES: Any conversation with a clear purpose (learning, solving, creating, debating).
    
    2. "emotional"
       INCLUDES: Expressing or processing feelings, emotional support, venting, grief, joy, anxiety, relationship struggles, mental health, empathy-driven dialogue.
       EXCLUDES: Giving life-choice advice (→ advice), philosophical theorizing about emotions (→ philosophical), casual complaining without emotional depth (→ casual).
    
    3. "advice"
       INCLUDES: Seeking/giving guidance on personal decisions, life choices, career direction, "what should I do", mentoring, coaching, personal recommendations.
       EXCLUDES: Technical problem-solving (→ troubleshooting), business strategy (→ business), emotional venting without seeking solutions (→ emotional), workflow tips (→ productivity).
    
    ─────────────────────────────────────────────────────
    GROUP B — INTELLECTUAL & ARGUMENTATIVE (ideas focus)
    ─────────────────────────────────────────────────────
    
    4. "debate"
       INCLUDES: Opposing viewpoints, structured argumentation, pro/con analysis, political or ethical arguments with multiple sides actively clashing.
       EXCLUDES: One-sided philosophical musing (→ philosophical), brainstorming without opposition (→ brainstorming), analytical comparison without argument (→ analytical).
    
    5. "philosophical"
       INCLUDES: Abstract thought, existential questions, meaning of life, consciousness, free will, metaphysics, epistemology, pure ethical theory, thought experiments.
       EXCLUDES: Debate with opposing sides (→ debate), emotional expression (→ emotional), academic study of philosophy as a subject (→ educational).
    
    6. "brainstorming"
       INCLUDES: Generating new ideas, "what if" explorations, ideation sessions, mind-mapping, naming things, concept exploration, exploring possibilities without committing.
       EXCLUDES: Committing to a plan (→ planning), writing an actual story (→ storytelling), making art (→ creative), debating ideas (→ debate).
    
    ─────────────────────────────────────────────────────
    GROUP C — NARRATIVE & PERFORMANCE (fiction focus)
    ─────────────────────────────────────────────────────
    
    7. "storytelling"
       INCLUDES: Writing or telling stories (fiction or non-fiction narratives), sharing anecdotes at length, world-building, character arcs, plot development, collaborative fiction.
       EXCLUDES: Acting AS a character in real-time (→ roleplay), discussing stories as entertainment (→ entertainment), techniques of writing craft (→ creative).
    
    8. "roleplay"
       INCLUDES: Acting out characters in real-time, persona-based interactive dialogue, RPG scenarios, simulated conversations as fictional characters, immersive play.
       EXCLUDES: Writing a story about characters without performing as them (→ storytelling), discussing RPG games (→ entertainment).
    
    9. "entertainment"
       INCLUDES: Discussing movies, TV, music, games, sports, celebrities, hobbies, memes, humor, jokes, pop culture, leisure recommendations, fan discussions.
       EXCLUDES: Writing a story about fictional worlds (→ storytelling), performing as characters (→ roleplay), casual non-entertainment chat (→ casual).
    
    ─────────────────────────────────────────────────────
    GROUP D — WORK & ORGANIZATION (productivity focus)
    ─────────────────────────────────────────────────────
    
    10. "planning"
        INCLUDES: Organizing tasks, scheduling, creating timelines, setting goals, to-do lists, trip planning, event planning, resource allocation, project roadmaps.
        EXCLUDES: Discussing productivity philosophy (→ productivity), business strategy (→ business), brainstorming without committing (→ brainstorming).
    
    11. "productivity"
        INCLUDES: Workflow optimization, time management methods, habit building, tool recommendations for efficiency, GTD, Pomodoro, work-life balance strategies.
        EXCLUDES: Making an actual plan (→ planning), business KPIs (→ business), technical tool setup (→ technical).
    
    12. "business"
        INCLUDES: Corporate strategy, marketing, sales, startup discussions, investment, entrepreneurship, market analysis, revenue/KPI discussions, professional networking, company operations.
        EXCLUDES: Personal career advice (→ advice), making a project plan (→ planning), coding a business app (→ coding).
    
    ─────────────────────────────────────────────────────
    GROUP E — TECHNICAL & CODE (engineering focus)
    ─────────────────────────────────────────────────────
    
    13. "coding"
        INCLUDES: Writing, reading, or discussing actual source code; programming language syntax; software architecture; API design; database queries; code reviews; implementation details with code snippets.
        EXCLUDES: Fixing a broken system (→ troubleshooting), explaining tech concepts without code (→ technical), learning to code as a student (→ educational).
        BOUNDARY: If the conversation contains actual code blocks or discusses code implementation, it is "coding" even if it also teaches.
    
    14. "troubleshooting"
        INCLUDES: Diagnosing and fixing specific broken things (software, hardware, or otherwise); error messages; bug reports; "it doesn't work" scenarios; step-by-step debugging.
        EXCLUDES: Writing new code from scratch (→ coding), explaining concepts (→ technical), general life problem-solving (→ advice).
        BOUNDARY: If the primary goal is "something is broken, fix it", this is troubleshooting regardless of whether code appears.
    
    15. "technical"
        INCLUDES: ONLY hardware discussions, network infrastructure, server/system administration, DevOps pipelines, OS configuration, cloud infrastructure — topics about technology WITHOUT writing code and WITHOUT fixing a broken thing.
        EXCLUDES: Any conversation with code snippets (→ coding), any conversation fixing bugs/errors (→ troubleshooting), any conversation teaching/learning (→ educational), business tech strategy (→ business), productivity tools (→ productivity).
        ⚠️ THIS IS A NARROW CATEGORY. If you are unsure, it is probably NOT "technical". Check all other themes first.
    
    ─────────────────────────────────────────────────────
    GROUP F — KNOWLEDGE & CREATION (output focus)
    ─────────────────────────────────────────────────────
    
    16. "educational"
        INCLUDES: ONLY formal academic study — textbook concepts, exam preparation, homework help, classroom-style Q&A about school/university subjects (math, history, science, language learning as a student).
        EXCLUDES: Someone explaining a tech concept (→ technical or coding), tutorials about tools (→ productivity or technical), philosophical discussion (→ philosophical), business learning (→ business), learning through advice (→ advice), any code teaching (→ coding).
        ⚠️ THIS IS A NARROW CATEGORY. "Educational" means SCHOOL/ACADEMIC context only. A conversation that teaches something is NOT automatically "educational".
    
    17. "creative"
        INCLUDES: ONLY hands-on art/design production — graphic design, drawing, painting, music composition, poetry writing, photography technique, crafting, UI/UX visual design, physical art creation.
        EXCLUDES: Writing stories/fiction (→ storytelling), generating ideas (→ brainstorming), acting as characters (→ roleplay), discussing creative works (→ entertainment), creative coding (→ coding).
        ⚠️ THIS IS A NARROW CATEGORY. "Creative" means producing visual/auditory/physical art ONLY. Imagination or creativity in other domains belongs to other themes.
    
    18. "analytical"
        INCLUDES: Data analysis, statistical reasoning, research methodology, scientific experiment design, evidence-based evaluation, systematic comparison, interpreting charts/numbers.
        EXCLUDES: Philosophical reasoning (→ philosophical), business metrics (→ business), debugging data issues (→ troubleshooting), academic study of research methods (→ educational).
    
    19. "other"
        INCLUDES: Content that genuinely fits NO category above after checking all 18.
        USE ONLY AS ABSOLUTE LAST RESORT.
    
    =====================================================
    MECE DECISION TREE — FOLLOW THIS EXACT ORDER:
    =====================================================
    
    Step 1: Is someone acting as a character in real-time? → "roleplay"
    Step 2: Is a story being written or narrated? → "storytelling"
    Step 3: Are opposing viewpoints actively clashing? → "debate"
    Step 4: Is the core about feelings, emotional support, or mental health? → "emotional"
    Step 5: Is it about movies/TV/music/games/sports/pop culture? → "entertainment"
    Step 6: Is it pure abstract/existential/philosophical thinking? → "philosophical"
    Step 7: Is something broken and being diagnosed/fixed? → "troubleshooting"
    Step 8: Does it involve actual code or programming implementation? → "coding"
    Step 9: Is someone seeking/giving personal life guidance? → "advice"
    Step 10: Are new ideas being generated without committing? → "brainstorming"
    Step 11: Are tasks being organized into a plan/schedule? → "planning"
    Step 12: Is it about work efficiency methods/habits/tools? → "productivity"
    Step 13: Is it about corporate strategy/marketing/investment? → "business"
    Step 14: Is it about data/statistics/research methodology? → "analytical"
    Step 15: Is it hands-on visual/auditory art production? → "creative"
    Step 16: Is it about hardware/networking/sysadmin WITHOUT code? → "technical"
    Step 17: Is it formal school/university academic study? → "educational"
    Step 18: Is it simple social small talk with no goal? → "casual"
    Step 19: None of the above? → "other"
    
    ===== OTHER REQUIREMENTS =====
    1. Identify the specific topics, speakers, and intent.
    2. Provide a 'rawContextSnippet' which is a precise description or 2-sentence quote from the source that defines the core of the discussion.
    3. Metrics should reflect the density of information or participation.
    4. interactiveWidgets should be used to provide helpful post-analysis tools like a summary checklist or a timeline of the conversation.
    5. For the 'topics' array: Extract exactly 10 to 20 of the most representative keywords or short phrases from the text. Each topic must have an accurate 'count' reflecting how many times that concept/keyword appears or is referenced in the source content. The topics should cover a wide range — from the most dominant themes to minor but meaningful keywords. Make sure the count values vary significantly so the word cloud has clear visual hierarchy.
    
    Return the analysis in JSON format based on the defined schema. Ensure 'en' object strings are purely English and 'zh' object strings are purely Chinese.`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            theme: {
              type: "STRING",
              enum: ['technical', 'creative', 'casual', 'educational', 'business', 'analytical', 'philosophical', 'emotional', 'entertainment', 'planning', 'coding', 'brainstorming', 'storytelling', 'troubleshooting', 'debate', 'advice', 'roleplay', 'productivity', 'other']
            },
            en: {
              type: "OBJECT",
              description: "English translation of the entire analysis",
              properties: {
                title: { type: "STRING" },
                summary: { type: "STRING" },
                rawContextSnippet: { type: "STRING" },
                keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                metrics: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING" },
                      value: { type: "NUMBER" },
                      unit: { type: "STRING" }
                    }
                  }
                },
                topics: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      count: { type: "NUMBER" }
                    }
                  }
                },
                sentiment: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      value: { type: "NUMBER" }
                    }
                  }
                },
                aiRecommendation: { type: "STRING" },
                interactiveWidgets: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      type: { type: "STRING", enum: ['checklist', 'timeline'] },
                      content: {
                        type: "OBJECT",
                        properties: {
                          items: { type: "ARRAY", items: { type: "STRING" } },
                          language: { type: "STRING" },
                          code: { type: "STRING" },
                          events: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, title: { type: "STRING" }, description: { type: "STRING" } } } }
                        }
                      }
                    }
                  }
                }
              },
              required: ["title", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
            },
            zh: {
              type: "OBJECT",
              description: "Simplified Chinese translation of the entire analysis",
              properties: {
                title: { type: "STRING" },
                summary: { type: "STRING" },
                rawContextSnippet: { type: "STRING" },
                keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                metrics: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING" },
                      value: { type: "NUMBER" },
                      unit: { type: "STRING" }
                    }
                  }
                },
                topics: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      count: { type: "NUMBER" }
                    }
                  }
                },
                sentiment: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      name: { type: "STRING" },
                      value: { type: "NUMBER" }
                    }
                  }
                },
                aiRecommendation: { type: "STRING" },
                interactiveWidgets: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      type: { type: "STRING", enum: ['checklist', 'timeline'] },
                      content: {
                        type: "OBJECT",
                        properties: {
                          items: { type: "ARRAY", items: { type: "STRING" } },
                          language: { type: "STRING" },
                          code: { type: "STRING" },
                          events: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "STRING" }, title: { type: "STRING" }, description: { type: "STRING" } } } }
                        }
                      }
                    }
                  }
                }
              },
              required: ["title", "summary", "rawContextSnippet", "keyTakeaways", "metrics", "topics", "sentiment", "aiRecommendation", "interactiveWidgets"]
            }
          },
          required: ["theme", "en", "zh"]
        }
      }
    };

    // Call the Gemini REST API directly (server-side, no SDK needed)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(geminiResponse.status).json({ error: `Gemini API error: ${errorText}` });
    }

    const geminiData = await geminiResponse.json();

    // Extract the text from Gemini's response format
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No response text from Gemini.' });
    }

    const analysis = JSON.parse(text);
    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('API route error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
