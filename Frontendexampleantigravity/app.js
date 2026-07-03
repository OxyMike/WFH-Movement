// WFH Movement Core Application Script

// --- Default Application State ---
const DEFAULT_STATE = {
    userName: "Maya",
    level: 12,
    xp: 450,
    streak: 9,
    shieldActive: true,
    completedToday: 0,
    dailyGoal: 3,
    onboardingComplete: false,
    bodyStiffness: { neck: 0, shoulders: 0, wrists: 0, back: 0, legs: 0 },
    muteState: false,
    workStyle: "remote",
    movementPref: "all",
    notificationStyle: "both",
    spaceRestrict: "none",
    shiftStart: 9, // 9:00 AM
    shiftEnd: 17,  // 5:00 PM
    lastActivityDay: new Date().toDateString(),
    
    // Daily quests track
    dailyQuests: [
        { id: "quiet-mob", name: "Quiet Mobility", target: 1, current: 0, xp: 50, completed: false },
        { id: "wrist-reset", name: "Wrist Reset", target: 1, current: 0, xp: 40, completed: false },
        { id: "no-floor-core", name: "No-Floor Core", target: 1, current: 0, xp: 60, completed: false },
        { id: "low-sweat-str", name: "Low-Sweat Strength", target: 1, current: 0, xp: 70, completed: false }
    ],
    
    // Active Schedule Preset
    activePreset: "balanced",
    
    // User custom added meetings (represented by start & end decimals from 9 to 17)
    meetings: [
        { id: "m1", name: "Standup Sync", start: 9.5, end: 10.0 },
        { id: "m2", name: "Client Proposal", start: 11.5, end: 12.5 },
        { id: "m3", name: "Sprint Alignment", start: 14.0, end: 15.0 }
    ],

    // Unlocks Log
    unlocks: [
        { id: "un1", name: "Wrist Reset Pack", levelReq: 3, unlocked: true, icon: "🖐️" },
        { id: "un2", name: "Focus Audio Themes", levelReq: 6, unlocked: true, icon: "🎵" },
        { id: "un3", name: "Desk Crew Badges", levelReq: 10, unlocked: true, icon: "🛡️" },
        { id: "un4", name: "Deep Breath Flow", levelReq: 15, unlocked: false, icon: "🌬️" },
        { id: "un5", name: "Standing Strength Pack", levelReq: 18, unlocked: false, icon: "🦵" }
    ],
    
    // Stats track
    stats: {
        totalResets: 24,
        minutesMoved: 96,
        streaksBroken: 18,
        adherenceRate: 94
    }
};

// State instantiation
let state = { ...DEFAULT_STATE };

// --- Web Audio Synthesizer Class ---
class FlowSoundSynth {
    constructor() {
        this.ctx = null;
    }
    
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playNote(freq, duration, delay = 0, type = "sine") {
        if (state.muteState) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
        // Exponential decay for soft bell sound
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }
    
    playChime(type) {
        try {
            if (type === "start") {
                // Ascending major chord
                this.playNote(261.63, 0.4, 0); // C4
                this.playNote(329.63, 0.4, 0.12); // E4
                this.playNote(392.00, 0.5, 0.24); // G4
            } else if (type === "next") {
                // Light tone transition
                this.playNote(659.25, 0.2, 0); // E5
            } else if (type === "complete") {
                // Celebratory chords
                this.playNote(261.63, 0.3, 0); // C4
                this.playNote(329.63, 0.3, 0.1); // E4
                this.playNote(392.00, 0.3, 0.2); // G4
                this.playNote(523.25, 0.6, 0.3); // C5
                
                setTimeout(() => {
                    this.playNote(392.00, 0.3, 0); // G4
                    this.playNote(523.25, 0.6, 0.1); // C5
                    this.playNote(659.25, 0.7, 0.2); // E5
                }, 350);
            }
        } catch (e) {
            console.warn("Audio Context blocked or failed to initialize: ", e);
        }
    }
}

const synth = new FlowSoundSynth();

// --- Library Quests Database ---
const QUESTS_LIBRARY = [
    { id: "posture-reset", name: "Posture Reset", duration: 4, category: "mobility", difficulty: "Easy", xp: 80, desc: "Neck + shoulder release to offset desk stiffness." },
    { id: "wrist-stretch", name: "Wrist Stretch", duration: 3, category: "stretch", difficulty: "Easy", xp: 60, desc: "Flexing tendons, releasing carpal tunnel compression." },
    { id: "back-twist", name: "Spine Twist", duration: 5, category: "mobility", difficulty: "Easy", xp: 100, desc: "Seated twist to mobilize ribcage and stretch spine muscles." },
    { id: "calf-raises", name: "Calf Raises", duration: 3, category: "strength", difficulty: "Medium", xp: 60, desc: "Standing heel lifts to re-activate leg circulatory pumps." },
    { id: "seated-plank", name: "Seated Plank", duration: 4, category: "strength", difficulty: "Medium", xp: 80, desc: "Isometric core holds to counteract hip flexion fatigue." },
    { id: "eye-focus", name: "Eye Focus Flow", duration: 2, category: "quiet", difficulty: "Easy", xp: 40, desc: "Near-far optical adjustments for screen strain relief." },
    { id: "shoulder-rolls", name: "Desk Shoulder Rolls", duration: 3, category: "mobility", difficulty: "Easy", xp: 65, desc: "Continuous shoulder rotations for tension relief." },
    { id: "deep-breaths", name: "Deep Belly Breath", duration: 3, category: "quiet", difficulty: "Easy", xp: 50, desc: "Relaxing diaphragm breath loops to lower heart rate." },

    // New additions
    { id: "seated-spinal-twist", name: "Seated Spinal Twists", duration: 1, category: "mobility", difficulty: "Easy", xp: 40, desc: "Restores rotational thoracic spine mobility and hydrates vertebral discs." },
    { id: "figure-4-stretch", name: "Seated Figure-4 Stretch", duration: 2, category: "stretch", difficulty: "Easy", xp: 50, desc: "Relieves piriformis tension and combats lower back stiffness from seating." },
    { id: "chin-tucks", name: "Chin Tucks", duration: 1, category: "mobility", difficulty: "Easy", xp: 30, desc: "Reverses forward head monitor carriage and unloads cervical joints." },
    { id: "wrist-extensor", name: "Wrist Extensor Stretch", duration: 2, category: "stretch", difficulty: "Easy", xp: 45, desc: "Prevents repetitive strain and carpal tightness from sustained mouse work." },
    { id: "glute-squeezes", name: "Seated Glute Squeezes", duration: 1, category: "strength", difficulty: "Easy", xp: 35, desc: "Combats glute amnesia by re-activating gluteal firing mechanisms." },
    { id: "scapular-retractions", name: "Scapular Retractions", duration: 1, category: "mobility", difficulty: "Easy", xp: 40, desc: "Activates rhomboids to pull shoulder blades back, fighting desk slumps." },
    { id: "doorway-stretch", name: "Doorway Chest Stretch", duration: 2, category: "stretch", difficulty: "Easy", xp: 50, desc: "Stretches chest pectorals and deltoids back to their natural length." },
    { id: "side-bends", name: "Standing Side Bends", duration: 2, category: "stretch", difficulty: "Medium", xp: 45, desc: "Lengthens obliques and lateral QL lumbar muscles to relieve back strain." },
    { id: "hip-flexor-stretch", name: "Standing Hip Flexor Stretch", duration: 2, category: "stretch", difficulty: "Medium", xp: 50, desc: "Opens short hip flexors, releasing forward pelvis tension on back." },
    { id: "hamstring-sweeps", name: "Dynamic Hamstring Sweeps", duration: 1, category: "mobility", difficulty: "Medium", xp: 40, desc: "Safely lengthens shortened hamstrings dynamically without pulling cold tissue." },
    { id: "sit-to-stand", name: "Sit-to-Stand Squats", duration: 1, category: "strength", difficulty: "Medium", xp: 55, desc: "Chair squats forcing quads to lift body weight, spiking blood flow." },
    { id: "standing-calf-raises", name: "Standing Calf Raises", duration: 1, category: "strength", difficulty: "Medium", xp: 50, desc: "Activates calf soleus venous pumps to clear glucose and boost circulation." },
    { id: "air-squats", name: "Air Squats", duration: 1, category: "strength", difficulty: "Medium", xp: 60, desc: "Raises heart rate and lubricates hip and knee joint cavities." },
    { id: "leg-extensions", name: "Seated Leg Extensions", duration: 2, category: "strength", difficulty: "Easy", xp: 45, desc: "Engages quadriceps and maintains synovial knee fluid motion." },
    { id: "desk-pushups", name: "Desk Push-Ups", duration: 1, category: "strength", difficulty: "Medium", xp: 50, desc: "Engages chest and core with less joint shear stress than floor pushes." },
    { id: "stair-climbing", name: "Brisk Stair Climbing", duration: 2, category: "strength", difficulty: "Hard", xp: 75, desc: "Hourly vascular booster that elevates cardiorespiratory fitness." },
    { id: "desk-plank", name: "The Desk Plank", duration: 1, category: "strength", difficulty: "Medium", xp: 55, desc: "Isometrically engages core muscles that go slack in computer chairs." },
    { id: "high-knees", name: "Marching in Place", duration: 1, category: "strength", difficulty: "Medium", xp: 50, desc: "Elevates heart rate and drives hip flexors dynamically for energy." },
    { id: "rebounding", name: "Rebounding Bounces", duration: 1, category: "quiet", difficulty: "Easy", xp: 40, desc: "Light impact bouncing that stimulates lymphatic drainage and bone density." },
    { id: "pacing", name: "Pacing Phone Call", duration: 5, category: "quiet", difficulty: "Easy", xp: 80, desc: "Baseline thermogenesis (NEAT) walking that boosts call cognitive focus." }
];

