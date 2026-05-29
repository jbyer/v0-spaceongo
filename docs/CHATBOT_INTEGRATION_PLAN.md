# Chatbot Integration Plan for SpaceOnGo

## Executive Summary

This document outlines a comprehensive plan for integrating an AI-powered chatbot into the SpaceOnGo platform to provide instant, automated assistance to users for common questions about space rentals, bookings, payments, and account management.

## 1. Technology Stack Selection

### Recommended: Vercel AI SDK with OpenAI GPT-4

**Why This Approach:**
- **Already in Dependencies**: Your project uses `ai` package (v4.2.3) and `@ai-sdk/openai`
- **Built for Next.js**: Seamless integration with App Router and React Server Components
- **Streaming Support**: Real-time conversational experience with token streaming
- **Cost Effective**: Pay-per-use pricing with GPT-4-mini for general queries
- **Type Safety**: Full TypeScript support matching your codebase standards
- **Edge Runtime**: Deploy chatbot logic on Vercel Edge for low latency

**Alternative Options Considered:**
1. **Intercom/Zendesk**: More expensive, less customizable
2. **Custom Webhook to External AI**: Higher maintenance overhead
3. **Open Source LLMs (Llama, Mistral)**: Requires infrastructure management

## 2. Architecture Design

### 2.1 Component Structure

```
components/
├── chatbot/
│   ├── ChatbotWidget.tsx          # Main floating widget
│   ├── ChatbotWindow.tsx          # Expanded chat interface
│   ├── ChatbotMessage.tsx         # Individual message component
│   ├── ChatbotInput.tsx           # User input with attachments
│   ├── ChatbotHeader.tsx          # Header with minimize/close
│   ├── ChatbotSuggestions.tsx     # Quick action buttons
│   └── ChatbotTypingIndicator.tsx # Animated typing dots

app/
├── api/
│   └── chat/
│       ├── route.ts               # Main chat endpoint
│       ├── context.ts             # FAQ/knowledge base loader
│       └── rate-limit.ts          # Rate limiting middleware

lib/
├── chatbot/
│   ├── prompts.ts                 # System prompts and context
│   ├── knowledge-base.ts          # FAQ embeddings and search
│   └── analytics.ts               # Conversation tracking
```

### 2.2 Database Schema Extension

**New Table: `chatbot_conversations`**
```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  resolved BOOLEAN DEFAULT false,
  escalated_to_support BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Index for fast session lookup
CREATE INDEX idx_chatbot_sessions ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_user_conversations ON chatbot_conversations(user_id);
```

**New Table: `chatbot_analytics`**
```sql
CREATE TABLE chatbot_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chatbot_conversations(id),
  event_type VARCHAR(50) NOT NULL, -- 'opened', 'message_sent', 'resolved', 'escalated'
  user_satisfaction INTEGER, -- 1-5 rating
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. UI/UX Design Specifications

### 3.1 Widget Design (Matches SpaceOnGo Design System)

**Colors:**
- Primary Button: Blue-600 (`hsl(221 83% 53%)`) - matches site primary
- Accent: Cyan (`hsl(199 89% 48%)`) - matches site accent
- Background: White with subtle border
- User Messages: Blue-50 background
- Bot Messages: Gray-50 background
- Text: Foreground (`hsl(215 25% 27%)`)

**Typography:**
- Font: Roboto (matches site font)
- Message text: 14px (0.875rem)
- Headers: 16px (1rem) semibold
- Timestamps: 12px (0.75rem) gray-500

**Spacing & Layout:**
- Widget Button: 60px diameter circle, fixed bottom-right
- Expanded Window: 400px wide × 600px tall on desktop
- Mobile: Full-screen overlay with slide-up animation
- Border Radius: 0.5rem (matches `--radius`)
- Shadow: `shadow-xl` for elevation

**Animations:**
- Widget bounce on first load (attention-grabbing)
- Smooth slide-in/out transitions (300ms ease-out)
- Typing indicator: 3 animated dots
- Message fade-in: Stagger each message by 100ms

### 3.2 Widget States

**1. Minimized (Default)**
```tsx
// Floating button bottom-right
<Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl
  bg-blue-600 hover:bg-blue-700 z-50">
  <MessageCircle className="h-6 w-6 text-white" />
</Button>
```

**2. Expanded Chat Window**
```tsx
<Card className="fixed bottom-24 right-6 w-[400px] h-[600px] shadow-2xl z-50
  flex flex-col">
  <ChatbotHeader />
  <ChatbotMessages />
  <ChatbotInput />
