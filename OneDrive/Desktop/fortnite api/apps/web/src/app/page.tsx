'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate mockup in
    if (mockupRef.current) {
      setTimeout(() => {
        mockupRef.current?.classList.add('animate-in');
      }, 200);
    }

    // Wait a bit for the DOM to be ready, then initialize chat
    const initChat = () => {
      if (!chatRef.current) {
        // Retry after a short delay in case component hasn't mounted yet
        setTimeout(initChat, 100);
        return;
      }

      // Make sure we don't initialize multiple times
      if (chatRef.current.children.length > 0) {
        return; // Already initialized
      }

      // Multiple conversation sets to cycle through - all have 4 messages (2 user, 2 AI)
      const conversations = [
      [
        { type: 'user', text: 'Hey, can you help me improve my gameplay?' },
        { type: 'ai', text: 'Absolutely! I\'d love to help you improve. Let me analyze your recent matches first.' },
        { type: 'user', text: 'That would be great, thanks!' },
        { type: 'ai', text: 'I found a few key areas to focus on. Your positioning is good, but you need work on rotation timing.' },
      ],
      [
        { type: 'user', text: 'What\'s my biggest weakness right now?' },
        { type: 'ai', text: 'Based on your last 10 matches, you\'re taking too much storm damage. Your rotation timing needs improvement!' },
        { type: 'user', text: 'Got it, how should I practice that?' },
        { type: 'ai', text: 'I\'ll create a custom drill focused on rotation scenarios. Practice timing your movements with storm phases.' },
      ],
      [
        { type: 'user', text: 'How can I improve my endgame?' },
        { type: 'ai', text: 'Your endgame positioning is solid, but you need to work on surge management. Let me analyze your surge decisions.' },
        { type: 'user', text: 'Surge management is tough for me' },
        { type: 'ai', text: 'I\'ll generate some practice scenarios with different surge situations. Focus on when to engage vs. when to hold.' },
      ],
      [
        { type: 'user', text: 'Can you review my last fight?' },
        { type: 'ai', text: 'I see you lost that 1v1 because you didn\'t reset your wall. Here\'s a breakdown of what happened...' },
        { type: 'user', text: 'That makes sense, wall resets are hard' },
        { type: 'ai', text: 'Want me to generate some practice scenarios for wall resets? I can create drills tailored to your skill level.' },
      ],
      [
        { type: 'user', text: 'What\'s the meta right now?' },
        { type: 'ai', text: 'The current meta favors AR + SMG combos. Long-range fights are more common this season.' },
        { type: 'user', text: 'Should I change my loadout?' },
        { type: 'ai', text: 'Your loadout is close, but consider swapping your shotgun for better range coverage. AR + SMG is more versatile.' },
      ],
      ];

      let currentConversationIndex = 0;
      const allTimeouts: NodeJS.Timeout[] = [];
      let cycleIntervalId: NodeJS.Timeout | null = null;

      const clearChat = () => {
        if (chatRef.current) {
          chatRef.current.innerHTML = '';
        }
      };

      // Create typing indicator (3 dots)
      const createTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'mockup-message ai typing-indicator';
        typingDiv.innerHTML = `
          <div class="mockup-message-bubble typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        `;
        typingDiv.style.opacity = '0';
        typingDiv.style.transform = 'translateY(10px)';
        
        if (chatRef.current) {
          chatRef.current.appendChild(typingDiv);
          
          // Animate in
          requestAnimationFrame(() => {
            typingDiv.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            typingDiv.style.opacity = '1';
            typingDiv.style.transform = 'translateY(0)';
          });
          
          // Scroll to bottom
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
        
        return typingDiv;
      };

      const removeTypingIndicator = (typingElement: HTMLElement | null) => {
        if (!typingElement || !chatRef.current) return;
        
        typingElement.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        typingElement.style.opacity = '0';
        typingElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          if (chatRef.current && typingElement.parentNode === chatRef.current) {
            chatRef.current.removeChild(typingElement);
          }
        }, 300);
      };

      const addMessage = (message: { type: string; text: string }, delay: number, showTypingBefore = false) => {
        return setTimeout(() => {
          if (!chatRef.current) return;
          
          let typingElement: HTMLElement | null = null;
          
          // Show typing indicator before AI messages
          if (showTypingBefore && message.type === 'ai') {
            typingElement = createTypingIndicator();
          }
          
          // Wait for typing animation, then show message
          const typingDelay = showTypingBefore && message.type === 'ai' ? 1500 : 0;
          
          setTimeout(() => {
            if (!chatRef.current) return;
            
            // Remove typing indicator if it exists
            if (typingElement) {
              removeTypingIndicator(typingElement);
            }
            
            // Small delay before message appears
            setTimeout(() => {
              if (!chatRef.current) return;
              
              const messageDiv = document.createElement('div');
              messageDiv.className = `mockup-message ${message.type}`;
              messageDiv.style.opacity = '0';
              messageDiv.style.transform = message.type === 'user' ? 'translateY(10px) translateX(10px)' : 'translateY(10px) translateX(-10px)';
              messageDiv.style.transition = 'none';
              
              const bubble = document.createElement('div');
              bubble.className = 'mockup-message-bubble';
              bubble.textContent = message.text;
              messageDiv.appendChild(bubble);
              chatRef.current.appendChild(messageDiv);
              
              // Smooth animate in with easing
              requestAnimationFrame(() => {
                messageDiv.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0) translateX(0)';
              });
              
              // Scroll to bottom smoothly
              if (chatRef.current) {
                chatRef.current.scrollTo({
                  top: chatRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }, typingDelay);
        }, delay);
      };

      const showConversation = (conversationIndex: number) => {
        // Clear existing timeouts
        allTimeouts.forEach(timeout => clearTimeout(timeout));
        allTimeouts.length = 0;
        
        // Clear chat
        clearChat();
        
        const conversation = conversations[conversationIndex];
        let delay = 1000; // Initial delay before first message
        
        conversation.forEach((msg, index) => {
          // Show typing indicator before ALL AI messages
          const showTyping = msg.type === 'ai';
          
          // Calculate delay based on message length and position
          // User messages: faster response
          // AI messages: slower (thinking + typing indicator)
          const baseDelay = msg.type === 'user' ? 1000 : 2000;
          const messageDelay = baseDelay + (msg.text.length * 30);
          
          const timeout = addMessage(msg, delay, showTyping);
          allTimeouts.push(timeout);
          
          // Add delay for next message
          // If AI message with typing, add typing duration + message display time
          // If user message, just add message display time
          if (showTyping) {
            delay += 1500 + messageDelay + 500; // Typing duration + message display + buffer
          } else {
            delay += messageDelay + 800; // Message display + buffer before next message
          }
        });
      };

      // Function to calculate conversation duration
      const calculateConversationDuration = (conv: typeof conversations[0]) => {
        let delay = 1000; // Initial delay
        conv.forEach((msg) => {
          const showTyping = msg.type === 'ai';
          const baseDelay = msg.type === 'user' ? 1000 : 2000;
          const messageDelay = baseDelay + (msg.text.length * 30);
          
          if (showTyping) {
            delay += 1500 + messageDelay + 500; // Typing + message display + buffer
          } else {
            delay += messageDelay + 800; // Message display + buffer
          }
        });
        return delay;
      };

      // Show first conversation
      const firstConversationDuration = calculateConversationDuration(conversations[0]);
      showConversation(0);

      // Function to cycle to next conversation
      const cycleToNextConversation = () => {
        // Clear the chat (CUT/END)
        clearChat();
        
        // Wait 1.5 seconds before starting new conversation
        const pauseTimeout = setTimeout(() => {
          currentConversationIndex = (currentConversationIndex + 1) % conversations.length;
          const conversationDuration = calculateConversationDuration(conversations[currentConversationIndex]);
          showConversation(currentConversationIndex);
          
          // Schedule next cycle after this conversation ends + pause
          cycleIntervalId = setTimeout(cycleToNextConversation, conversationDuration + 2000);
        }, 1500);
        
        allTimeouts.push(pauseTimeout);
      };

      // Start cycling after first conversation completes + pause
      const startCycleTimeout = setTimeout(() => {
        cycleToNextConversation();
      }, firstConversationDuration + 2000); // Wait for first conversation + 2 second pause
      
      allTimeouts.push(startCycleTimeout);

      // Cleanup function to return
      return () => {
        allTimeouts.forEach(timeout => clearTimeout(timeout));
        if (cycleIntervalId) clearTimeout(cycleIntervalId);
      };
    };

    // Start initialization
    const cleanup = initChat();
    
    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        {/* Purple-Blue Gradient Glow */}
        <div className="hero-glow"></div>

        {/* Background Dashboard Previews */}
        <div className="dashboard-previews">
          {/* Left Preview Card */}
          <div className="preview-card preview-left">
            <div className="card-header">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: '20px', height: '20px' }}>
                  <g>
                    <rect x="20" y="20" width="16" height="60" rx="8" ry="8" fill="#FFFFFF"/>
                    <path d="M 36 20 H 50 A 24 24 0 0 1 50 58 H 36 V 20 Z" fill="#FFFFFF"/>
                  </g>
                </svg>
              </div>
              <div className="card-title">Pathgen Dashboard</div>
            </div>
            <div className="card-menu-item active">
              <div className="menu-icon">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
                </svg>
              </div>
              <span>Chat</span>
            </div>
            <div className="card-menu-item">
              <img 
                src="/kinch%20logo.jpg" 
                alt="Kinch Analytics" 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <span>Kinch Analytics</span>
            </div>
            <div className="card-menu-item">
              <span>Data Sources</span>
            </div>
            <div className="card-menu-item">
              <span>Tournaments</span>
            </div>
            <div className="card-menu-item">
              <span>Settings</span>
            </div>
          </div>

          {/* Center-Left Preview */}
          <div className="preview-card preview-center-left">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <div className="card-title">Analytics</div>
            </div>
            <div className="card-menu-item">
              <span>FNCS Stats</span>
            </div>
            <div className="card-menu-item">
              <span>Weapon Meta</span>
            </div>
            <div className="card-menu-item">
              <span>Player Data</span>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="preview-card preview-right">
            <div className="card-header">
              <div className="card-icon">📱</div>
              <div className="card-title">Live Updates</div>
            </div>
            <div className="message-item">
              <img 
                src="/osirion.jpg" 
                alt="Osirion" 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div>
                <div className="message-name">Osirion</div>
                <div className="message-preview">Blinky fish removed from...</div>
              </div>
            </div>
            <div className="message-item">
              <img 
                src="/kinch%20logo.jpg" 
                alt="Kinch Analytics" 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div>
                <div className="message-name">Kinch Analytics</div>
                <div className="message-preview">Eval #1 Final stats...</div>
              </div>
            </div>
            <div className="message-item">
              <img 
                src="/fncr.jpg" 
                alt="FN Comp Report" 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div>
                <div className="message-name">FN Comp Report</div>
                <div className="message-preview">Tournament update...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-content">
              <h1 className="hero-title">Your personal Fortnite AI coach. Improve smarter, not harder.</h1>
              <p className="hero-subtitle">
                PathGen analyzes your gameplay, compares it to competitive pro data, and gives you real-time coaching through voice, stats, and tactical recommendations.
              </p>
              
              {/* Founder Info */}
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#9ca3af'
              }}>
                <strong style={{ color: '#a78bfa' }}>Founded by Fortnite competitive player Aiden Bender.</strong> Built by a player, for players.
              </div>

              <div className="hero-ctas">
                <Link href="/analyze" className="btn-primary">
                  Start Free Trial
                  <svg className="arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </Link>
                <Link href="/tournaments" className="btn-secondary">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="5" fill="white"></circle>
                  </svg>
                  View Tournaments
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="ai-coach-mockup" ref={mockupRef}>
              <div className="mockup-header">
                <div className="mockup-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <g>
                      <rect x="20" y="20" width="16" height="60" rx="8" ry="8" fill="#FFFFFF"/>
                      <path d="M 36 20 H 50 A 24 24 0 0 1 50 58 H 36 V 20 Z" fill="#FFFFFF"/>
                    </g>
                  </svg>
                </div>
                <div>
                  <div className="mockup-title">PathGen AI Coach</div>
                  <div className="mockup-status">● Online</div>
                </div>
              </div>
              <div className="mockup-chat" ref={chatRef}>
                {/* Messages will be added dynamically */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}