// Active scheduled quest context
let currentQuest = QUESTS_LIBRARY[0];
let currentStepIdx = 0;
let liveTimerInterval = null;
let liveTimeRemaining = 240; // in seconds
let liveTimerTotal = 240;
let isTimerPaused = true;

// Custom schedule configs
const PRESET_SCHEDULES = {
    balanced: [
        { id: "m1", name: "Standup Sync", start: 9.5, end: 10.0 },
        { id: "m2", name: "Client Proposal", start: 11.5, end: 12.5 },
        { id: "m3", name: "Sprint Alignment", start: 14.0, end: 15.0 }
    ],
    meeting: [
        { id: "m1", name: "Daily Standup", start: 9.0, end: 9.5 },
        { id: "m2", name: "Product Demo", start: 10.0, end: 11.0 },
        { id: "m3", name: "Marketing Sync", start: 11.0, end: 11.75 },
        { id: "m4", name: "Lunch Meeting", start: 12.0, end: 13.0 },
        { id: "m5", name: "One-on-One", start: 14.0, end: 14.5 },
        { id: "m6", name: "Retrospective", start: 15.5, end: 16.5 }
    ],
    focus: [
        { id: "m1", name: "Morning Brief", start: 9.0, end: 9.25 },
        { id: "m2", name: "Review Call", start: 16.5, end: 17.0 }
    ]
};

// --- Storage Controls ---
function loadState() {
    const saved = localStorage.getItem("wfhmovement_state_v1");
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse local storage: ", e);
            state = { ...DEFAULT_STATE };
        }
    } else {
        state = { ...DEFAULT_STATE };
    }
}

function saveState() {
    localStorage.setItem("wfhmovement_state_v1", JSON.stringify(state));
}

// --- DOM Navigation & Setup ---
function setupTabNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".view-section");
    const viewTitle = document.getElementById("current-view-title");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTab = item.getAttribute("data-tab");
            
            navItems.forEach(btn => btn.classList.remove("active"));
            item.classList.add("active");
            
            sections.forEach(sec => sec.classList.remove("active-view"));
            
            const activeSec = document.getElementById(`view-${targetTab}`);
            if (activeSec) {
                activeSec.classList.add("active-view");
            }
            
            // Set header title
            switch(targetTab) {
                case "today":
                    viewTitle.innerText = "Today's Quest Board";
                    break;
                case "quests":
                    viewTitle.innerText = "Quests Library";
                    renderQuestsLibrary();
                    break;
                case "calendar":
                    viewTitle.innerText = "Calendar Gap Manager";
                    renderCalendarMeetingList();
                    break;
                case "team":
                    viewTitle.innerText = "Team Hub";
                    break;
                case "rewards":
                    viewTitle.innerText = "Rewards & Achievements";
                    renderRewardsShowcase();
                    break;
                case "progress":
                    viewTitle.innerText = "Insights & Statistics";
                    updateProgressView();
                    break;
                case "settings":
                    viewTitle.innerText = "Settings & Preferences";
                    populateSettings();
                    break;
            }
            
            synth.init();
        });
    });
}

// --- Onboarding Flow Logic ---
let currentOnboardSlide = 1;
const totalOnboardSlides = 5;

function initOnboarding() {
    const onboarding = document.getElementById("onboarding-wizard");
    if (!state.onboardingComplete) {
        onboarding.classList.add("active");
        renderOnboardingSlide();
    } else {
        onboarding.classList.remove("active");
    }
    
    // Select cards (single select slides: work style & intensity preference)
    const selectCards = document.querySelectorAll(".select-card:not(.check-card)");
    selectCards.forEach(card => {
        card.addEventListener("click", () => {
            const parent = card.parentElement;
            parent.querySelectorAll(".select-card").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            
            // Apply preferences to state
            if (card.hasAttribute("data-style")) {
                state.workStyle = card.getAttribute("data-style");
            } else if (card.hasAttribute("data-pref")) {
                state.movementPref = card.getAttribute("data-pref");
                state.spaceRestrict = card.getAttribute("data-pref") === "seated" ? "seated" : "none";
            }
            saveState();
        });
    });

    // Check-in cards (multi select body scan slide)
    const checkCards = document.querySelectorAll(".check-card");
    checkCards.forEach(card => {
        card.addEventListener("click", () => {
            card.classList.toggle("selected");
            const part = card.getAttribute("data-body-part");
            const isSelected = card.classList.contains("selected");
            
            // On onboarding selection, mark as tight (2) if checked, otherwise none (0)
            state.bodyStiffness[part] = isSelected ? 2 : 0;
            saveState();
            synth.playChime("next");
        });
    });
    
    // Onboarding buttons
    document.getElementById("btn-onboard-next").addEventListener("click", () => {
        if (currentOnboardSlide < totalOnboardSlides) {
            currentOnboardSlide++;
            renderOnboardingSlide();
            synth.playChime("next");
        } else {
            // Complete onboarding
            state.onboardingComplete = true;
            saveState();
            onboarding.classList.remove("active");
            updateDashboard();
            synth.playChime("complete");
        }
    });

    document.getElementById("btn-onboard-back").addEventListener("click", () => {
        if (currentOnboardSlide > 1) {
            currentOnboardSlide--;
            renderOnboardingSlide();
        }
    });
    
    // Goal adjustments
    const goalValText = document.getElementById("onboard-goal-val");
    document.getElementById("btn-goal-minus").addEventListener("click", () => {
        if (state.dailyGoal > 1) {
            state.dailyGoal--;
            goalValText.innerText = state.dailyGoal;
            saveState();
        }
    });
    document.getElementById("btn-goal-plus").addEventListener("click", () => {
        if (state.dailyGoal < 10) {
            state.dailyGoal++;
            goalValText.innerText = state.dailyGoal;
            saveState();
        }
    });
}

function renderOnboardingSlide() {
    const slides = document.querySelectorAll(".onboarding-slide");
    slides.forEach(slide => slide.classList.remove("active-slide"));
    
    document.getElementById(`obs-${currentOnboardSlide}`).classList.add("active-slide");
    
    // Align check cards selection states to active state values
    if (currentOnboardSlide === 2) {
        document.querySelectorAll(".check-card").forEach(card => {
            const part = card.getAttribute("data-body-part");
            if (state.bodyStiffness[part] > 0) {
                card.classList.add("selected");
            } else {
                card.classList.remove("selected");
            }
        });
    }
    
    // Update dots
    const dots = document.getElementById("onboard-dot-indicators").children;
    for (let i = 0; i < dots.length; i++) {
        if (i === currentOnboardSlide - 1) {
            dots[i].classList.add("active");
        } else {
            dots[i].classList.remove("active");
        }
    }
    
    // Back button visibility
    const backBtn = document.getElementById("btn-onboard-back");
    if (currentOnboardSlide > 1) {
        backBtn.style.display = "inline-block";
    } else {
        backBtn.style.display = "none";
    }
    
    // Next/Finish text
    const nextBtn = document.getElementById("btn-onboard-next");
    if (currentOnboardSlide === totalOnboardSlides) {
        nextBtn.innerText = "Begin Journey";
    } else {
        nextBtn.innerText = "Next";
    }
}