</Card>
```

**3. Mobile Full-Screen**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="h-screen max-w-full m-0 rounded-none">
    {/* Full screen chat interface */}
  </DialogContent>
</Dialog>
```

### 3.3 Suggested Quick Actions

Display at start of conversation:
- "How do I book a space?"
- "What payment methods do you accept?"
- "How do cancellations work?"
- "I need help with my booking"
- "Talk to a human"

## 4. Chatbot Intelligence & Behavior

### 4.1 System Prompt

```typescript
const SYSTEM_PROMPT = `You are SpaceOnGo AI Assistant, a helpful and friendly chatbot for SpaceOnGo - a platform for booking flexible workspaces, offices, studios, and event spaces.

Your role:
- Answer questions about booking spaces, payments, cancellations, and account management
- Be concise but thorough (2-4 sentences per response)
- Use a friendly, professional tone
- Never make up information - if unsure, offer to connect user with support
- Suggest relevant help articles when appropriate

Key information:
- Service fee: 15% per booking
- Cancellation policies vary by host (flexible, moderate, strict)
- Payment methods: Credit cards, PayPal, Apple Pay, Google Pay
- Refunds take 5-10 business days
- Support email: support@spaceongo.com
- Users can toggle between Renter and Host roles in profile settings

When users need help beyond your knowledge:
- Offer to escalate to human support
- Collect their email if not logged in
- Create a support ticket automatically
`
```

### 4.2 Knowledge Base Integration

**Use Existing FAQ Content:**
- Parse `/components/help-categories.tsx` content
- Convert FAQs to embeddings using OpenAI text-embedding-3-small
- Store in Supabase with pgvector extension
- Perform semantic search to find relevant FAQs

```typescript
// Example: Semantic search for relevant FAQs
const relevantFAQs = await searchKnowledgeBase(userQuery, {
  role: userRole, // 'renter' or 'host'
  limit: 3
})

// Include in context for AI
const context = relevantFAQs.map(faq => 
  `Q: ${faq.question}\nA: ${faq.answer}`
).join('\n\n')
```

### 4.3 Conversation Flow

```
1. User Opens Chatbot
   ↓
2. Welcome Message + Quick Actions
   "Hi! I'm SpaceOnGo AI. How can I help you today?"
   [Quick action buttons]
   ↓
3. User Asks Question
   ↓
4. AI Processing:
   - Semantic search knowledge base
   - Check user context (logged in? role?)
   - Generate response with RAG
   ↓
5. Stream Response to User
   ↓
6. Follow-up Suggestions
   "Was this helpful? Would you like to know more about [related topic]?"
   ↓
7. User Satisfied OR Escalate to Human
```

## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic chatbot UI and infrastructure

**Tasks:**
1. ✅ Create chatbot component structure
2. ✅ Design widget UI matching SpaceOnGo theme
3. ✅ Set up database tables and migrations
4. ✅ Implement widget open/close/minimize logic
5. ✅ Add mobile responsive behavior
6. ✅ Create typing indicator and animations

**Deliverable:** Non-functional chatbot widget that users can open/close

### Phase 2: AI Integration (Week 3-4)
**Goal:** Connect to AI and enable conversations

**Tasks:**
1. ✅ Set up Vercel AI SDK with OpenAI
2. ✅ Create `/api/chat` endpoint with streaming
3. ✅ Implement system prompts and context
4. ✅ Add rate limiting (10 messages per minute per user)
5. ✅ Connect chatbot UI to streaming API
6. ✅ Implement message persistence in database

**Deliverable:** Functional chatbot that answers basic questions

### Phase 3: Knowledge Enhancement (Week 5-6)
**Goal:** Improve accuracy with knowledge base

**Tasks:**
1. ✅ Extract FAQ content from help-categories.tsx
2. ✅ Generate embeddings with text-embedding-3-small
3. ✅ Set up pgvector in Supabase
4. ✅ Implement semantic search for RAG
5. ✅ Add user context awareness (role, booking history)
6. ✅ Fine-tune prompts based on testing

**Deliverable:** Chatbot with 90%+ accuracy on common questions

### Phase 4: Advanced Features (Week 7-8)
**Goal:** Escalation, analytics, and admin tools

**Tasks:**
1. ✅ Implement "Talk to Human" escalation flow
2. ✅ Create support ticket from conversation
3. ✅ Add conversation rating (thumbs up/down)
4. ✅ Build admin dashboard for conversation monitoring
5. ✅ Implement analytics tracking
6. ✅ Add A/B testing framework

