const DISCORD_ID = '525363740347072552';
const SERVER_ID = '855207922446762004';
const API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const DISCORD_API = 'https://discord.com/api/v10';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const DEFAULT_BANNER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let currentActivityIndex = 0;
let activities = [];

async function updateUserProfile() {
    try {
        // Fetch Lanyard data
        const lanyardResponse = await fetch(API_URL);
        if (!lanyardResponse.ok) {
            throw new Error(`Lanyard HTTP error! status: ${lanyardResponse.status}`);
        }
        const lanyardData = await lanyardResponse.json();
        
        if (lanyardData.success === false) {
            throw new Error('Failed to fetch user data from Lanyard');
        }

        // console.log('Lanyard Data:', lanyardData); // Debug log

        const userData = lanyardData.data.discord_user;

        // Update avatar immediately
        const avatarElement = document.getElementById('av');
        if (userData.avatar) {
            avatarElement.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${userData.avatar}?size=512`;
        }

        // Create stylish banner
        const bannerElement = document.getElementById('bannerd');
        createStylishBanner(bannerElement);

        // Update activities
        if (lanyardData.data.activities && lanyardData.data.activities.length > 0) {
            // console.log('Activities:', lanyardData.data.activities); // Debug log
            activities = lanyardData.data.activities.sort((a, b) => {
                if (a.type === 0 && b.type !== 0) return -1;
                if (a.type !== 0 && b.type === 0) return 1;
                return 0;
            });
            
            showActivity(currentActivityIndex);
            updateActivityNav();
        } else {
            // console.log('No activities found'); // Debug log
            activities = [];
            showActivity(0);
        }

        // Update server info
        updateServerInfo();

    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        const bannerElement = document.getElementById('bannerd');
        createStylishBanner(bannerElement);
    }
}

function createStylishBanner(bannerElement) {
    const color = '#005552';
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    let animationFrame;
    let offset = 0;
    
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create animated gradient background
        const gradient = ctx.createLinearGradient(
            Math.sin(offset * 0.02) * 100 + canvas.width/2, 
            Math.cos(offset * 0.02) * 50 + canvas.height/2,
            canvas.width, 
            canvas.height
        );
        gradient.addColorStop(0, `${color}dd`);
        gradient.addColorStop(0.5, `${color}aa`);
        gradient.addColorStop(1, `${color}88`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add animated wave pattern
        ctx.strokeStyle = `${color}33`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            for (let j = 0; j < canvas.height; j += 10) {
                ctx.lineTo(
                    i + Math.sin((j + offset) * 0.05) * 15,
                    j
                );
            }
            ctx.stroke();
        }
        
        // Add floating dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 0; x < canvas.width; x += 20) {
            for (let y = 0; y < canvas.height; y += 20) {
                const size = (Math.sin(x * 0.1 + offset * 0.02) + 2) * 1.5;
                ctx.beginPath();
                ctx.arc(
                    x + Math.sin((y + offset) * 0.02) * 5,
                    y + Math.cos((x + offset) * 0.02) * 5,
                    size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Add animated bottom gradient
        const bottomGradient = ctx.createLinearGradient(
            0,
            canvas.height * (0.6 + Math.sin(offset * 0.02) * 0.1),
            0,
            canvas.height
        );
        bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
        
        // Update banner
        bannerElement.src = canvas.toDataURL();
        
        // Increment offset for animation
        offset += 1;
        
        // Continue animation
        animationFrame = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Clean up previous animation when visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else {
            animate();
        }
    });
    
    bannerElement.style.display = 'block';
}

function updateActivity(data) {
    activities = [];
    if (data.activities && data.activities.length > 0) {
        // Sort activities to prioritize games (type 0)
        activities = data.activities.sort((a, b) => {
            if (a.type === 0 && b.type !== 0) return -1;
            if (a.type !== 0 && b.type === 0) return 1;
            return 0;
        });
        
        showActivity(currentActivityIndex);
        updateActivityNav();
    } else {
        const discordStatus = document.querySelector('.discord-status');
        let activityText = document.querySelector('.activity-text');
        let activityImage = document.querySelector('.activity-image');
        let textContent = document.querySelector('.activity-text-content');

        if (!activityText) {
            activityText = document.createElement('div');
            activityText.className = 'activity-text';
            discordStatus.appendChild(activityText);
        }

        if (!textContent) {
            textContent = document.createElement('div');
            textContent.className = 'activity-text-content';
            activityText.appendChild(textContent);
        }

        // Start fade out
        textContent.classList.add('fade-out');

        setTimeout(() => {
            textContent.classList.remove('fade-out');
            textContent.innerHTML = 'No current activity';
            activityText.setAttribute('data-status', 'offline');

            if (activityImage) {
                activityImage.style.display = 'none';
            }

            // Start fade in animation
            requestAnimationFrame(() => {
                textContent.classList.add('fade-in');
            });

            // Remove fade in class after animation completes
            setTimeout(() => {
                textContent.classList.remove('fade-in');
            }, 300);
        }, 300);

        updateActivityNav();
    }
}

function showActivity(index) {
    const activity = activities[index];
    // console.log('Showing activity:', activity);

    const discordStatus = document.querySelector('.discord-status');
    let activityText = document.querySelector('.activity-text');
    let activityImage = document.querySelector('.activity-image');
    let textContent = document.querySelector('.activity-text-content');

    if (!activityImage) {
        activityImage = document.createElement('img');
        activityImage.className = 'activity-image';
        discordStatus.insertBefore(activityImage, activityText);
    }

    if (activityText && activity) {
        // Handle image loading
        let imageUrl = null;
        
        if (activity.assets) {
            if (activity.assets.large_image) {
                if (activity.assets.large_image.startsWith('mp:external/')) {
                    imageUrl = `https://media.discordapp.net/external/${activity.assets.large_image.slice(12)}`;
                } else if (activity.assets.large_image.startsWith('spotify:')) {
                    imageUrl = `https://i.scdn.co/image/${activity.assets.large_image.slice(8)}`;
                } else if (activity.assets.large_image.startsWith('mp:')) {
                    imageUrl = `https://media.discordapp.net/${activity.assets.large_image.slice(3)}`;
                } else if (activity.assets.large_image.startsWith('https://')) {
                    imageUrl = activity.assets.large_image;
                } else if (activity.application_id) {
                    imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                }
            } else if (activity.assets.small_image) {
                if (activity.assets.small_image.startsWith('mp:external/')) {
                    imageUrl = `https://media.discordapp.net/external/${activity.assets.small_image.slice(12)}`;
                } else if (activity.assets.small_image.startsWith('spotify:')) {
                    imageUrl = `https://i.scdn.co/image/${activity.assets.small_image.slice(8)}`;
                } else if (activity.assets.small_image.startsWith('mp:')) {
                    imageUrl = `https://media.discordapp.net/${activity.assets.small_image.slice(3)}`;
                } else if (activity.assets.small_image.startsWith('https://')) {
                    imageUrl = activity.assets.small_image;
                } else if (activity.application_id) {
                    imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`;
                }
            }
        }

        // After fade out, update content
        setTimeout(() => {
            // Handle activity image
            if (imageUrl) {
                activityImage.style.display = 'block';
                activityImage.onerror = () => {
                    activityImage.style.display = 'none';
                    activityText.style.borderRadius = '10px';
                };
                activityImage.onload = () => {
                    activityImage.style.display = 'block';
                    activityText.style.borderRadius = '0 10px 10px 0';
                };
                activityImage.src = imageUrl;
            } else {
                activityImage.style.display = 'none';
                activityText.style.borderRadius = '10px';
            }

            // Update text content
            let statusText = '';
            if (activity.details) statusText += activity.details + '<br>';
            if (activity.state) statusText += activity.state + '<br>';
            
            switch (activity.type) {
                case 0:
                    statusText = `Playing ${activity.name}<br>${statusText}`;
                    activityText.setAttribute('data-status', 'playing');
                    break;
                case 1:
                    statusText = `Streaming ${activity.name}<br>${statusText}`;
                    activityText.setAttribute('data-status', 'streaming');
                    break;
                case 2:
                    statusText = `Listening to ${activity.name}<br>${statusText}`;
                    break;
                case 3:
                    statusText = `Watching ${activity.name}<br>${statusText}`;
                    break;
                case 4:
                    statusText = activity.state ? activity.state : `Custom Status: ${activity.name}<br>${statusText}`;
                    break;
                case 5:
                    statusText = `Competing in ${activity.name}<br>${statusText}`;
                    break;
                default:
                    statusText = `${activity.name}<br>${statusText}`;
            }
            
            textContent.innerHTML = statusText.trim();
            
            // Animation
            requestAnimationFrame(() => {
                textContent.classList.add('fade-in');
            });
        }, 300);
    }
}

function updateActivityNav() {
    const nav = document.querySelector('.activity-nav');
    const counter = document.querySelector('.activity-counter');
    const prevBtn = nav?.querySelector('button:first-child');
    const nextBtn = nav?.querySelector('button:last-child');
    
    if (nav) {
        nav.style.display = activities.length > 1 ? 'flex' : 'none';
    }
    
    if (counter) {
        counter.textContent = activities.length > 1 ? `${currentActivityIndex + 1}/${activities.length}` : '';
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentActivityIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentActivityIndex === activities.length - 1;
    }
}

function nextActivity() {
    if (currentActivityIndex < activities.length - 1) {
        currentActivityIndex++;
        showActivity(currentActivityIndex);
        updateActivityNav();
    }
}

function prevActivity() {
    if (currentActivityIndex > 0) {
        currentActivityIndex--;
        showActivity(currentActivityIndex);
        updateActivityNav();
    }
}

async function updateServerInfo() {
    try {
        const secondBox = document.querySelectorAll('.opis-box')[1];
        if (!secondBox) return;

        let serverStatus = secondBox.querySelector('.discord-status');
        if (!serverStatus) {
            serverStatus = document.createElement('div');
            serverStatus.className = 'discord-status';
            secondBox.appendChild(serverStatus);
        }

        serverStatus.innerHTML = `
            <div class="activity-container" style="height: 100%; gap: 0;">
                <img class="activity-image" src="img/katujemy.webp" style="
                    display: block;
                    height: 100%;
                    width: auto;
                    object-fit: cover;
                ">
                <div class="activity-text" style="
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 12px;
                ">
                    <div class="activity-text-content" style="
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                    ">
                        <strong style="
                            font-size: 1.1em;
                            letter-spacing: 0.5px;
                        ">Katujemy.eu - Sieć Counter-Strike</strong>
                        <div style="
                            display: flex;
                            gap: 12px;
                            margin-top: 4px;
                        ">
                            <a href="https://discord.com/invite/nnkcyySQk2" target="_blank" style="
                                display: inline-block;
                                padding: 6px 16px;
                                background: rgba(0, 85, 82, 0.3);
                                border: 1px solid rgba(0, 133, 128, 0.3);
                                border-radius: 4px;
                                color: #dcddde;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                font-size: 0.9em;
                                letter-spacing: 0.5px;
                            ">
                                Discord
                            </a>
                            <a href="https://katujemy.eu" target="_blank" style="
                                display: inline-block;
                                padding: 6px 16px;
                                background: rgba(0, 85, 82, 0.3);
                                border: 1px solid rgba(0, 133, 128, 0.3);
                                border-radius: 4px;
                                color: #dcddde;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                font-size: 0.9em;
                                letter-spacing: 0.5px;
                            ">
                                Forum
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add hover effect to buttons
        const buttons = serverStatus.querySelectorAll('a');
        buttons.forEach(button => {
            button.onmouseover = () => {
                button.style.background = 'rgba(0, 85, 82, 0.5)';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 5px 15px rgba(0, 133, 128, 0.2)';
                button.style.borderColor = 'rgba(0, 133, 128, 0.5)';
            };
            button.onmouseout = () => {
                button.style.background = 'rgba(0, 85, 82, 0.3)';
                button.style.transform = 'none';
                button.style.boxShadow = 'none';
                button.style.borderColor = 'rgba(0, 133, 128, 0.3)';
            };
        });
    } catch (error) {
        console.error('Error in updateServerInfo:', error);
    }
}

// Initial updates
updateUserProfile();

// Update every 15 seconds
const updateInterval = setInterval(() => {
    updateUserProfile();
}, 15000);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        updateUserProfile();
        setInterval(() => {
            updateUserProfile();
        }, 15000);
    }
}); 