// --- Timeline Schedule Manager ---
function renderTimeline() {
    const track = document.getElementById("workday-timeline-track");
    if (!track) return;
    track.innerHTML = "";
    
    const startHour = state.shiftStart;
    const endHour = state.shiftEnd;
    
    // Draw hours rows
    for (let h = startHour; h <= endHour; h++) {
        const hourRow = document.createElement("div");
        hourRow.classList.add("timeline-hour-row");
        
        const label = document.createElement("div");
        label.classList.add("hour-label");
        // Format AM/PM
        let displayHour = h;
        let suffix = "AM";
        if (h === 12) {
            suffix = "PM";
        } else if (h > 12) {
            displayHour = h - 12;
            suffix = "PM";
        }
        label.innerText = `${displayHour}:00 ${suffix}`;
        
        const trackBg = document.createElement("div");
        trackBg.classList.add("timeline-track-bg");
        trackBg.dataset.hour = h;
        
        // Add click handler to add dynamic meetings on timeline
        trackBg.addEventListener("click", (e) => {
            if (e.target.classList.contains("timeline-track-bg")) {
                const clickedHour = parseFloat(e.target.dataset.hour);
                const confirmAdd = confirm(`Would you like to book a quick 30-minute meeting slot at ${displayHour}:30 ${suffix}?`);
                if (confirmAdd) {
                    state.meetings.push({
                        id: "dynamic-" + Date.now(),
                        name: "Ad-hoc Meeting",
                        start: clickedHour + 0.5,
                        end: clickedHour + 1.0
                    });
                    // Sort meetings by start time
                    state.meetings.sort((a,b) => a.start - b.start);
                    saveState();
                    renderTimeline();
                    updateProposedQuest();
                }
            }
        });
        
        hourRow.appendChild(label);
        hourRow.appendChild(trackBg);
        track.appendChild(hourRow);
    }
    
    // Inject visual meeting blocks and calculate gaps
    const rows = track.querySelectorAll(".timeline-track-bg");
    
    // Clean overlap meetings
    state.meetings.forEach(meet => {
        const rowIdx = Math.floor(meet.start) - startHour;
        if (rowIdx >= 0 && rowIdx < rows.length) {
            const trackWidth = rows[rowIdx].clientWidth;
            const startFrac = meet.start % 1;
            const duration = meet.end - meet.start;
            
            const block = document.createElement("div");
            block.classList.add("timeline-block", "meeting");
            block.style.left = `${startFrac * 100}%`;
            block.style.width = `${duration * 100}%`;
            block.innerText = meet.name;
            block.title = `${meet.name} (${formatDecimalTime(meet.start)} - ${formatDecimalTime(meet.end)})`;
            
            // Double click to remove meeting
            block.addEventListener("dblclick", () => {
                const remove = confirm(`Remove "${meet.name}" meeting slot?`);
                if (remove) {
                    state.meetings = state.meetings.filter(m => m.id !== meet.id);
                    saveState();
                    renderTimeline();
                    updateProposedQuest();
                }
            });
            
            rows[rowIdx].appendChild(block);
        }
    });

    // Highlight Gaps (non-meeting regions)
    // Build array of gaps
    let busyRanges = state.meetings.map(m => ({ start: m.start, end: m.end }));
    let gapRanges = [];
    let currentPos = startHour;
    
    busyRanges.forEach(range => {
        if (range.start > currentPos) {
            gapRanges.push({ start: currentPos, end: range.start });
        }
        if (range.end > currentPos) {
            currentPos = range.end;
        }
    });
    if (currentPos < endHour) {
        gapRanges.push({ start: currentPos, end: endHour });
    }
    
    // Draw Gaps
    gapRanges.forEach((gap, idx) => {
        const durationMin = Math.round((gap.end - gap.start) * 60);
        if (durationMin < 15) return; // Skip tiny gaps
        
        // Place movement suggestion cards inside gaps
        const rowIdx = Math.floor(gap.start) - startHour;
        if (rowIdx >= 0 && rowIdx < rows.length) {
            const startFrac = gap.start % 1;
            // Let's place a 10-minute gap preview on the timeline
            const block = document.createElement("div");
            block.classList.add("timeline-block", "movement-gap");
            
            // Fit to end of meeting gap
            const gapLength = Math.min(0.25, gap.end - gap.start); // cap visually at 15m representation
            block.style.left = `${startFrac * 100}%`;
            block.style.width = `${gapLength * 100}%`;
            block.innerText = "Reset Opportunity";
            block.title = `Gap available at ${formatDecimalTime(gap.start)} (${durationMin} min). Click to schedule!`;
            
            block.addEventListener("click", (e) => {
                e.stopPropagation();
                // Schedule a quest for this gap
                const matchedQuest = QUESTS_LIBRARY[idx % QUESTS_LIBRARY.length];
                currentQuest = matchedQuest;
                setupLiveQuest(matchedQuest);
                synth.playChime("start");
                
                // Switch focus toToday
                document.querySelector('[data-tab="today"]').click();
            });
            
            rows[rowIdx].appendChild(block);
        }
    });
}

function formatDecimalTime(val) {
    const hours = Math.floor(val);
    const mins = Math.round((val % 1) * 60);
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 12 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMins = mins === 0 ? "00" : mins < 10 ? "0" + mins : mins;
    return `${displayHour}:${displayMins} ${suffix}`;
}

// --- Dashboard Logic ---
function updateDashboard() {
    // Sync personal header values
    const uName = document.getElementById("sidebar-username");
    if (uName) uName.innerText = state.userName;
    const uAvatar = document.getElementById("sidebar-avatar");
    if (uAvatar) uAvatar.innerText = state.userName[0];
    const greeting = document.getElementById("dashboard-greeting");
    if (greeting) {
        const hr = new Date().getHours();
        let greetText = "Good morning";
        if (hr >= 12 && hr < 17) greetText = "Good afternoon";
        else if (hr >= 17) greetText = "Good evening";
        greeting.innerText = `${greetText}, ${state.userName}`;
    }
    
    // Streaks and levels
    const streakVal = document.getElementById("streak-counter-value");
    if (streakVal) streakVal.innerText = `${state.streak}d streak`;
    const lvlLabel = document.getElementById("level-display-label");
    if (lvlLabel) lvlLabel.innerText = `Level ${state.level}`;
    const xpLabel = document.getElementById("xp-display-label");
    if (xpLabel) xpLabel.innerText = `${state.xp} / 1000 XP`;
    const xpBar = document.getElementById("xp-progress-fill-bar");
    if (xpBar) xpBar.style.width = `${(state.xp / 1000) * 100}%`;
    
    // Toggle active shield
    const shieldChk = document.getElementById("streak-shield-toggle-chk");
    if (shieldChk) shieldChk.checked = state.shieldActive;
    
    // Render child containers
    renderDailyQuests();
    renderStiffnessCheckGroup();
    calculateCoachingResets();
    renderTimeline();
}

// --- Render stiffness scan group buttons in dashboard ---
function renderStiffnessCheckGroup() {
    const container = document.getElementById("stiffness-check-group");
    if (!container) return;
    container.innerHTML = "";
    
    const parts = [
        { key: "neck", label: "🦒 Neck" },
        { key: "shoulders", label: "🤷 Shoulders" },
        { key: "wrists", label: "🖐️ Wrists" },
        { key: "back", label: "🧘 Back" },
        { key: "legs", label: "🦵 Legs" }
    ];
    
    parts.forEach(part => {
        const currentVal = state.bodyStiffness[part.key] || 0; // 0 = None, 1 = Mild, 2 = Tight
        
        const row = document.createElement("div");
        row.classList.add("stiffness-chip-row");
        
        const label = document.createElement("span");
        label.classList.add("stiffness-chip-label");
        label.innerText = part.label;
        
        const btnGroup = document.createElement("div");
        btnGroup.classList.add("stiffness-btn-group");
        
        // Render 3 buttons: None, Mild, Tight
        const levels = [
            { val: 0, label: "None", activeClass: "active-none" },
            { val: 1, label: "Mild", activeClass: "active-mild" },
            { val: 2, label: "Tight", activeClass: "active-tight" }
        ];
        
        levels.forEach(lvl => {
            const btn = document.createElement("button");
            btn.classList.add("stiffness-btn");
            btn.innerText = lvl.label;
            if (currentVal === lvl.val) {
                btn.classList.add(lvl.activeClass);
            }
            
            btn.addEventListener("click", () => {
                state.bodyStiffness[part.key] = lvl.val;
                saveState();
                renderStiffnessCheckGroup();
                calculateCoachingResets();
                synth.playChime("next");
            });
            
            btnGroup.appendChild(btn);
        });
        
        row.appendChild(label);
        row.appendChild(btnGroup);
        container.appendChild(row);
    });
}