**Deliverable:** Production-ready chatbot with full feature set

### Phase 5: Optimization (Ongoing)
**Goal:** Continuous improvement

**Tasks:**
- Monitor conversation logs and identify gaps
- Add new FAQ content based on user questions
- Optimize prompts for better responses
- Reduce API costs with caching
- Improve response time with edge deployment

## 6. Feature Specifications

### 6.1 Core Features

**✅ Real-time Chat:**
- Streaming responses (token-by-token)
- Message history within session
- Typing indicators
- Message timestamps

**✅ Context Awareness:**
- Detect if user is logged in
- Access user profile (role: renter/host)
- Reference active bookings
- Personalized greetings

**✅ Quick Actions:**
- Pre-defined question buttons
- Deep links to relevant pages
- "Talk to Human" button
- Feedback buttons (helpful/not helpful)

**✅ Escalation to Support:**
- Seamless handoff to human agent
- Conversation history preserved
- Notification to support team
- Estimated wait time display

**✅ Mobile Optimization:**
- Full-screen mode on mobile
- Touch-optimized interactions
- Reduced data usage
- Offline detection

### 6.2 Advanced Features

**📊 Analytics & Monitoring:**
```typescript
interface ChatbotMetrics {
  totalConversations: number
  avgMessagesPerConversation: number
  resolutionRate: number // % resolved without human
  avgResponseTime: number // milliseconds
  userSatisfactionScore: number // 1-5
  topQuestions: Array<{question: string, count: number}>
  escalationRate: number // % escalated to human
}
```

**🎯 Personalization:**
- Greet returning users by name
- Reference past bookings
- Suggest spaces based on history
- Proactive notifications (booking reminders)

**🔒 Security & Privacy:**
- PII detection and masking
- Rate limiting (prevent abuse)
- Content filtering (profanity, spam)
- GDPR compliance (data deletion requests)
- Conversation encryption at rest

**🌐 Multi-language Support (Future):**
- Auto-detect user language
- Translate responses with GPT-4
- Localized FAQ content
- Language switcher in widget

### 6.3 Admin Features

**📋 Conversation Management Dashboard:**
```tsx
// Admin can view and manage all conversations
<AdminDashboard>
  <ConversationList 
    filters={['all', 'active', 'resolved', 'escalated']}
    search={true}
  />
  <ConversationDetail 
    showFullHistory={true}
    allowIntervention={true}
  />
  <AnalyticsDashboard 
    metrics={chatbotMetrics}
    charts={['satisfaction', 'volume', 'resolution']}
  />
</AdminDashboard>
```

**⚙️ Configuration Panel:**
- Enable/disable chatbot globally
- Set business hours (auto-responses outside hours)
- Customize welcome message
- Update quick action buttons
- Adjust AI temperature (creativity vs accuracy)
- Set escalation triggers

## 7. Privacy & Compliance

### 7.1 Data Handling

**What We Collect:**
- Message content (encrypted)
- Session metadata (timestamp, duration)
- User ID (if logged in)
- User satisfaction ratings
- Analytics (anonymized)

**What We DON'T Collect:**
- Payment information
- Passwords
- Social security numbers
- Location tracking

**Data Retention:**
- Active conversations: 90 days
- Resolved conversations: 1 year
- Analytics data: 2 years
- Anonymized aggregates: Indefinitely

### 7.2 GDPR Compliance

**User Rights:**
- **Right to Access**: Users can download conversation history
- **Right to Deletion**: Users can request conversation deletion
- **Right to Opt-Out**: Users can disable chatbot in settings
- **Right to Data Portability**: Export in JSON format

**Implementation:**
```typescript
// API endpoint for GDPR requests
POST /api/chatbot/gdpr
{
  action: 'export' | 'delete' | 'opt-out',
  userId: string
}
```

### 7.3 Cookie Consent Integration

**Already Implemented:** Your `CookieConsentBanner` component

**Chatbot Behavior:**
- If user rejects cookies → Chatbot works but no analytics tracked
- If user accepts → Full analytics and personalization
- Store preference in localStorage: `chatbot_consent`

## 8. Performance Optimization

### 8.1 Caching Strategy

**Response Caching:**
```typescript
// Cache common questions for 1 hour
const cacheKey = hashQuery(userMessage)
const cached = await redis.get(cacheKey)

if (cached) {
  return cached // Skip AI call
}

const response = await generateAIResponse(userMessage)
await redis.set(cacheKey, response, { ex: 3600 })
```

