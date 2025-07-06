// Main App Initialization
class SEDDITApp {
    constructor() {
        this.currentSection = 'feed-section';
        this.isWalletConnected = false;
        this.walletAddress = null;
        this.walletBalance = null;
        
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeNavigation();
        this.initializeWallet();
        this.initializeFeed();
        this.initializeEventListeners();
        this.loadSampleData();
    }

    initializeTheme() {
        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem('seddit-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemTheme;
        
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    }

    initializeNavigation() {
        // Set up bottom navigation
        const navItems = document.querySelectorAll('.bottom-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                this.switchSection(sectionId);
            });
        });

        // Set up left navigation for larger screens
        this.setupLeftNavigation();
    }

    setupLeftNavigation() {
        // Create left navigation for larger screens
        const leftNav = document.createElement('nav');
        leftNav.className = 'left-nav';
        leftNav.innerHTML = `
            <div class="nav-item active" data-section="feed-section">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </div>
            <div class="nav-item" data-section="explore-section">
                <i class="fas fa-hashtag"></i>
                <span>Explore</span>
            </div>
            <div class="nav-item" data-section="notifications-section">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
            </div>
            <div class="nav-item" data-section="profile-section">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </div>
        `;

        // Add click handlers
        const leftNavItems = leftNav.querySelectorAll('.nav-item');
        leftNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                this.switchSection(sectionId);
            });
        });

        // Insert after header
        const header = document.querySelector('.app-header');
        header.parentNode.insertBefore(leftNav, header.nextSibling);
    }

    switchSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Update navigation states
        this.updateNavigationStates(sectionId);

        // Handle section-specific initialization
        this.handleSectionChange(sectionId);
    }

    updateNavigationStates(activeSectionId) {
        // Update bottom navigation
        const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === activeSectionId) {
                item.classList.add('active');
            }
        });

        // Update left navigation
        const leftNavItems = document.querySelectorAll('.left-nav .nav-item');
        leftNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === activeSectionId) {
                item.classList.add('active');
            }
        });
    }

    handleSectionChange(sectionId) {
        switch (sectionId) {
            case 'feed-section':
                // Refresh feed if needed
                if (window.feedManager) {
                    window.feedManager.refreshFeed();
                }
                break;
            case 'profile-section':
                // Update profile section
                this.updateProfileSection();
                break;
            case 'notifications-section':
                // Load notifications
                this.loadNotifications();
                break;
        }
    }

    initializeWallet() {
        // Initialize wallet connection
        this.walletManager = new WalletManager();
        
        // Set up wallet connect button
        const walletConnectBtn = document.getElementById('wallet-connect');
        const connectProfileBtn = document.getElementById('connect-profile');
        
        if (walletConnectBtn) {
            walletConnectBtn.addEventListener('click', () => {
                this.walletManager.connectWallet();
            });
        }
        
        if (connectProfileBtn) {
            connectProfileBtn.addEventListener('click', () => {
                this.walletManager.connectWallet();
            });
        }

        // Set up disconnect button
        const disconnectBtn = document.getElementById('disconnect-wallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.walletManager.disconnectWallet();
            });
        }

        // Listen for wallet state changes
        this.walletManager.onStateChange((state) => {
            this.handleWalletStateChange(state);
        });
    }

    handleWalletStateChange(state) {
        this.isWalletConnected = state.connected;
        this.walletAddress = state.address;
        this.walletBalance = state.balance;

        // Update UI
        this.updateWalletUI();
        this.updateProfileSection();
    }

    updateWalletUI() {
        const walletConnectBtn = document.getElementById('wallet-connect');
        const walletInfo = document.getElementById('wallet-info');
        const notConnectedState = document.getElementById('not-connected-state');

        if (this.isWalletConnected) {
            if (walletConnectBtn) {
                walletConnectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    <span>${this.walletAddress ? this.walletAddress.slice(0, 6) + '...' : 'Connected'}</span>
                `;
                walletConnectBtn.classList.add('connected');
            }
            
            if (walletInfo) walletInfo.style.display = 'block';
            if (notConnectedState) notConnectedState.style.display = 'none';
        } else {
            if (walletConnectBtn) {
                walletConnectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    <span>Connect</span>
                `;
                walletConnectBtn.classList.remove('connected');
            }
            
            if (walletInfo) walletInfo.style.display = 'none';
            if (notConnectedState) notConnectedState.style.display = 'block';
        }
    }

    updateProfileSection() {
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');
        const walletAddress = document.getElementById('wallet-address');
        const walletBalance = document.getElementById('wallet-balance');

        if (this.isWalletConnected && this.walletAddress) {
            if (profileName) profileName.textContent = 'Solana User';
            if (profileUsername) profileUsername.textContent = `@${this.walletAddress.slice(0, 8)}`;
            if (walletAddress) walletAddress.textContent = this.walletAddress;
            if (walletBalance) walletBalance.textContent = this.walletBalance ? `${this.walletBalance} SOL` : '0 SOL';
        } else {
            if (profileName) profileName.textContent = 'Anonymous User';
            if (profileUsername) profileUsername.textContent = '@anonymous';
            if (walletAddress) walletAddress.textContent = 'Not connected';
            if (walletBalance) walletBalance.textContent = '0 SOL';
        }
    }

    initializeFeed() {
        // Initialize feed manager
        window.feedManager = new FeedManager();
    }

    initializeEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Handle window resize for responsive navigation
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle visibility change for auto-refresh
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentSection === 'feed-section') {
                window.feedManager?.refreshFeed();
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('seddit-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    handleResize() {
        // Handle responsive navigation changes
        const width = window.innerWidth;
        
        if (width >= 768) {
            // Show left navigation on larger screens
            const leftNav = document.querySelector('.left-nav');
            if (leftNav) leftNav.style.display = 'block';
        } else {
            // Hide left navigation on mobile
            const leftNav = document.querySelector('.left-nav');
            if (leftNav) leftNav.style.display = 'none';
        }
    }

    loadNotifications() {
        // Placeholder for notifications loading
        console.log('Loading notifications...');
    }

    loadSampleData() {
        // Load sample data for demonstration
        if (window.feedManager) {
            window.feedManager.loadSampleTweets();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sedditApp = new SEDDITApp();
});

// Handle service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 