// --- Adaptive Coaching recommendation engine ---
function calculateCoachingResets() {
    const stiffness = state.bodyStiffness || { neck: 0, shoulders: 0, wrists: 0, back: 0, legs: 0 };
    
    // Find the tightest body part
    let tightestPart = "none";
    let maxStiffness = 0;
    
    // Priority order in case of ties: neck -> shoulders -> back -> wrists -> legs
    const partsOrder = ["neck", "shoulders", "back", "wrists", "legs"];
    partsOrder.forEach(part => {
        const val = stiffness[part] || 0;
        if (val > maxStiffness) {
            maxStiffness = val;
            tightestPart = part;
        }
    });
    
    let targetQuest = QUESTS_LIBRARY[0]; // Default: Posture Reset
    let insightHeadline = "Coaching Focus: Posture Recovery";
    let insightBody = "No active stiffness logged. Proposing standard mobility flows to protect your body against silent strain build-up.";
    let bullets = [
        { text: "Prolonged sitting triggers hidden posture stress even when you feel fine.", critical: false },
        { text: "Every 45 minutes of keyboard use should be met with 3 minutes of shoulder extensions.", critical: false }
    ];
    let isCritical = false;
    let xpAward = 80;
    
    if (maxStiffness > 0) {
        isCritical = true;
        xpAward = 100; // Critical quests award extra XP!
        
        switch (tightestPart) {
            case "neck":
                targetQuest = QUESTS_LIBRARY.find(q => q.id === "posture-reset") || QUESTS_LIBRARY[0];
                insightHeadline = "Coaching Focus: Cervical Spine Defense";
                insightBody = "Critical neck tightness logged. Proposing deep cervical releases to protect cranial nerve pathways.";
                bullets = [
                    { text: "Cervical spine compression is the primary cause of workday computer headaches.", critical: true },
                    { text: "Retracting the neck 2 inches back resets cervical posture alignment immediately.", critical: true }
                ];
                break;
            case "shoulders":
                targetQuest = QUESTS_LIBRARY.find(q => q.id === "shoulder-rolls") || QUESTS_LIBRARY[6] || QUESTS_LIBRARY[0];
                insightHeadline = "Coaching Focus: Shoulder Scapular Release";
                insightBody = "High shoulder strain logged. Engaging rotational mobility to relieve forward posture load.";
                bullets = [
                    { text: "Rotator cuff muscles undergo continuous static contraction when hands are on a keyboard.", critical: true },
                    { text: "Shoulder rolls increase synovial fluid circulation inside the shoulder joint socket.", critical: true }
                ];
                break;
            case "wrists":
                targetQuest = QUESTS_LIBRARY.find(q => q.id === "wrist-stretch") || QUESTS_LIBRARY[1];
                insightHeadline = "Coaching Focus: Carpal Tunnel Relief Loop";
                insightBody = "High repetitive wrist load logged. Prioritizing tendon gliding to counter typing stress.";
                bullets = [
                    { text: "Wrist flexor tendons thicken under repetitive keyboard strokes, causing nerve compression.", critical: true },
                    { text: "Extending your wrist back pulls and stretches the tight flexor carpi radialis muscle.", critical: true }
                ];
                break;
            case "back":
                targetQuest = QUESTS_LIBRARY.find(q => q.id === "back-twist") || QUESTS_LIBRARY[2];
                insightHeadline = "Coaching Focus: Lumbar Spine Rotation";
                insightBody = "Lower back stiffness logged. Activating thoracic spine rotation to unload disk pressure.";
                bullets = [
                    { text: "Static seated postures concentrate 140% more pressure on lumbar disks compared to standing.", critical: true },
                    { text: "Spine twisting stretches deep multifidus muscles and increases disk fluid absorption.", critical: true }
                ];
                break;
            case "legs":
                targetQuest = QUESTS_LIBRARY.find(q => q.id === "calf-raises") || QUESTS_LIBRARY[3];
                insightHeadline = "Coaching Focus: Lower Body Venous Pump";
                insightBody = "Leg or hip fatigue logged. Engaging calf triggers to counter blood pooling in lower extremities.";
                bullets = [
                    { text: "Sitting stops the calf muscle pump, reducing overall lower body venous circulation.", critical: true },
                    { text: "Calf raises contract soleus muscles, immediately pushing pooled blood back to the heart.", critical: true }
                ];
                break;
        }
    }
    
    // Save as current proposed quest
    currentQuest = targetQuest;
    
    // Update Today dashboard Quest Card elements
    const titleEl = document.getElementById("primary-quest-title");
    const descEl = document.getElementById("primary-quest-description");
    const timeEl = document.getElementById("primary-quest-time");
    const xpEl = document.getElementById("primary-quest-xp");
    
    if (titleEl) {
        if (isCritical) {
            titleEl.innerHTML = `${targetQuest.name} <span class="quest-critical-badge">Critical Body Defense</span>`;
        } else {
            titleEl.innerHTML = `${targetQuest.name}`;
        }
    }
    if (descEl) descEl.innerText = targetQuest.desc;
    if (timeEl) timeEl.innerText = `${targetQuest.duration} min`;
    if (xpEl) xpEl.innerText = `+${xpAward} XP`;
    
    // Update insight panel
    const headInsight = document.getElementById("coach-insight-headline");
    const bodyInsight = document.getElementById("coach-insight-body");
    const bulletContainer = document.getElementById("coach-defense-bullets");
    
    if (headInsight) headInsight.innerText = insightHeadline;
    if (bodyInsight) bodyInsight.innerText = insightBody;
    
    if (bulletContainer) {
        bulletContainer.innerHTML = "";
        bullets.forEach(bullet => {
            const div = document.createElement("div");
            div.classList.add("coach-bullet");
            div.innerHTML = `
                <span class="coach-bullet-dot ${bullet.critical ? '' : 'normal'}"></span>
                <span class="coach-bullet-text">${bullet.text}</span>
            `;
            bulletContainer.appendChild(div);
        });
    }
}

function renderDailyQuests() {
    const container = document.getElementById("daily-quests-board-container");
    if (!container) return;
    container.innerHTML = "";
    
    state.dailyQuests.forEach(quest => {
        const isDone = quest.completed || quest.current >= quest.target;
        const item = document.createElement("div");
        item.classList.add("daily-quest-item");
        
        item.innerHTML = `
            <div class="daily-quest-top">
                <span class="daily-quest-name">${quest.name}</span>
                <span class="daily-quest-status-bullet ${isDone ? 'completed' : ''}"></span>
            </div>
            <div class="daily-quest-bottom">
                <span class="daily-quest-xp">+${quest.xp} XP</span>
                <span class="daily-quest-progress-label">${quest.current}/${quest.target}</span>
            </div>
        `;
        
        // Interactive selection: clicking a daily quest makes it the active live quest!
        item.addEventListener("click", () => {
            let matched = QUESTS_LIBRARY.find(q => q.name.includes(quest.name.split(" ")[0]));
            if (!matched) matched = QUESTS_LIBRARY[0];
            currentQuest = matched;
            setupLiveQuest(matched);
            synth.playChime("start");
        });
        container.appendChild(item);
    });
}