**Benefits:**
- Reduce OpenAI API costs by 60-70%
- Improve response time from 2-3s to <100ms
- Handle traffic spikes gracefully

### 8.2 Edge Deployment

**Deploy chatbot API on Vercel Edge:**
```typescript
// app/api/chat/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Chatbot logic runs at edge location closest to user
  // ~50ms latency instead of 200-300ms
}
```

### 8.3 Bundle Size Optimization

**Code Splitting:**
- Lazy load chatbot widget: Only when user clicks
- Dynamic import AI SDK components
- Use lightweight icons (Lucide React)

**Target Bundle Size:**
- Initial load: +5KB (widget button only)
- Full chatbot: +150KB (acceptable for feature)

## 9. Testing & QA Plan

### 9.1 Unit Tests

```typescript
describe('Chatbot', () => {
  it('should open and close widget', () => {})
  it('should send messages', () => {})
  it('should stream AI responses', () => {})
  it('should handle errors gracefully', () => {})
  it('should escalate to human support', () => {})
  it('should persist conversation', () => {})
})
```

### 9.2 Integration Tests

- Test full conversation flow end-to-end
- Verify database persistence
- Check API rate limiting
- Validate error handling
- Test mobile responsiveness

### 9.3 User Acceptance Testing (UAT)

**Test Scenarios:**
1. New user asks about booking process
2. Returning user checks booking status
3. Host asks about payout methods
4. User needs human support
5. Mobile user navigates while chatting

**Success Criteria:**
- 90%+ questions answered correctly
- <3 second average response time
- <5% escalation rate
- 4.0+ user satisfaction score
- Zero critical bugs

## 10. Deployment Strategy

### 10.1 Rollout Phases

**Phase 1: Internal Testing (1 week)**
- Enable for admin users only
- Test all features thoroughly
- Fix critical bugs
- Collect internal feedback

**Phase 2: Beta Release (2 weeks)**
- Enable for 10% of users (A/B test)
- Monitor analytics closely
- Gather user feedback surveys
- Iterate on prompts and UI

**Phase 3: Full Launch (Week 3)**
- Enable for 100% of users
- Announce via email and blog post
- Monitor support ticket volume (should decrease)
- Track adoption metrics

### 10.2 Feature Flags

```typescript
// lib/feature-flags.ts
export const CHATBOT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true'
export const CHATBOT_BETA_USERS = ['user-id-1', 'user-id-2']

// Conditional rendering
{CHATBOT_ENABLED && <ChatbotWidget />}
```

### 10.3 Rollback Plan

**If critical issues arise:**
1. Disable via feature flag (instant rollback)
2. Show fallback: "Chat temporarily unavailable - Email support"
3. Investigate and fix issues in staging
4. Re-enable once stable

## 11. Cost Analysis

### 11.1 Estimated Monthly Costs

**OpenAI API (GPT-4-mini):**
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- Average conversation: 500 input + 300 output tokens
- **Estimated Cost per Conversation:** $0.00025
- **10,000 conversations/month:** $2.50

**Embedding API (text-embedding-3-small):**
- $0.020 per 1M tokens
- One-time FAQ embedding: ~50K tokens
- **One-time Cost:** $0.001
- **Negligible ongoing cost**

**Vercel Hosting:**
- Edge functions included in Pro plan ($20/month)
- No additional cost

**Database Storage (Supabase):**
- 500MB free tier
- Estimated chatbot data: 100MB/month
- **No additional cost**

**Total Monthly Cost:** ~$2.50 - $5.00 (assuming 10K conversations)

**ROI Calculation:**
- Support ticket cost: $5-10 per ticket
- If chatbot resolves 80% of inquiries
- **Savings:** 8,000 tickets × $7.50 = $60,000/month
- **ROI:** 12,000x

## 12. Success Metrics

### 12.1 KPIs to Track

**Adoption Metrics:**
- Daily active chatbot users
- Conversations per user
- Widget open rate
- Message send rate

**Quality Metrics:**
- Resolution rate (no human needed)
- Average conversation length
- User satisfaction score
- Feedback positive/negative ratio

**Business Impact:**
- Support ticket reduction %
- Customer satisfaction increase
- Booking conversion rate impact
- Time to resolution improvement

**Technical Metrics:**
- API response time (p50, p95, p99)
- Error rate
- Uptime/availability
- API cost per conversation

