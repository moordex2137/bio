const DISCORD_ID = '525363740347072552';
const API_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const DISCORD_API_URL = `https://discord.com/api/v9/users/${DISCORD_ID}`;

async function updateUserProfile() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Lanyard API Response:', data);

        if (data.success === false) {
            throw new Error('Failed to fetch user data');
        }

        // Update avatar
        const avatarElement = document.getElementById('av');
        const avatarHash = data.data.discord_user.avatar;
        if (avatarHash) {
            avatarElement.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatarHash}?size=512`;
        }

        // Update banner
        const bannerElement = document.getElementById('bannerd');
        if (data.data.discord_user.banner) {
            const bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/${data.data.discord_user.banner}?size=1024`;
            console.log('Setting banner:', bannerUrl);
            bannerElement.style.backgroundImage = `url('${bannerUrl}')`;
        } else {
            console.log('No banner found, checking premium type:', data.data.discord_user.premium_type);
            // If user has Nitro, they might have a profile banner even without a banner hash
            if (data.data.discord_user.premium_type > 0) {
                const nitroUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/a_${data.data.discord_user.avatar}?size=1024`;
                console.log('Trying Nitro banner:', nitroUrl);
                bannerElement.style.backgroundImage = `url('${nitroUrl}')`;
            }
        }

    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
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