const STEP_TEMPLATES = {
    "posture-reset": [
        { title: "Shoulder Rolls", desc: "Roll shoulders backward slowly. Breathe deeply.", duration: 60, animation: "animate-shoulders", svg: "shoulders" },
        { title: "Neck Release", desc: "Tilt ear to shoulder, hold 15s each side.", duration: 60, animation: "animate-neck", svg: "neck" },
        { title: "Wrist Flex", desc: "Flex fingers back gently. Release tightness.", duration: 60, animation: "animate-wrist", svg: "wrist" },
        { title: "Chest Stretch", desc: "Interlock fingers behind back and pull shoulders back.", duration: 60, animation: "animate-shoulders", svg: "shoulders" }
    ],
    "wrist-stretch": [
        { title: "Wrist Flex", desc: "Flex fingers back gently. Release tightness.", duration: 60, animation: "animate-wrist", svg: "wrist" },
        { title: "Finger Fans", desc: "Spread fingers wide, then make tight fists.", duration: 60, animation: "animate-wrist", svg: "wrist" },
        { title: "Forearm Rub", desc: "Massage tight extensor muscles on forearms.", duration: 60, animation: "animate-wrist", svg: "wrist" }
    ],
    "back-twist": [
        { title: "Seated Spine Twist", desc: "Twist upper body left, hold 15s, then right.", duration: 100, animation: "animate-twist", svg: "twist" },
        { title: "Shoulder Retraction", desc: "Pinch shoulder blades together and release.", duration: 100, animation: "animate-shoulders", svg: "shoulders" },
        { title: "Neck Stretches", desc: "Look over left shoulder, hold, then right.", duration: 100, animation: "animate-neck", svg: "neck" }
    ],
    "seated-plank": [
        { title: "Core Engagement", desc: "Sit on chair edge, lean back 45 degrees, lift feet slightly, hold abdominal core tight.", duration: 120, animation: "animate-plank", svg: "seated_plank" },
        { title: "Diaphragm Breaths", desc: "Inhale for 4s, hold, exhale 4s while maintaining abdominal core tension.", duration: 120, animation: "animate-plank", svg: "seated_plank" }
    ],
    "default": [
        { title: "Dynamic Rolls", desc: "Roll shoulders and neck smoothly.", duration: 60, animation: "animate-shoulders", svg: "shoulders" },
        { title: "Tension Release", desc: "Inhale shrug shoulders up, exhale drop them.", duration: 60, animation: "animate-shoulders", svg: "shoulders" },
        { title: "Diaphragm Breaths", desc: "Inhale for 4s, hold 4s, exhale 4s.", duration: 120, animation: "animate-lungs", svg: "lungs" }
    ],
    "deep-breaths": [
        { title: "Inhale & Expand", desc: "Inhale deep through your nose, expanding your abdomen and lungs.", duration: 60, animation: "animate-lungs", svg: "lungs" },
        { title: "Exhale & Contract", desc: "Exhale slow and empty your chest. Feel the diaphragm release.", duration: 60, animation: "animate-lungs", svg: "lungs" }
    ],
    "eye-focus": [
        { title: "Look Near & Far", desc: "Focus on your thumb held near, then focus on a distant object. Repeat.", duration: 60, animation: "animate-eyes", svg: "eyes" },
        { title: "Lateral Eye Movements", desc: "Look as far left as possible, then look far right. Move slowly.", duration: 60, animation: "animate-eyes", svg: "eyes" }
    ],
    
    // New exercises
    "seated-spinal-twist": [
        { title: "Twist Left", desc: "Twist upper body left, hold ribcage, breathe.", duration: 30, animation: "animate-twist", svg: "twist" },
        { title: "Twist Right", desc: "Twist upper body right, stretch spinal columns.", duration: 30, animation: "animate-twist", svg: "twist" }
    ],
    "figure-4-stretch": [
        { title: "Left Leg", desc: "Cross left ankle over right knee. Lean forward from hips.", duration: 45, animation: "animate-fig4", svg: "figure4" },
        { title: "Right Leg", desc: "Cross right ankle over left knee. Lean forward from hips.", duration: 45, animation: "animate-fig4", svg: "figure4" }
    ],
    "chin-tucks": [
        { title: "Neck Retraction", desc: "Pull chin straight back (make double chin). Hold 3s. Repeat 10 times.", duration: 60, animation: "animate-chin", svg: "chin_tucks" }
    ],
    "wrist-extensor": [
        { title: "Extensor Stretch", desc: "Extend arm, pull fingers down toward body. Hold 30s.", duration: 60, animation: "animate-wrist", svg: "wrist" },
        { title: "Flexor Stretch", desc: "Extend arm, pull fingers back toward ceiling. Hold 30s.", duration: 60, animation: "animate-wrist", svg: "wrist" }
    ],
    "glute-squeezes": [
        { title: "Glute Firing", desc: "Squeeze glutes maximum. Hold 5s. Repeat 10 times.", duration: 60, animation: "animate-squat", svg: "legs" }
    ],
    "scapular-retractions": [
        { title: "Rhomboid Squeezes", desc: "Pinch shoulder blades back. Hold 2s. Repeat 15 times.", duration: 60, animation: "animate-shoulders", svg: "shoulders" }
    ],
    "doorway-stretch": [
        { title: "Pectoral Stretch", desc: "Place forearms on doorframe, lean chest forward.", duration: 60, animation: "animate-doorway", svg: "doorway_stretch" },
        { title: "Breathing", desc: "Hold doorway stretch and breathe deep.", duration: 60, animation: "animate-doorway", svg: "doorway_stretch" }
    ],
    "side-bends": [
        { title: "Left Bend", desc: "Reach right arm overhead, bend upper body left.", duration: 60, animation: "animate-sidebend", svg: "sidebend" },
        { title: "Right Bend", desc: "Reach left arm overhead, bend upper body right.", duration: 60, animation: "animate-sidebend", svg: "sidebend" }
    ],
    "hip-flexor-stretch": [
        { title: "Left Lunge Stretch", desc: "Step right foot forward in supported lunge, tuck pelvis.", duration: 45, animation: "animate-lunge", svg: "lunge" },
        { title: "Right Lunge Stretch", desc: "Step left foot forward in supported lunge, tuck pelvis.", duration: 45, animation: "animate-lunge", svg: "lunge" }
    ],
    "hamstring-sweeps": [
        { title: "Alternating Sweeps", desc: "Step forward, extend leg, hinge at hips and sweep arms low.", duration: 60, animation: "animate-sweep", svg: "hamstring_sweep" }
    ],
    "sit-to-stand": [
        { title: "Chair Squats", desc: "Stand up from chair using glutes and quads. Sit back down.", duration: 60, animation: "animate-squat", svg: "squats" }
    ],
    "calf-raises": [
        { title: "Soleus Venous Pump", desc: "Raise heels off floor, squeeze calf muscles. Lift and hold 2s.", duration: 60, animation: "animate-calf", svg: "calf" },
        { title: "Soleus Stretch", desc: "Press one heel back into floor, stretching calf muscle.", duration: 60, animation: "animate-sidebend", svg: "sidebend" }
    ],
    "standing-calf-raises": [
        { title: "Soleus Venous Pump", desc: "Raise heels off floor, squeeze calf muscles. Lift and hold 2s.", duration: 60, animation: "animate-calf", svg: "calf" }
    ],
    "air-squats": [
        { title: "Air Squats", desc: "Squat down, hips back, knees out. Aim for 15-20 reps.", duration: 60, animation: "animate-squat", svg: "squats" }
    ],
    "leg-extensions": [
        { title: "Left Extension", desc: "Extend left leg straight out. Hold 30s.", duration: 60, animation: "animate-leg-ext", svg: "leg_extension" },
        { title: "Right Extension", desc: "Extend right leg straight out. Hold 30s.", duration: 60, animation: "animate-leg-ext", svg: "leg_extension" }
    ],
    "desk-pushups": [
        { title: "Desk Incline Pushups", desc: "Hands on desk edge, keep straight body line. Flex arms.", duration: 60, animation: "animate-pushup", svg: "pushups" }
    ],
    "stair-climbing": [
        { title: "Stair snack climbing", desc: "Briskly walk/climb stairs up and down continuously.", duration: 120, animation: "animate-march", svg: "march" }
    ],
    "desk-plank": [
        { title: "Isometric Desk Plank", desc: "Forearms on desk edge, hold straight plank. Engage abs.", duration: 60, animation: "animate-plank", svg: "desk_plank" }
    ],
    "high-knees": [
        { title: "Marching in place", desc: "Drive knees high to waist level. Swing arms.", duration: 60, animation: "animate-march", svg: "march" }
    ],
    "rebounding": [
        { title: "Lymphatic Bounces", desc: "Bounce lightly in place, absorb impact through knees.", duration: 60, animation: "animate-bounce", svg: "rebound" }
    ],
    "pacing": [
        { title: "Walking call pacing", desc: "Walk slowly around your room/office during active call.", duration: 300, animation: "animate-march", svg: "march" }
    ]
};