### 12.2 Success Thresholds

**Minimum Viable:**
- 70% resolution rate
- 3.5/5 satisfaction score
- <5 second response time
- 95% uptime

**Target Performance:**
- 85% resolution rate
- 4.2/5 satisfaction score
- <2 second response time
- 99.5% uptime

## 13. Future Enhancements

### 13.1 Phase 2 Features (Post-Launch)

**Voice Integration:**
- Voice input (speech-to-text)
- Voice output (text-to-speech)
- Hands-free mode for mobile

**Proactive Engagement:**
- Detect user struggling (time on page)
- Offer help automatically
- Abandoned booking recovery

**Advanced Personalization:**
- ML-based intent detection
- Predictive question suggestions
- Custom AI model fine-tuned on SpaceOnGo data

**Multi-modal Responses:**
- Send images (space photos)
- Embed booking cards
- Show availability calendars inline

### 13.2 Integration Opportunities

**Booking System:**
- "Find me a space" → Direct search with AI
- "Book this space" → Inline booking flow
- Check availability in real-time

**Payment System:**
- Answer payment questions with live data
- Show invoice details in chat
- Process refunds via chatbot

**Calendar Integration:**
- Show user's upcoming bookings
- Send booking reminders
- Handle rescheduling requests

## 14. Documentation & Training

### 14.1 User Documentation

**Help Article: "Using SpaceOnGo AI Assistant"**
- What questions can I ask?
- How to escalate to human support
- Privacy and data handling
- How to provide feedback

### 14.2 Admin Training

**Support Team Training:**
- How to monitor conversations
- When to intervene manually
- How to use admin dashboard
- Escalation procedures

### 14.3 Developer Documentation

**Technical Docs:**
- API endpoints and schemas
- Component architecture
- Database schema
- Deployment procedures
- Troubleshooting guide

## 15. Launch Checklist

### Pre-Launch (Complete These First)

- [ ] Database tables created and migrated
- [ ] OpenAI API key configured
- [ ] Chatbot widget UI designed and implemented
- [ ] API endpoints tested and secured
- [ ] Rate limiting configured
- [ ] Knowledge base embedded and searchable
- [ ] Mobile responsive design verified
- [ ] Analytics tracking implemented
- [ ] Admin dashboard deployed
- [ ] GDPR compliance features tested
- [ ] Error handling and fallbacks working
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Beta testing completed successfully
- [ ] Documentation written
- [ ] Support team trained

### Launch Day

- [ ] Enable feature flag for 10% of users
- [ ] Monitor error logs and metrics
- [ ] Stand by for immediate fixes
- [ ] Collect user feedback actively

### Post-Launch (First Week)

- [ ] Review analytics daily
- [ ] Iterate on prompts based on logs
- [ ] Address user feedback
- [ ] Gradually increase to 100% rollout
- [ ] Document lessons learned

## 16. Contact & Support

**Project Lead:** Engineering Team  
**Technical Questions:** engineering@spaceongo.com  
**User Feedback:** feedback@spaceongo.com  

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation  

---

## Appendix A: Sample Code Snippets

### A.1 Chatbot Widget Component

```tsx
'use client'

import { useState } from 'react'
import { MessageCircle, X, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl
            bg-blue-600 hover:bg-blue-700 z-50 animate-bounce"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <Card className="fixed bottom-24 right-6 w-[400px] h-[600px] 
          shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-8">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 
                flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">SpaceOnGo AI</h3>
                <p className="text-xs text-green-600">● Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Messages render here */}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            {/* Input field here */}
          </div>
        </Card>
      )}
    </>
  )
}
```

### A.2 Chat API Endpoint

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...messages,
    ],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Appendix B: Knowledge Base Structure

```typescript
interface FAQEntry {
  id: string
  question: string
  answer: string
  category: 'renter' | 'host' | 'both'
  subcategory: string
  keywords: string[]
  relatedQuestions: string[]
  embedding: number[] // 1536-dim vector
}

// Example entries
const knowledgeBase: FAQEntry[] = [
  {
    id: 'faq-1',
    question: 'How do I book a space?',
    answer: 'Search for spaces using our filters, select your preferred space...',
    category: 'renter',
    subcategory: 'Booking and Payments',
    keywords: ['booking', 'reserve', 'rent', 'search'],
    relatedQuestions: ['What payment methods do you accept?', 'Can I modify my booking?'],
    embedding: [...] // Vector representation
  }
]
```

---

**End of Chatbot Integration Plan**
