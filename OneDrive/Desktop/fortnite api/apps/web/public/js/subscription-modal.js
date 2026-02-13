// Subscription Modal - Shows when user tries to access restricted content
(function() {
    'use strict';
    
    // Create modal HTML
    function createSubscriptionModal() {
        const modalHTML = `
            <div id="subscriptionModal" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 99999;
                backdrop-filter: blur(8px);
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, rgba(17, 17, 17, 0.98), rgba(30, 30, 30, 0.98));
                    padding: 48px;
                    border-radius: 24px;
                    max-width: 500px;
                    width: 90%;
                    border: 2px solid rgba(139, 92, 246, 0.5);
                    box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
                    animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                    <!-- Close Button -->
                    <button onclick="window.closeSubscriptionModal()" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        color: white;
                        font-size: 24px;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                        ×
                    </button>
                    
                    <!-- Icon -->
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 24px;
                        background: linear-gradient(135deg, #F59E0B, #EF4444);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 48px;
                    ">
                        🔒
                    </div>
                    
                    <!-- Title -->
                    <h2 id="modalTitle" style="
                        font-size: 1.8rem;
                        font-weight: 800;
                        margin-bottom: 16px;
                        color: white;
                        text-align: center;
                    ">Upgrade Required</h2>
                    
                    <!-- Message -->
                    <p id="modalMessage" style="
                        font-size: 1.1rem;
                        color: #A0A0A0;
                        margin-bottom: 32px;
                        line-height: 1.6;
                        text-align: center;
                    ">This feature requires a premium subscription.</p>
                    
                    <!-- Actions -->
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <a href="/subscribe.html" style="
                            padding: 14px 32px;
                            background: linear-gradient(135deg, #8B5CF6, #6D28D9);
                            color: white;
                            text-decoration: none;
                            border-radius: 12px;
                            font-weight: 700;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(139, 92, 246, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(139, 92, 246, 0.4)'">
                            Upgrade Now
                        </a>
                        <button onclick="window.closeSubscriptionModal()" style="
                            padding: 14px 32px;
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -45%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            </style>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
    }
    
    // Show modal with custom message
    window.showSubscriptionModal = function(title, message) {
        let modal = document.getElementById('subscriptionModal');
        
        if (!modal) {
            createSubscriptionModal();
            modal = document.getElementById('subscriptionModal');
        }
        
        if (title) {
            document.getElementById('modalTitle').textContent = title;
        }
        
        if (message) {
            document.getElementById('modalMessage').textContent = message;
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };
    
    // Close modal
    window.closeSubscriptionModal = function() {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeSubscriptionModal();
        }
    });
})();