// Movement vectors to inject
const MOVEMENT_SVGS = {
    shoulders: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 40, 80 40, 80 50 L75 60 L25 60 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            <g class="head-node">
                <rect x="47" y="22" width="6" height="12" fill="var(--text-color)"></rect>
                <circle cx="50" cy="18" r="10" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            </g>
            <circle class="shoulder-joint" cx="28" cy="42" r="5" fill="var(--coral)"></circle>
            <circle class="shoulder-joint" cx="72" cy="42" r="5" fill="var(--coral)"></circle>
        </svg>
    `,
    neck: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 42, 80 42, 80 50 L75 60 L25 60 Z" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></path>
            <g class="head-node">
                <rect x="47" y="25" width="6" height="10" fill="var(--text-color)"></rect>
                <circle cx="50" cy="19" r="9" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            </g>
        </svg>
    `,
    wrist: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Extended Arm (underneath) -->
            <path d="M10 32 L46 32 C48 32, 50 30, 50 26 L52 14 C52 10, 48 8, 48 8 L44 26 L10 26 Z" fill="rgba(243, 196, 92, 0.2)" stroke="var(--text-muted)" stroke-width="1.5"></path>
            <!-- Stretching Hand (extended upward) -->
            <g class="wrist-node">
                <!-- Palm & Fingers extending up/back -->
                <path d="M46 26 L54 6 C55 4, 57 4, 58 6 L59 20 L48 28 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></path>
                <!-- Thumb -->
                <path d="M46 24 L40 18 L38 20 L44 26 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1"></path>
            </g>
        </svg>
    `,
    twist: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 40, 80 40, 80 50 L75 60 L25 60 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            <g class="torso-node">
                <rect x="38" y="34" width="24" height="12" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></rect>
                <circle cx="50" cy="20" r="8" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
            </g>
        </svg>
    `,
    legs: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <rect x="42" y="10" width="16" height="24" rx="4" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></path>
            <g class="leg-extended">
                <rect x="44" y="32" width="6" height="18" rx="2" fill="var(--text-color)"></rect>
                <rect x="44" y="46" width="14" height="5" rx="2" fill="var(--coral)"></rect>
            </g>
            <circle cx="50" cy="6" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
        </svg>
    `,
    squats: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <g class="squat-node">
                <circle cx="50" cy="12" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <path d="M40 20 H60 L55 38 H45 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2"></path>
                <path d="M45 38 L40 54 M55 38 L60 54" stroke="var(--text-color)" stroke-width="2.5"></path>
            </g>
        </svg>
    `,
    pushups: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <line x1="75" y1="20" x2="75" y2="58" stroke="var(--text-color)" stroke-width="3"></line>
            <g class="pushup-node">
                <circle cx="45" cy="18" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <line x1="45" y1="24" x2="25" y2="48" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"></line>
                <polyline points="42 28 65 30 75 30" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
    march: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            <rect x="44" y="22" width="12" height="18" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></rect>
            <rect class="leg-left" x="43" y="40" width="4" height="15" fill="var(--coral)"></rect>
            <rect class="leg-right" x="53" y="40" width="4" height="15" fill="var(--primary)"></rect>
        </svg>
    `,
    sidebend: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <g class="upper-body">
                <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <path d="M42 22 L58 22 L54 44 L46 44 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2"></path>
            </g>
            <rect x="45" y="44" width="4" height="14" fill="var(--text-muted)"></rect>
            <rect x="51" y="44" width="4" height="14" fill="var(--text-muted)"></rect>
        </svg>
    `,
    eyes: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Left Eye -->
            <path d="M22 30 Q36 15 50 30 Q36 45 22 30 Z" fill="none" stroke="var(--text-color)" stroke-width="2"></path>
            <!-- Right Eye -->
            <path d="M50 30 Q64 15 78 30 Q64 45 50 30 Z" fill="none" stroke="var(--text-color)" stroke-width="2"></path>
            <!-- Pupils -->
            <g class="eyes-pupils">
                <circle class="pupil-left" cx="36" cy="30" r="5" fill="var(--coral)"></circle>
                <circle class="pupil-right" cx="64" cy="30" r="5" fill="var(--coral)"></circle>
            </g>
        </svg>
    `,
    calf: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <line x1="10" y1="50" x2="90" y2="50" stroke="var(--text-muted)" stroke-width="2"></line>
            <g class="calf-raise-node">
                <!-- Shin and Calf profile -->
                <path d="M44 14 L49 38 L32 46 L46 48 L50 14 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
                <!-- Foot profile -->
                <path d="M32 46 L14 47 L20 50 L46 48 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></path>
            </g>
        </svg>
    `,
    seated_plank: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair frame -->
            <path d="M22 24 H38 V40 H22 Z M38 32 H46 L44 54 M27 40 L25 54 M35 40 L33 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <!-- Leaning plank body -->
            <g class="plank-body">
                <circle cx="44" cy="18" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Core area -->
                <path d="M42 24 L32 38 L38 42 L48 26 Z" fill="rgba(243, 107, 84, 0.3)" stroke="var(--coral)" stroke-width="2"></path>
                <!-- Legs raised straight out -->
                <line x1="38" y1="42" x2="64" y2="40" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <line x1="64" y1="40" x2="74" y2="48" stroke="var(--text-color)" stroke-width="2.5" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
    figure4: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair frame -->
            <path d="M28 26 H43 V44 H28 Z M43 36 H50 L48 54 M33 44 L31 54 M41 44 L39 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <g class="figure4-body">
                <!-- Torso leaning forward -->
                <circle cx="54" cy="16" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <path d="M50 22 L40 38 L30 38 L42 22 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            </g>
            <!-- Standing leg -->
            <line x1="40" y1="38" x2="40" y2="54" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Crossed leg in 4 position -->
            <polyline points="40 38 24 40 40 44" fill="none" stroke="var(--coral)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
    `,
    lunge: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Wall on the left -->
            <line x1="20" y1="10" x2="20" y2="52" stroke="var(--text-muted)" stroke-width="3"></line>
            <!-- Ground plane -->
            <line x1="10" y1="52" x2="95" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Lunge figure -->
            <g class="lunge-hips">
                <circle cx="45" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Torso leaning forward slightly -->
                <line x1="45" y1="20" x2="45" y2="36" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Arms pressing against wall -->
                <polyline points="45 20 28 20 20 20" fill="none" stroke="var(--text-color)" stroke-width="2" stroke-linecap="round"></polyline>
                <!-- Front bent leg -->
                <polyline points="45 36 34 40 34 52" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <!-- Rear extended leg straight back (coral highlight for calf) -->
                <polyline points="45 36 58 42 70 52" fill="none" stroke="var(--coral)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
    desk_plank: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Desk -->
            <path d="M60 28 M60 28 H90 M85 28 L85 52 M65 28 L65 52" stroke="var(--text-muted)" stroke-width="2" fill="none"></path>
            <!-- Plank body -->
            <g class="plank-body">
                <circle cx="56" cy="16" r="5" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Trunk and legs as a straight plank -->
                <line x1="53" y1="21" x2="25" y2="48" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"></line>
                <!-- Arm resting on desk surface -->
                <polyline points="53 23 60 28 66 28" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
    leg_extension: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair -->
            <path d="M28 26 H44 V42 H28 Z M44 34 H48 L46 54 M32 42 L30 54 M40 42 L38 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <!-- Sitting torso -->
            <circle cx="36" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
            <line x1="36" y1="20" x2="36" y2="36" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Stationary bent leg -->
            <polyline points="36 36 42 42 42 54" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"></polyline>
            <!-- Extending leg -->
            <g class="leg-extending-node">
                <!-- Thigh -->
                <line x1="36" y1="36" x2="48" y2="36" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Shin extending from knee (48, 36) -->
                <line class="shin-path" x1="48" y1="36" x2="48" y2="48" stroke="var(--coral)" stroke-width="2.5" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
    hamstring_sweep: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Floor line -->
            <line x1="10" y1="52" x2="90" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Standing Leg -->
            <line x1="40" y1="34" x2="40" y2="52" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Extended Hamstring Leg (heel on floor) -->
            <line x1="40" y1="34" x2="56" y2="50" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></line>
            <!-- Hinging Torso and Arm sweeping -->
            <g class="sweep-torso">
                <circle cx="48" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Upper body spine -->
                <line x1="40" y1="34" x2="48" y2="20" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Sweeping arm -->
                <line class="sweep-arm" x1="48" y1="20" x2="48" y2="38" stroke="var(--coral)" stroke-width="2" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
    doorway_stretch: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Left & Right Doorframe lines -->
            <line x1="25" y1="10" x2="25" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            <line x1="75" y1="10" x2="75" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            <!-- Figure standing between frames, chest pushing forward -->
            <g class="doorway-chest">
                <circle cx="50" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Chest/Shoulder bar -->
                <line x1="38" y1="22" x2="62" y2="22" stroke="var(--text-color)" stroke-width="3"></line>
                <!-- Arms hooked on frames -->
                <polyline points="38 22 25 22 25 34" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></polyline>
                <polyline points="62 22 75 22 75 34" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></polyline>
                <!-- Spine & Legs -->
                <line x1="50" y1="22" x2="50" y2="40" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"></line>
                <line x1="50" y1="40" x2="44" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
                <line x1="50" y1="40" x2="56" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            </g>
        </svg>
    `,
    chin_tucks: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Spine column -->
            <path d="M46 50 Q48 38 46 26" fill="none" stroke="var(--text-muted)" stroke-width="4" stroke-linecap="round"></path>
            <!-- Sliding head and jaw profile -->
            <g class="chin-node">
                <!-- Neck connection -->
                <rect x="42" y="22" width="7" height="12" fill="var(--text-color)"></rect>
                <!-- Head -->
                <circle cx="48" cy="16" r="8" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Jaw and nose facing left -->
                <path d="M40 16 L34 16 L34 20 L40 22 Z" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1"></path>
            </g>
        </svg>
    `,
    rebound: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Floor line -->
            <line x1="20" y1="52" x2="80" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Bouncing Figure -->
            <g class="bounce-body">
                <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <!-- Torso -->
                <rect x="44" y="22" width="12" height="18" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></rect>
                <!-- Left Leg (slightly bent) -->
                <polyline points="46 40 46 48 42 52" fill="none" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <!-- Right Leg (slightly bent) -->
                <polyline points="54 40 54 48 58 52" fill="none" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
    lungs: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Trachea -->
            <path d="M50 10 L50 22 M47 13 H53 M47 17 H53" stroke="var(--text-muted)" stroke-width="2" fill="none"></path>
            <!-- Lungs lobes -->
            <g class="lungs-lobes">
                <!-- Left Lung -->
                <path d="M48 22 C40 20, 26 24, 28 42 C30 50, 44 48, 48 40 Z" fill="rgba(243, 107, 84, 0.2)" stroke="var(--coral)" stroke-width="2"></path>
                <!-- Right Lung -->
                <path d="M52 22 C60 20, 74 24, 72 42 C70 50, 56 48, 52 40 Z" fill="rgba(243, 107, 84, 0.2)" stroke="var(--coral)" stroke-width="2"></path>
            </g>
        </svg>
    `
};

function setupLiveQuest(quest) {
    currentQuest = quest;
    currentStepIdx = 0;
    
    const steps = STEP_TEMPLATES[quest.id] || STEP_TEMPLATES["default"];
    liveTimeRemaining = steps[currentStepIdx].duration;
    liveTimerTotal = steps[currentStepIdx].duration;
    isTimerPaused = true;
    
    // Redraw Widget values
    document.getElementById("live-quest-widget-header").innerText = `Live Reset: ${quest.name}`;
    document.getElementById("btn-live-pause").innerText = "Start";
    
    updateLiveQuestStepUI();
    resetInterval();
}

