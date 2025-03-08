const DISCORD_ID = '525363740347072552';
const API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const DISCORD_API_URL = `https://discord.com/api/v9/users/${DISCORD_ID}`;

async function updateUserProfile() {
    try {
        const lanyardResponse = await fetch(API_URL);
        if (!lanyardResponse.ok) {
            throw new Error(`Lanyard HTTP error! status: ${lanyardResponse.status}`);
        }
        const lanyardData = await lanyardResponse.json();
        console.log('Full Lanyard API Response:', lanyardData);

        if (lanyardData.success === false) {
            throw new Error('Failed to fetch user data from Lanyard');
        }

        // Update avatar
        const avatarElement = document.getElementById('av');
        const avatarHash = lanyardData.data.discord_user.avatar;
        if (avatarHash) {
            avatarElement.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatarHash}?size=512`;
        }

        // Get banner element
        const bannerElement = document.getElementById('bannerd');
        console.log('Banner element found:', bannerElement);
        
        // Check for banner data
        const bannerData = lanyardData.data.discord_user.banner;
        console.log('Banner data from API:', bannerData);

        if (bannerData) {
            let bannerUrl;
            
            // Check if banner is animated
            if (bannerData.startsWith('a_')) {
                bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/${bannerData}?size=1024`;
            } else {
                bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/${bannerData}?size=1024`;
            }
            
            console.log('Setting banner URL:', bannerUrl);
            // Try to load the image first to verify it exists
            const img = new Image();
            img.onload = () => {
                bannerElement.src = bannerUrl;
                bannerElement.style.display = 'block';
            };
            img.onerror = () => {
                console.log('Banner image failed to load, trying fallback');
                handleBannerFallback(bannerElement, lanyardData);
            };
            img.src = bannerUrl;
        } else {
            console.log('No banner data available, using fallback');
            handleBannerFallback(bannerElement, lanyardData);
        }

    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        const bannerElement = document.getElementById('bannerd');
        handleBannerFallback(bannerElement, { data: { discord_user: { accent_color: 0x005552 } } });
    }
}

function handleBannerFallback(bannerElement, lanyardData) {
    console.log('Handling banner fallback');
    // Use accent color if available, otherwise use site theme color
    const accentColor = lanyardData.data.discord_user.accent_color ? 
        '#' + lanyardData.data.discord_user.accent_color.toString(16).padStart(6, '0') :
        '#005552';
    
    console.log('Using color:', accentColor);
    // Create a canvas to generate a gradient image
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${accentColor}99`);
    gradient.addColorStop(0.5, `${accentColor}66`);
    gradient.addColorStop(1, `${accentColor}33`);
    
    // Fill canvas with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set the canvas as the banner source
    bannerElement.src = canvas.toDataURL();
    bannerElement.style.display = 'block';
}

async function updateActivity() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const activityText = document.querySelector('.activity-text');
        let activityImage = document.querySelector('.activity-image');

        // Create image element if it doesn't exist
        if (!activityImage) {
            activityImage = document.createElement('img');
            activityImage.className = 'activity-image';
            const discordStatus = document.querySelector('.discord-status');
            discordStatus.insertBefore(activityImage, activityText);
        }

        console.log('Discord API Response:', data); // Debug log

        // Remove any existing status
        activityText.removeAttribute('data-status');

        if (data.success === false) {
            throw new Error('Failed to fetch activity data');
        }

        if (data.data.activities && data.data.activities.length > 0) {
            // Find game activity first (type 0)
            let activity = data.data.activities.find(act => act.type === 0);
            
            // If no game activity found, use the first activity
            if (!activity) {
                activity = data.data.activities[0];
            }

            let status = '';

            switch (activity.type) {
                case 0: status = `Playing ${activity.name}`; break;
                case 1: status = `Streaming ${activity.name}`; break;
                case 2: status = `Listening to ${activity.name}`; break;
                case 3: status = `Watching ${activity.name}`; break;
                case 4: status = activity.name; break;
                case 5: status = `Competing in ${activity.name}`; break;
                default: status = activity.name;
            }

            if (activity.details) {
                status += `\n${activity.details}`;
            }
            if (activity.state) {
                status += `\n${activity.state}`;
            }

            activityText.innerHTML = status.replace(/\n/g, '<br>');
            activityText.style.color = '#dcddde';
            activityText.setAttribute('data-status', 'playing');

            // Set activity image
            if (activity.assets) {
                let imageUrl = null;
                if (activity.assets.large_image) {
                    if (activity.assets.large_image.startsWith('mp:external/')) {
                        imageUrl = `https://media.discordapp.net/external/${activity.assets.large_image.slice(12)}`;
                    } else if (activity.assets.large_image.startsWith('spotify:')) {
                        imageUrl = `https://i.scdn.co/image/${activity.assets.large_image.slice(8)}`;
                    } else {
                        imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                    }
                }
                if (imageUrl) {
                    activityImage.src = imageUrl;
                    activityImage.style.display = 'block';
                } else {
                    activityImage.style.display = 'none';
                }
            } else {
                activityImage.style.display = 'none';
            }
        } else {
            const status = data.data.discord_status || 'offline';
            activityText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            activityText.style.color = status === 'online' ? '#43b581' : '#747f8d';
            activityText.setAttribute('data-status', status);
            activityImage.style.display = 'none';
        }

        // Reset animation
        activityText.style.animation = 'none';
        activityText.offsetHeight; // Trigger reflow
        activityText.style.animation = null;

    } catch (error) {
        console.error('Error fetching Discord status:', error);
        const activityText = document.querySelector('.activity-text');
        activityText.textContent = 'Activity unavailable';
        activityText.style.color = '#f04747';
        activityText.setAttribute('data-status', 'offline');
        const activityImage = document.querySelector('.activity-image');
        if (activityImage) {
            activityImage.style.display = 'none';
        }
    }
}

// Initial updates
updateUserProfile();
updateActivity();

// Update every 15 seconds
const updateInterval = setInterval(() => {
    updateUserProfile();
    updateActivity();
}, 15000);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        updateUserProfile();
        updateActivity();
        setInterval(() => {
            updateUserProfile();
            updateActivity();
        }, 15000);
    }
}); 