function updateLiveQuestStepUI() {
    const steps = STEP_TEMPLATES[currentQuest.id] || STEP_TEMPLATES["default"];
    const step = steps[currentStepIdx];
    
    document.getElementById("live-quest-movement-title").innerText = step.title;
    document.getElementById("live-quest-movement-desc").innerText = step.desc;
    
    // Inject matching animated SVG
    const container = document.getElementById("live-quest-illustration-container");
    container.innerHTML = MOVEMENT_SVGS[step.svg] || MOVEMENT_SVGS["shoulders"];
    container.className = step.animation; // Apply animation CSS keyframe
    
    // Draw dots
    const dotsContainer = document.getElementById("live-quest-dots");
    dotsContainer.innerHTML = "";
    steps.forEach((s, idx) => {
        const dot = document.createElement("div");
        dot.classList.add("step-dot");
        if (idx === currentStepIdx) dot.classList.add("active");
        else if (idx < currentStepIdx) dot.classList.add("completed");
        dotsContainer.appendChild(dot);
    });
    
    updateTimerText();
}

function updateTimerText() {
    const min = Math.floor(liveTimeRemaining / 60);
    const sec = liveTimeRemaining % 60;
    const formatted = `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
    
    document.getElementById("live-timer-countdown").innerText = formatted;
    
    // Stroke dashoffset animation
    const circle = document.getElementById("timer-progress-circle");
    if (circle) {
        const pct = liveTimeRemaining / liveTimerTotal;
        const strokeLen = 377; // 2 * pi * r (r=60)
        circle.style.strokeDashoffset = strokeLen * (1 - pct);
    }
}

function resetInterval() {
    if (liveTimerInterval) {
        clearInterval(liveTimerInterval);
    }
    
    liveTimerInterval = setInterval(() => {
        if (!isTimerPaused) {
            if (liveTimeRemaining > 0) {
                liveTimeRemaining--;
                updateTimerText();
            } else {
                handleStepComplete();
            }
        }
    }, 1000);
}

function handleStepComplete() {
    const steps = STEP_TEMPLATES[currentQuest.id] || STEP_TEMPLATES["default"];
    
    synth.playChime("next");
    
    if (currentStepIdx < steps.length - 1) {
        // Next step
        currentStepIdx++;
        liveTimeRemaining = steps[currentStepIdx].duration;
        liveTimerTotal = steps[currentStepIdx].duration;
        updateLiveQuestStepUI();
    } else {
        // Quest Complete!
        completeActiveQuest();
    }
}

function completeActiveQuest() {
    clearInterval(liveTimerInterval);
    isTimerPaused = true;
    
    synth.playChime("complete");
    
    // Reward XP
    const rewardXP = currentQuest.xp;
    addXP(rewardXP);
    
    // Update daily quests
    updateDailyQuestCount(currentQuest.category);
    
    // Update metrics
    state.completedToday++;
    state.stats.totalResets++;
    state.stats.minutesMoved += currentQuest.duration;
    saveState();
    
    alert(`Quest Completed! You earned +${rewardXP} XP. Your body thanks you!`);
    
    // Setup next default suggested quest
    setupLiveQuest(QUESTS_LIBRARY[Math.floor(Math.random() * QUESTS_LIBRARY.length)]);
    updateDashboard();
}

function addXP(amount) {
    state.xp += amount;
    if (state.xp >= 1000) {
        state.xp -= 1000;
        state.level++;
        alert(`🎉 LEVEL UP! You reached Level ${state.level}! Unlocks updated.`);
        // Recalculate unlocks
        state.unlocks.forEach(un => {
            if (state.level >= un.levelReq) {
                un.unlocked = true;
            }
        });
    }
    saveState();
}

function updateDailyQuestCount(category) {
    state.dailyQuests.forEach(quest => {
        // Match category keywords
        if (category === "quiet" && quest.id === "quiet-mob") {
            quest.current = Math.min(quest.target, quest.current + 1);
        } else if (category === "stretch" && quest.id === "wrist-reset") {
            quest.current = Math.min(quest.target, quest.current + 1);
        } else if (category === "strength" && quest.id === "low-sweat-str") {
            quest.current = Math.min(quest.target, quest.current + 1);
        } else if (category === "mobility" && quest.id === "quiet-mob") {
            quest.current = Math.min(quest.target, quest.current + 1);
        }
        
        if (quest.current >= quest.target && !quest.completed) {
            quest.completed = true;
            addXP(quest.xp);
        }
    });
    saveState();
}

// Live Controls Setup
function setupLiveControls() {
    const pauseBtn = document.getElementById("btn-live-pause");
    pauseBtn.addEventListener("click", () => {
        isTimerPaused = !isTimerPaused;
        pauseBtn.innerText = isTimerPaused ? "Resume" : "Pause";
        synth.init();
    });
    
    document.getElementById("btn-live-skip").addEventListener("click", () => {
        const confirmSkip = confirm("Skip to next movement block?");
        if (confirmSkip) {
            handleStepComplete();
        }
    });
    
    document.getElementById("btn-live-easier").addEventListener("click", () => {
        // Shorten timer or adjust description
        liveTimeRemaining = Math.max(10, Math.round(liveTimeRemaining / 2));
        document.getElementById("live-quest-movement-desc").innerText += " (Modifed to low intensity format)";
        updateTimerText();
        synth.playChime("next");
    });
    
    // Suggested card trigger
    document.getElementById("btn-start-quest").addEventListener("click", () => {
        setupLiveQuest(currentQuest);
        isTimerPaused = false;
        pauseBtn.innerText = "Pause";
        synth.playChime("start");
    });
    
    document.getElementById("btn-reroll-quest").addEventListener("click", () => {
        // Choose random from library
        const currentIdx = QUESTS_LIBRARY.indexOf(currentQuest);
        let nextIdx = currentIdx;
        while (nextIdx === currentIdx) {
            nextIdx = Math.floor(Math.random() * QUESTS_LIBRARY.length);
        }
        currentQuest = QUESTS_LIBRARY[nextIdx];
        
        document.getElementById("primary-quest-title").innerText = currentQuest.name;
        document.getElementById("primary-quest-description").innerText = currentQuest.desc;
        document.getElementById("primary-quest-time").innerText = `${currentQuest.duration} min`;
        document.getElementById("primary-quest-xp").innerText = `+${currentQuest.xp} XP`;
        
        synth.playChime("next");
    });
}

// --- Quests Library Tab Rendering ---
function renderQuestsLibrary() {
    const container = document.getElementById("quests-library-container");
    if (!container) return;
    container.innerHTML = "";
    
    QUESTS_LIBRARY.forEach(quest => {
        const card = document.createElement("div");
        card.classList.add("fd-card", "library-card");
        
        card.innerHTML = `
            <div class="library-card-top">
                <span class="library-card-category" style="color: ${quest.category === 'strength' ? 'var(--coral)' : 'var(--primary)'}">${quest.category}</span>
                <h3 class="library-card-title">${quest.name}</h3>
                <p class="library-card-desc">${quest.desc}</p>
            </div>
            <div class="library-card-bottom">
                <div class="library-meta-info">
                    <span>⏱ ${quest.duration} min</span>
                    <span>⚡ ${quest.difficulty}</span>
                </div>
                <button class="btn-secondary btn-start-lib-quest" data-id="${quest.id}">Start</button>
            </div>
        `;
        
        card.querySelector(".btn-start-lib-quest").addEventListener("click", () => {
            setupLiveQuest(quest);
            document.querySelector('[data-tab="today"]').click();
            synth.playChime("start");
        });
        
        container.appendChild(card);
    });
}

// Setup library filter buttons
function setupLibraryFilters() {
    const pills = document.querySelectorAll("#quests-library-filters .filter-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            
            const filter = pill.getAttribute("data-filter");
            const cards = document.querySelectorAll("#quests-library-container .library-card");
            
            cards.forEach((card, idx) => {
                const quest = QUESTS_LIBRARY[idx];
                if (filter === "all" || quest.category === filter || (filter === "quiet" && quest.category === "quiet")) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
}

// --- Calendar Tab Editor ---
function renderCalendarMeetingList() {
    const list = document.getElementById("calendar-view-meetings-list");
    if (!list) return;
    list.innerHTML = "";
    
    state.meetings.forEach((meet) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "8px 0";
        row.style.borderBottom = "1px solid var(--border-color)";
        
        row.innerHTML = `
            <div>
                <strong style="font-size:13.5px;">${meet.name}</strong>
                <span style="color:var(--text-muted); font-size:11.5px; margin-left:8px;">${formatDecimalTime(meet.start)} - ${formatDecimalTime(meet.end)}</span>
            </div>
            <button class="btn-danger" style="padding: 4px 8px; font-size:11px;" data-id="${meet.id}">Delete</button>
        `;
        
        row.querySelector(".btn-danger").addEventListener("click", () => {
            state.meetings = state.meetings.filter(m => m.id !== meet.id);
            saveState();
            renderCalendarMeetingList();
            renderTimeline();
            updateProposedQuest();
        });
        
        list.appendChild(row);
    });
}

function setupCalendarControls() {
    // Add meeting button
    document.getElementById("btn-calendar-add-meeting").addEventListener("click", () => {
        const name = prompt("Meeting Name:", "Sync Session");
        if (!name) return;
        const startStr = prompt("Start Time (e.g. 10:30 AM or 10.5):", "10.5");
        if (!startStr) return;
        const endStr = prompt("End Time (e.g. 11:30 AM or 11.5):", "11.5");
        if (!endStr) return;
        
        let start = parseFloat(startStr);
        let end = parseFloat(endStr);
        
        if (isNaN(start) || isNaN(end)) {
            alert("Invalid decimal format. Use e.g. 9.5 for 9:30.");
            return;
        }
        
        state.meetings.push({
            id: "custom-" + Date.now(),
            name: name,
            start: start,
            end: end
        });
        state.meetings.sort((a,b) => a.start - b.start);
        saveState();
        renderCalendarMeetingList();
        renderTimeline();
        updateProposedQuest();
    });

    document.getElementById("btn-calendar-recalc").addEventListener("click", () => {
        renderTimeline();
        updateProposedQuest();
        alert("Meeting calendar slots re-scanned. Daily posture breaks successfully recalculated!");
    });
    
    // Timeline preset switches
    const presets = document.querySelectorAll(".timeline-preset-btn");
    presets.forEach(btn => {
        btn.addEventListener("click", () => {
            presets.forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            
            const type = btn.getAttribute("data-preset");
            state.activePreset = type;
            state.meetings = [ ...PRESET_SCHEDULES[type] ];
            saveState();
            renderTimeline();
            updateProposedQuest();
            synth.playChime("next");
        });
    });
}

// --- Team Challenge Screen Logic ---
function setupTeamView() {
    const fill = document.getElementById("team-progress-bar-fill");
    const resetsCount = document.getElementById("team-completed-resets");
    const txt = document.getElementById("team-progress-text");
    
    // Opt-in check
    const shieldChk = document.getElementById("streak-shield-toggle-chk");
    shieldChk.addEventListener("change", (e) => {
        state.shieldActive = e.target.checked;
        saveState();
        synth.playChime("next");
    });
    
    // Cheer Board clicks
    const log = document.getElementById("cheer-log-container");
    const cheerBtns = document.querySelectorAll(".cheer-btn");
    cheerBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const cheerType = btn.getAttribute("data-cheer");
            let text = "👋 You sent a High Five to the group!";
            if (cheerType === "keepgoing") text = "🔥 You sent support: Keep Going!";
            if (cheerType === "stretch") text = "🧘 You shared active stretch vibes!";
            if (cheerType === "shield") text = "🛡️ You activated your Streak Shield!";
            
            // Add entry to activity logger
            const item = document.createElement("div");
            item.classList.add("cheer-log-item");
            item.innerText = text;
            log.prepend(item);
            
            // Increment team challenge bar slightly (simulate interactivity)
            const currentPct = parseFloat(fill.style.width || 68);
            const nextPct = Math.min(100, currentPct + 2);
            fill.style.width = `${nextPct}%`;
            txt.innerText = `Desk Crew: ${nextPct}% to shared goal`;
            
            synth.playChime("next");
        });
    });
}

// --- Rewards View Rendering ---
function renderRewardsShowcase() {
    document.getElementById("rewards-level-val").innerText = state.level;
    
    const container = document.getElementById("rewards-unlocks-container");
    if (!container) return;
    container.innerHTML = "";
    
    state.unlocks.forEach(un => {
        const item = document.createElement("div");
        item.classList.add("unlock-item");
        if (un.unlocked) item.classList.add("unlocked");
        
        item.innerHTML = `
            <div class="unlock-icon">${un.icon}</div>
            <div class="unlock-details">
                <span class="unlock-name">${un.name}</span>
                <span class="unlock-level-req ${un.unlocked ? 'unlocked-status' : ''}">
                    ${un.unlocked ? '✓ Unlocked' : 'Requires Lvl ' + un.levelReq}
                </span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// --- Progress/Insights View Setup ---
function updateProgressView() {
    document.getElementById("stats-total-resets").innerText = state.stats.totalResets;
    document.getElementById("stats-total-minutes").innerText = `${state.stats.minutesMoved}m`;
    document.getElementById("stats-streaks-broken").innerText = state.stats.streaksBroken;
    document.getElementById("stats-adherence").innerText = `${state.stats.adherenceRate}%`;
    
    // Toggle active muscle groups based on completion metrics
    const neck = document.getElementById("muscle-neck");
    const shoulders = document.getElementById("muscle-shoulders");
    const wrists = document.getElementById("muscle-wrists");
    const core = document.getElementById("muscle-core");
    const legs = document.getElementById("muscle-legs");
    
    // Simple state mapping to colors
    if (state.completedToday >= 1) {
        neck.classList.add("active-coverage");
        shoulders.classList.add("active-coverage");
    }
    if (state.completedToday >= 2) {
        wrists.classList.add("active-coverage");
    }
    if (state.completedToday >= 3) {
        core.classList.add("active-coverage");
        legs.classList.add("active-coverage");
    }
}

// --- Settings Handler ---
function populateSettings() {
    document.getElementById("settings-name-input").value = state.userName;
    document.getElementById("settings-shift-start").value = state.shiftStart;
    document.getElementById("settings-shift-end").value = state.shiftEnd;
    document.getElementById("settings-notification-style").value = state.notificationStyle;
    document.getElementById("settings-space-restrict").value = state.spaceRestrict;
}

function setupSettingsControls() {
    // Sync settings properties back to state
    document.getElementById("settings-name-input").addEventListener("input", (e) => {
        state.userName = e.target.value || "Maya";
        saveState();
        updateDashboard();
    });

    document.getElementById("settings-shift-start").addEventListener("change", (e) => {
        state.shiftStart = parseInt(e.target.value);
        saveState();
        renderTimeline();
    });
    
    document.getElementById("settings-shift-end").addEventListener("change", (e) => {
        state.shiftEnd = parseInt(e.target.value);
        saveState();
        renderTimeline();
    });
    
    document.getElementById("settings-notification-style").addEventListener("change", (e) => {
        state.notificationStyle = e.target.value;
        saveState();
    });
    
    document.getElementById("settings-space-restrict").addEventListener("change", (e) => {
        state.spaceRestrict = e.target.value;
        saveState();
    });
    
    // Reset Database
    document.getElementById("btn-reset-database").addEventListener("click", () => {
        const wipe = confirm("Are you sure you want to clear your local progress files? This action resets the entire habit calendar database!");
        if (wipe) {
            localStorage.removeItem("wfhmovement_state_v1");
            state = { ...DEFAULT_STATE };
            saveState();
            location.reload();
        }
    });
}

// Mute toggle setup
function setupAudioToggle() {
    const muteBtn = document.getElementById("audio-mute-btn");
    const iconUnmuted = document.getElementById("audio-icon-unmuted");
    const iconMuted = document.getElementById("audio-icon-muted");
    
    muteBtn.addEventListener("click", () => {
        state.muteState = !state.muteState;
        saveState();
        
        if (state.muteState) {
            iconUnmuted.style.display = "none";
            iconMuted.style.display = "block";
        } else {
            iconUnmuted.style.display = "block";
            iconMuted.style.display = "none";
            synth.init();
            synth.playChime("next");
        }
    });
    
    // Initial UI state matching
    if (state.muteState) {
        iconUnmuted.style.display = "none";
        iconMuted.style.display = "block";
    }
}

// --- Positive Quotes System ---
const POSITIVE_QUOTES = [
    "Sustainable momentum is better than constant speed. Breathe.",
    "Deep breaths are like little love notes to your nervous system.",
    "Your body is your only home; give it a 2-minute break.",
    "Taking care of yourself is part of doing a good job.",
    "Pace your day. Rest is not a reward, it is a prerequisite.",
    "Even a 10-second stretch changes the chemistry of your body.",
    "Your value is not determined by your screen time today.",
    "Disconnect to reconnect with your posture, feet, and breath."
];

function initPositiveQuotes() {
    const textEl = document.getElementById("dashboard-quote-text");
    const shuffleBtn = document.getElementById("btn-quote-shuffle");
    if (!textEl) return;
    
    // Choose starting daily quote stably using date index
    const dateIndex = new Date().getDate() % POSITIVE_QUOTES.length;
    textEl.innerText = `"${POSITIVE_QUOTES[dateIndex]}"`;
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
            let currentText = textEl.innerText.replace(/"/g, "");
            let available = POSITIVE_QUOTES.filter(q => q !== currentText);
            let randQuote = available[Math.floor(Math.random() * available.length)];
            textEl.innerText = `"${randQuote}"`;
            
            // Soft click feedback
            synth.playChime("next");
        });
    }
}

// --- App Initialization Entrypoint ---
window.addEventListener("DOMContentLoaded", () => {
    loadState();
    setupTabNavigation();
    initOnboarding();
    initPositiveQuotes();
    setupLiveQuest(currentQuest);
    setupLiveControls();
    setupLibraryFilters();
    setupCalendarControls();
    setupTeamView();
    setupSettingsControls();
    setupAudioToggle();
    updateDashboard();
});
